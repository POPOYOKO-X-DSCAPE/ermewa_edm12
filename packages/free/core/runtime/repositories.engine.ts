import type {
	BuilderFrom,
	EachSelection,
	EntityByName,
	FlatPatch,
	FlatSet,
	HasMeta,
	Params,
	PatchCb,
	Repository,
	Ret,
	Selection,
	SetCb,
} from "../infer/repositories.infer";

import type { GraphDb, ManyRel, OneRel } from "../dsl/graph.definition";
import type {
	ErrorsNode,
	NodeSpec,
	OutputNode,
} from "../infer/graph.infer";
import type { GraphView } from "./graph.engine";
import type { GraphOps } from "./repositories.graph";
import { enhanceRepositoriesWithGraph } from "./repositories.graph";

import type {
	ArrayField,
	EntityObjectField,
	OneOfField,
	OptionalField,
	RefField,
} from "../dsl/state.definition";
import type { Kind } from "../symbols";
import { ENTITY_PRIMARY_KEY } from "../symbols";
import { type ReactiveKey, ReactiveKeys } from "./reactive-keys";
import { stripOptionalType } from "./state.optional";

/* ---------------------------------------------
   GraphDb inference from entity builders
--------------------------------------------- */

type BuilderWithSchema = {
	readonly kind: Kind<string>;
	readonly schema: Record<string, unknown>;
};

type BuilderName<B> = B extends { readonly kind: Kind<infer N> }
	? N
	: never;

type BuilderSchemaFor<
	Builders extends readonly unknown[],
	N extends string,
> = Extract<
	Builders[number],
	{ readonly kind: Kind<N> }
> extends infer B
	? B extends { readonly schema: infer S }
		? S
		: never
	: never;

type Min01<MIN extends number> = MIN extends 0 ? 0 : 1;

type TargetNameFromKind<S extends symbol> = S extends Kind<infer N>
	? N
	: never;

type ToGraphOptionalField<
	Nodes extends string,
	TypeNames extends string,
	F,
> = F extends `${infer T}?`
	? `${ToGraphField<Nodes, TypeNames, T>}?`
	: F extends TypeNames
		? `${F}?`
		: ToGraphField<Nodes, TypeNames, F>;

type ToGraphField<
	Nodes extends string,
	TypeNames extends string,
	F,
> = F extends { readonly __kind: "primaryKey"; readonly of: infer T }
	? T extends TypeNames | `${TypeNames}?`
		? T
		: never
	: F extends TypeNames | `${TypeNames}?`
		? F
		: F extends OneOfField<infer T>
			? OneOfField<T>
			: F extends ArrayField<Record<string, unknown>, infer OF>
				? {
						readonly __kind: "array";
						readonly of: ToGraphField<Nodes, TypeNames, OF>;
					}
				: F extends OptionalField<Record<string, unknown>, infer OF>
					? ToGraphOptionalField<Nodes, TypeNames, OF>
					: F extends EntityObjectField<Record<string, unknown>>
						? {
								readonly [K in keyof F & string]: ToGraphField<
									Nodes,
									TypeNames,
									F[K]
								>;
							}
						: F extends RefField<infer MIN, infer MAX, infer T>
							? TargetNameFromKind<T> extends infer Target
								? Target extends Nodes
									? MAX extends "n"
										? ManyRel<Target> & { readonly min: Min01<MIN> }
										: MAX extends 1
											? OneRel<Target> & { readonly min: Min01<MIN> }
											: ManyRel<Target> & { readonly min: Min01<MIN> }
									: never
								: never
							: never;

type StripMetaKeys<T> = T extends object
	? Omit<T, PropertyKey & symbol>
	: T;

type ToGraphNode<
	Nodes extends string,
	TypeNames extends string,
	Schema,
> = Schema extends Record<string, unknown>
	? {
			readonly [K in keyof Schema & string]: ToGraphField<
				Nodes,
				TypeNames,
				Schema[K]
			>;
		}
	: Record<string, never>;

type InferGraphDbFromBuilders<
	Builders extends readonly unknown[],
	Nodes extends string,
	TypeNames extends string,
> = GraphDb<
	Nodes,
	TypeNames,
	{
		readonly [N in Nodes]: ToGraphNode<
			Nodes,
			TypeNames,
			StripMetaKeys<BuilderSchemaFor<Builders, N>>
		>;
	}
