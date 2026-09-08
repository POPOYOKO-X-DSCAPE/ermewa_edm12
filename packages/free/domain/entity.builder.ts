import type {
	EntityField,
	EntityHelpers,
} from "../core/dsl/state.definition";
import type { InferEntityState } from "../core/infer/state.infer";
import {
	ReactiveKeys,
	type ReactiveKey,
} from "../core/runtime/reactive-keys";
import {
	type EntityRefs,
	extractRefs,
	makeRefBuilder,
} from "../core/runtime/refs.runtime";
import {
	type StateInstance,
	makeStateInstance,
} from "../core/runtime/state.instance";
import type { RuntimeEntityField } from "../core/runtime/state.validation";
import {
	ENTITY_KIND,
	ENTITY_PRIMARY_KEY,
	type Kind,
} from "../core/symbols";
import { makeDictField } from "./schema.builder";

type TypeEngineLike<D extends Record<string, unknown>> = {
	load(): D;
};

type SubscriberEngine = {
	notify(source: ReactiveKey): void;
	notifyMany?: (sources: readonly ReactiveKey[]) => void;
};

export type EntityInstance<
	TState extends Record<PropertyKey, unknown>,
	TKind extends symbol = symbol,
> = {
	readonly meta: {
		readonly id: string;
		readonly createdAt: Date;
		readonly updatedAt: Date;
		readonly [ENTITY_KIND]: TKind;
		refs: EntityRefs;
	};
	readonly state: TState;
	readonly errors: unknown;

	patch(
		input: Parameters<StateInstance<TState>["patch"]>[0],
	): EntityInstance<TState, TKind>;
	set(
		input: Parameters<StateInstance<TState>["set"]>[0],
	): EntityInstance<TState, TKind>;
};

export const entityBuilder = <
	D extends Record<string, unknown>,
	const ENames extends readonly string[],
>(deps: {
	appTypes: TypeEngineLike<D>;
	entityNames: ENames;
	refs: { [K in ENames[number]]: Kind<K> };
	subscriber: SubscriberEngine;
}) => {
	const { appTypes, refs, subscriber } = deps;
	const types = appTypes.load();

	type EntityName = ENames[number];
	type KindForName = Kind<EntityName>;

	const kindToEntityName = new Map<symbol, EntityName>();
	const refNames = Object.keys(refs) as EntityName[];
	for (const name of refNames) {
		kindToEntityName.set(refs[name] as symbol, name);
	}

	const notifyRepoSources = (sources: readonly ReactiveKey[]) => {
		if (!sources.length) {
			return;
		}

		if (typeof subscriber.notifyMany === "function") {
			subscriber.notifyMany(sources);
			return;
		}

		for (const source of sources) {
			subscriber.notify(source);
		}
	};

	return {
		createEntity: <
			E extends Record<string, EntityField<D>>,
			K extends KindForName,
		>(
			definition: (
				kind: typeof ENTITY_KIND,
				helpers: EntityHelpers<D, typeof refs>,
			) => E & { readonly [ENTITY_KIND]: K },
		) => {
			const kind: typeof ENTITY_KIND = ENTITY_KIND;

			const schema = definition(kind, {
				primaryKey: (type) => ({ __kind: "primaryKey", of: type }),
				array: (of) => ({ __kind: "array", of }),
				optional: (of) => ({ __kind: "opt", of }),
				oneOf: (...values) =>
					({
						__kind: "oneOf",
						values,
					}) as const,
				dict: (of) => makeDictField(of),
				lazy: (of) => ({
					__kind: "lazy",
					of,
					get: () => {
						throw new Error("lazy.get should never be called directly");
					},
				}),
				ref: {
					hasOne: () => makeRefBuilder(1),
					has: <MIN extends number>(min: MIN) => makeRefBuilder(min),
				},
				refs,
			});

			const isRecord = (
				v: unknown,
			): v is Record<PropertyKey, unknown> =>
				typeof v === "object" && v !== null;

			const isPrimaryKeyField = (
				v: unknown,
			): v is {
				readonly __kind: "primaryKey";
				readonly of: string;
			} => {
				if (!isRecord(v)) return false;
				return v.__kind === "primaryKey" && typeof v.of === "string";
			};

			const pkFields = Object.keys(schema).filter((k) =>
				isPrimaryKeyField((schema as Record<string, unknown>)[k]),
			);

			if (pkFields.length > 1) {
				throw new Error(
					`Only one primaryKey field is supported (found: ${pkFields.join(", ")})`,
				);
			}

			Object.assign(schema, {
				[ENTITY_PRIMARY_KEY]: pkFields as readonly string[],
			});

			type State = InferEntityState<
				typeof types,
				Omit<E, typeof ENTITY_KIND>
			>;

			type Builder = ((initial: State) => EntityInstance<State, K>) & {
				kind: K;
				schema: E & { readonly [ENTITY_KIND]: K };
			};

			const build = ((initial: State) => {
				const entityKind = schema[ENTITY_KIND];
				const repoName = kindToEntityName.get(entityKind);
				if (!repoName) {
					throw new Error("entity kind is not registered in refs");
				}

				const meta: {
					[ENTITY_KIND]: K;
					id: string;
					createdAt: Date;
					updatedAt: Date;
					refs: EntityRefs;
				} = {
					[ENTITY_KIND]: entityKind,
					id: crypto.randomUUID(),
					createdAt: new Date(),
					updatedAt: new Date(),
					refs: extractRefs(
						schema as Record<string, RuntimeEntityField>,
					),
				};

				const state = makeStateInstance<State>({
					types: types as Record<
						string,
						readonly ((v: unknown) => boolean | string)[]
					>,
					schema: schema as Record<string, RuntimeEntityField>,
					initial,
					onMutate: () => {
						meta.updatedAt = new Date();
					},
					notifyPaths: (paths) => {
						const uniqueSources = new Set<ReactiveKey>();

						uniqueSources.add(
							ReactiveKeys.repo(
								repoName,
								"byId",
								meta.id,
								"meta",
								"updatedAt",
							),
						);

						for (const path of paths) {
							uniqueSources.add(
								path.length
									? ReactiveKeys.repo(
										repoName,
										"byId",
										meta.id,
										"state",
										...path,
									)
									: ReactiveKeys.repo(
										repoName,
										"byId",
										meta.id,
										"state",
									),
							);
						}

						notifyRepoSources(Array.from(uniqueSources));
					},
				});

				const instance: EntityInstance<State, K> = {
					get meta() {
						return meta;
					},
					get state() {
						return state.state;
					},
					get errors() {
						return state.errors;
					},
					patch(input) {
						state.patch(input);
						return instance;
					},
					set(input) {
						state.set(input);
						return instance;
					},
				};

				return instance;
			}) as Builder;

			build.kind = schema[ENTITY_KIND];
			build.schema = schema;

			return build;
		},
	};
};