>;

/* ---------------------------------------------
   Runtime: build graph db from builder.schema
--------------------------------------------- */

const isRecord = (v: unknown): v is Record<string, unknown> =>
	typeof v === "object" && v !== null;

const hasKind = (
	v: unknown,
	k: string,
): v is { readonly __kind: string } => isRecord(v) && v.__kind === k;

const isPrimaryKeyValue = (
	v: unknown,
): v is { readonly __kind: "primaryKey"; readonly of: string } =>
	isRecord(v) &&
	v.__kind === "primaryKey" &&
	"of" in v &&
	typeof v.of === "string";

const isArrayValue = (
	v: unknown,
): v is { readonly __kind: "array"; readonly of: unknown } =>
	hasKind(v, "array") && isRecord(v) && "of" in v;

const isOneOfValue = (
	v: unknown,
): v is {
	readonly __kind: "oneOf";
	readonly values: readonly (
		| string
		| number
		| boolean
		| null
		| undefined
	)[];
} =>
	hasKind(v, "oneOf") &&
	isRecord(v) &&
	"values" in v &&
	Array.isArray(v.values);

const isRefValue = (
	v: unknown,
): v is {
	readonly __kind: "ref";
	readonly min: number;
	readonly max: number | "n";
	readonly kind: symbol;
} => {
	if (!isRecord(v)) return false;
	if (v.__kind !== "ref") return false;

	if (!("min" in v) || typeof v.min !== "number") return false;
	if (!("kind" in v) || typeof v.kind !== "symbol") return false;

	if (!("max" in v)) return false;
	const max = v.max;
	if (typeof max === "number") return true;
	return max === "n";
};

const isOptValue = (
	v: unknown,
): v is { readonly __kind: "opt"; readonly of: unknown } => {
	if (!isRecord(v)) return false;
	if (v.__kind !== "opt") return false;
	return "of" in v;
};

const buildGraphFieldRuntime = (
	field: unknown,
	kindToName: Map<symbol, string>,
): unknown => {
	if (typeof field === "string") return field;

	// schema fields are opaque to the graph db: skip the key entirely
	if (hasKind(field, "schema")) return undefined;

	if (isPrimaryKeyValue(field)) return field.of;

	if (isArrayValue(field)) {
		const of = buildGraphFieldRuntime(field.of, kindToName);
		return { __kind: "array", of };
	}

	if (isOptValue(field)) {
		const inner = buildGraphFieldRuntime(field.of, kindToName);
		if (typeof inner === "string") {
			return `${stripOptionalType(inner)}?`;
		}
		return inner;
	}

	if (isRefValue(field)) {
		const target = kindToName.get(field.kind);
		if (!target) return undefined;

		const min = field.min === 0 ? 0 : 1;
		const max = field.max;

		if (max === 1) return { __kind: "one", target, min };
		return { __kind: "many", target, min };
	}

	if (isOneOfValue(field)) {
		return {
			__kind: "oneOf",
			values: field.values,
		};
	}

	if (isRecord(field)) {
		const out: Record<string, unknown> = {};
		for (const k of Object.keys(field)) {
			const v = buildGraphFieldRuntime(field[k], kindToName);
			if (v !== undefined) out[k] = v;
		}
		return out;
	}

	return undefined;
};

const buildGraphDbRuntime = (
	builders: readonly unknown[],
	kindMap: Record<string, symbol>,
): Record<string, unknown> => {
	const kindToName = new Map<symbol, string>();
	for (const name of Object.keys(kindMap)) {
		kindToName.set(kindMap[name], name);
	}

	const db: Record<string, unknown> = {};

	for (const b of builders) {
		const maybe = b as Partial<BuilderWithSchema>;
		if (!maybe.kind || !maybe.schema) continue;

		const name = kindToName.get(maybe.kind);
		if (!name) continue;

		const schema = maybe.schema;
		const node: Record<string, unknown> = {};

		for (const k of Object.keys(schema)) {
			const v = buildGraphFieldRuntime(schema[k], kindToName);
			if (v !== undefined) node[k] = v;
		}

		db[name] = node;
	}

	return db;
};

/* ---------------------------------------------
   Engine
--------------------------------------------- */

type TypeEngineLike<D extends Record<string, unknown>> = {
	load(): D;
};

type SubscriberEngine = {
	notify(source: ReactiveKey): void;
	notifyMany?: (sources: readonly ReactiveKey[]) => void;
};

const notifySources = (
	subscriber: SubscriberEngine,
	sources: readonly ReactiveKey[],
) => {
	if (!sources.length) {
		return;
	}

	const uniqueSources = Array.from(new Set(sources));
	if (typeof subscriber.notifyMany === "function") {
		subscriber.notifyMany(uniqueSources);
		return;
	}

	for (const source of uniqueSources) {
		subscriber.notify(source);
	}
};

export const makeRepositoriesEngine = <
	const M extends Record<string, symbol>,
	const Types extends Record<string, unknown>,
>(config: {
	appTypes: TypeEngineLike<Types>;
	kindMap: M;
	getId(entity: HasMeta): string;
	subscriber: SubscriberEngine;
}) => {
	const { subscriber } = config;

	const types = config.appTypes.load();

	type Name = keyof M & string;
	const names = Object.keys(config.kindMap) as Name[];

	return <const Builders extends readonly unknown[]>(
		builders: Builders,
	) => {
		type BuilderUnion = BuilderFrom<Builders[number]>;

		type Entity = Extract<
			Ret<BuilderUnion>,
			HasMeta & { readonly state: unknown }
		>;

		type EntitiesByKind = EntityByName<M, Entity>;

		type BuilderFor<N extends Name> = Extract<
			BuilderUnion,
			{ kind: M[N] }
		>;

		type InitialFor<N extends Name> = Params<
			BuilderFor<N>
		> extends readonly [infer A]
			? A
			: never;

		const buckets = {} as { [K in Name]: EntitiesByKind[K][] };
		const entitiesById = {} as {
			[K in Name]: Map<string, EntitiesByKind[K]>;
		};
		for (const n of names) {
			buckets[n] = [];
			entitiesById[n] = new Map<string, EntitiesByKind[typeof n]>();
		}

		const repos = {} as {
			[K in Name]: Repository<EntitiesByKind[K], InitialFor<K>>;
		};

		const builderByKind = new Map<
			symbol,
			(input: unknown) => unknown
		>();

		for (const b of builders) {
			const maybe = b as { kind?: symbol };
			if (!maybe.kind) continue;

			builderByKind.set(maybe.kind, (input: unknown) =>
				(b as (arg: unknown) => unknown)(input),
			);
		}

		// entities expose their declared primaryKey field name on the builder
		const pkFieldByKind = new Map<symbol, string>();
		for (const b of builders) {
			const maybe = b as {
				kind?: symbol;
				schema?: Record<PropertyKey, unknown>;
			};
			if (!maybe.kind || !maybe.schema) continue;

			const pk = maybe.schema[ENTITY_PRIMARY_KEY] as
				| readonly string[]
				| undefined;
			if (pk?.length) {
				pkFieldByKind.set(maybe.kind, pk[0]);
			}
		}

		for (const n of names) {
			const bucket = buckets[n];
			const entityIndex = entitiesById[n];
			const kind = config.kindMap[n];
			const idsSource = ReactiveKeys.repo(n, "ids");
			const entityRootSource = (id: string) =>
				ReactiveKeys.repo(n, "byId", id);
			const entityLookupSource = (id: string) =>
				ReactiveKeys.repo(n, "lookup", id);

			const pkField = pkFieldByKind.get(kind);

			// identity keys: the configured id (meta.id alias) + the declared
			// primaryKey value when set (business identity lookup)
			const readIdKeys = (entity: E): string[] => {
				const keys: string[] = [config.getId(entity)];
				if (pkField) {
					const pk = (entity.state as Record<string, unknown>)[pkField];
					if (typeof pk === "string" && pk.length) {
						keys.push(pk);
					} else if (pk !== null && pk !== undefined) {
						keys.push(String(pk));
					}
				}
				return Array.from(new Set(keys));
			};

			type E = EntitiesByKind[typeof n];

			function read(): readonly E[];
			function read<R>(select: (entities: readonly E[]) => R): R;
			function read<R>(select?: (entities: readonly E[]) => R) {
				return select ? select(bucket) : bucket;
			}

			repos[n] = {
				insert(...inputs) {
					const build = builderByKind.get(kind);
					if (!build) return [];

					const created = inputs.map((i) => build(i)) as E[];
					const sources: ReactiveKey[] = [idsSource];

					for (const entity of created) {
						bucket.push(entity);
						const keys = readIdKeys(entity);
						for (const key of keys) {
							entityIndex.set(key, entity);
							sources.push(entityLookupSource(key));
						}
					}

					notifySources(subscriber, sources);
					return created;
				},

				read,

				getById(id: string) {
					return entityIndex.get(id);
				},

				select(pick) {
					const selected = pick(bucket);
					const ids = new Set(
						selected.flatMap((entity) => readIdKeys(entity)),
					);

					function delete_() {
						const removedIds: string[] = [];
						let i = bucket.length;

						while (i--) {
							const current = bucket[i] as E;
							const keys = readIdKeys(current);
							if (!keys.some((key) => ids.has(key))) {
								continue;
							}

							bucket.splice(i, 1);
							for (const key of keys) {
								entityIndex.delete(key);
								removedIds.push(key);
							}
						}

						if (!removedIds.length) {
							return;
						}

						notifySources(subscriber, [
							idsSource,
							...removedIds.flatMap((id) => [
								entityRootSource(id),
								entityLookupSource(id),
							]),
						]);
					}

					function patch(plan: PatchCb<E>): readonly E[] {
						const out: E[] = [];
						const idChangeSources: ReactiveKey[] = [];
						let didChangeIds = false;

						for (let i = 0; i < bucket.length; i++) {
							const current = bucket[i] as E;
							const previousKeys = readIdKeys(current);

							if (!previousKeys.some((key) => ids.has(key))) continue;

							const next = (
								current as unknown as { patch(x: unknown): unknown }
							).patch(plan) as E;

							bucket[i] = next as unknown as EntitiesByKind[typeof n];
							const nextKeys = readIdKeys(next);
							const nextKeySet = new Set(nextKeys);
							for (const key of nextKeys) {
								entityIndex.set(key, next);
							}
							let keysChanged = false;
							for (const key of previousKeys) {
								if (!nextKeySet.has(key)) {
									entityIndex.delete(key);
									keysChanged = true;
								}
							}
							out.push(next);

							if (keysChanged) {
								didChangeIds = true;
								for (const key of previousKeys) {
									idChangeSources.push(
										entityRootSource(key),
										entityLookupSource(key),
									);
								}
								for (const key of nextKeys) {
									idChangeSources.push(
										entityRootSource(key),
										entityLookupSource(key),
									);
								}
							}
						}

						if (didChangeIds || idChangeSources.length) {
							notifySources(subscriber, [
								idsSource,
								...idChangeSources,
							]);
						}

						return out;
					}

					function set(plan: SetCb<E>): readonly E[] {
						const out: E[] = [];
						const idChangeSources: ReactiveKey[] = [];
						let didChangeIds = false;

						for (let i = 0; i < bucket.length; i++) {
							const current = bucket[i] as E;
							const previousKeys = readIdKeys(current);

							if (!previousKeys.some((key) => ids.has(key))) continue;

							const next = (
								current as unknown as { set(x: unknown): unknown }
							).set(plan) as E;

							bucket[i] = next as unknown as EntitiesByKind[typeof n];
							const nextKeys = readIdKeys(next);
							const nextKeySet = new Set(nextKeys);
							for (const key of nextKeys) {
								entityIndex.set(key, next);
							}
							let keysChanged = false;
							for (const key of previousKeys) {
								if (!nextKeySet.has(key)) {
									entityIndex.delete(key);
									keysChanged = true;
								}
							}
							out.push(next);

							if (keysChanged) {
								didChangeIds = true;
								for (const key of previousKeys) {
									idChangeSources.push(
										entityRootSource(key),
										entityLookupSource(key),
									);
								}
								for (const key of nextKeys) {
									idChangeSources.push(
										entityRootSource(key),
										entityLookupSource(key),
									);
								}
							}
						}

						if (didChangeIds || idChangeSources.length) {
							notifySources(subscriber, [
								idsSource,
								...idChangeSources,
							]);
						}

						return out;
					}

					function eachPatch(
						mapper: (entity: E) => FlatPatch<E> | PatchCb<E>,
					): readonly E[] {
						const out: E[] = [];
						const idChangeSources: ReactiveKey[] = [];
						let didChangeIds = false;

						for (let i = 0; i < bucket.length; i++) {
							const current = bucket[i] as E;
							const previousKeys = readIdKeys(current);

							if (!previousKeys.some((key) => ids.has(key))) continue;

							const mapped = mapper(current);
							const arg =
								typeof mapped === "function"
									? (mapped as PatchCb<E>)
									: (mapped as FlatPatch<E>);

							const next = (
								current as unknown as { patch(x: unknown): unknown }
							).patch(arg) as E;

							bucket[i] = next as unknown as EntitiesByKind[typeof n];
							const nextKeys = readIdKeys(next);
							const nextKeySet = new Set(nextKeys);
							for (const key of nextKeys) {
								entityIndex.set(key, next);
							}
							let keysChanged = false;
							for (const key of previousKeys) {
								if (!nextKeySet.has(key)) {
									entityIndex.delete(key);
									keysChanged = true;
								}
							}
							out.push(next);

							if (keysChanged) {
								didChangeIds = true;
								for (const key of previousKeys) {
									idChangeSources.push(
										entityRootSource(key),
										entityLookupSource(key),
									);
								}
								for (const key of nextKeys) {
									idChangeSources.push(
										entityRootSource(key),
										entityLookupSource(key),
									);
								}
							}
						}

						if (didChangeIds || idChangeSources.length) {
							notifySources(subscriber, [
								idsSource,
								...idChangeSources,
							]);
						}

						return out;
					}

					function eachSet(
						mapper: (entity: E) => FlatSet<E> | SetCb<E>,
					): readonly E[] {
						const out: E[] = [];
						const idChangeSources: ReactiveKey[] = [];
						let didChangeIds = false;

						for (let i = 0; i < bucket.length; i++) {
							const current = bucket[i] as E;
							const previousKeys = readIdKeys(current);

							if (!previousKeys.some((key) => ids.has(key))) continue;

							const mapped = mapper(current);
							const arg =
								typeof mapped === "function"
									? (mapped as SetCb<E>)
									: (mapped as FlatSet<E>);

							const next = (
								current as unknown as { set(x: unknown): unknown }
							).set(arg) as E;

							bucket[i] = next as unknown as EntitiesByKind[typeof n];
							const nextKeys = readIdKeys(next);
							const nextKeySet = new Set(nextKeys);
							for (const key of nextKeys) {
								entityIndex.set(key, next);
							}
							let keysChanged = false;
							for (const key of previousKeys) {
								if (!nextKeySet.has(key)) {
									entityIndex.delete(key);
									keysChanged = true;
								}
							}
							out.push(next);

							if (keysChanged) {
								didChangeIds = true;
								for (const key of previousKeys) {
									idChangeSources.push(
										entityRootSource(key),
										entityLookupSource(key),
									);
								}
								for (const key of nextKeys) {
									idChangeSources.push(
										entityRootSource(key),
										entityLookupSource(key),
									);
								}
							}
						}

						if (didChangeIds || idChangeSources.length) {
							notifySources(subscriber, [
								idsSource,
								...idChangeSources,
							]);
						}

						return out;
					}

					const each: EachSelection<E> = {
						patch: eachPatch,
						set: eachSet,
					};

					const selection: Selection<E> = {
						delete: delete_,
						patch,
						set,
						each,
					};

					return selection;
				},
			};
		}

		type Db = InferGraphDbFromBuilders<
			Builders,
			Name,
			keyof Types & string
		>;

		const dbRuntime = buildGraphDbRuntime(
			builders,
			config.kindMap,
		) as unknown as Db;

		const enhanced = enhanceRepositoriesWithGraph({
			types,
			db: dbRuntime,
			kindMap: config.kindMap,
			repositories: repos,
		});

		return enhanced as unknown as {
			[K in Name]: Repository<EntitiesByKind[K], InitialFor<K>> & {
				graph<const Sel extends NodeSpec<Types, Name, Db, K>>(
					build: (ops: GraphOps<Name, M>) => Sel,
				): GraphView<
					OutputNode<Types, Name, Db, K, Sel>,
					ErrorsNode<Types, Name, Db, K, Sel>
				>;
			};
		};
	};
};
