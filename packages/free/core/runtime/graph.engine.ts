import { isSelf, reset, unset } from "../dsl/graph.definition";
import { isOptionalType, isValue } from "../dsl/graph.definition";
import type { GraphDb } from "../dsl/graph.definition";
import { isOneOfField } from "../runtime/state.validation";

import type {
	ErrorsNode,
	NodeSpec,
	OutputNode,
} from "../infer/graph.infer";
import type { HasMeta, Repository } from "../infer/repositories.infer";
import type { GraphErrorCode } from "./graph.errors";

/* small runtime guards */
const isRecord = (v: unknown): v is Record<PropertyKey, unknown> =>
	typeof v === "object" && v !== null;

const push = (arr: GraphErrorCode[], code: GraphErrorCode) => {
	arr.push(code);
};

type ResolveOne<Out, Err> = {
	readonly state: Out | undefined;
	readonly errors: Err;
};

type ResolveMany<Out, Err> = {
	readonly state: readonly (Out | undefined)[];
	readonly errors: readonly Err[];
};

export type GraphView<Out, Err> = {
	resolve(id: string): ResolveOne<Out, Err>;
	resolve(ids: readonly string[]): ResolveMany<Out, Err>;
};

/**
 * entity stored in repos must have meta + state
 */
type GraphEntity = HasMeta & { readonly state: unknown };

/* resolve helpers */
const findById = <E extends GraphEntity>(
	repo: Repository<E, unknown>,
	id: string,
): E | undefined => repo.getById(id);

/**
 * type guard that preserves readonly-ness better than Array.isArray
 */
const isReadonlyStringArray = (
	v: string | readonly string[],
): v is readonly string[] => Array.isArray(v);

export function createGraphResolver<
	Types extends Record<string, unknown>,
	Nodes extends string,
	Db extends GraphDb<Nodes, keyof Types & string>,
	Repos extends Record<Nodes, Repository<GraphEntity, unknown>>,
>(deps: {
	types: Types;
	db: Db;
	repositories: Repos;
}) {
	const { db, repositories } = deps;

	function resolveNode<
		N extends Nodes,
		Sel extends NodeSpec<Types, Nodes, Db, N>,
	>(
		node: N,
		def: Db[N],
		sel: Sel,
		state: unknown,
	): { out: unknown; err: unknown } {
		const out: Record<string, unknown> = {};
		const err: Record<string, unknown> = {
			__self: [] as GraphErrorCode[],
		};

		const s = isRecord(state)
			? (state as Record<string, unknown>)
			: undefined;
		if (!s) {
			(err.__self as GraphErrorCode[]).push("type_mismatch");
		}

		for (const key in sel as Record<string, unknown>) {
			const rawPick = (sel as Record<string, unknown>)[key];
			const pick = (isSelf(rawPick) ? sel : rawPick) as unknown;
			const f = (def as Record<string, unknown>)[key];

			// unknown field (should be impossible type-level, but keep runtime safe)
			if (f === undefined) {
				err[key] = ["unknown_field"] as GraphErrorCode[];
				continue;
			}

			// scalar
			if (typeof f === "string") {
				const leafErr: GraphErrorCode[] = [];
				err[key] = leafErr;

				const optional = isOptionalType(f);
				const current = s ? s[key] : undefined;

				if (pick === unset) {
					if (!optional) push(leafErr, "unset_not_allowed");
					// omit from output
					continue;
				}

				if (pick === reset) {
					if (!optional) push(leafErr, "reset_not_allowed");
					out[key] = undefined;
					continue;
				}

				if (current === undefined && !optional) {
					push(leafErr, "required_missing");
				}

				if (isValue(pick)) {
					out[key] = current;
					continue;
				}

				// derive fn (intent-engine style: it's just a function)
				if (typeof pick === "function") {
					try {
						const fn = pick as (x: unknown) => unknown;
						out[key] = fn(current);
					} catch {
						push(leafErr, "derive_threw");
						out[key] = undefined;
					}
					continue;
				}

				// fallback: behave like value
				out[key] = current;
				continue;
			}

			// oneOf leaf
			if (isOneOfField(f as never)) {
				const leafErr: GraphErrorCode[] = [];
				err[key] = leafErr;

				const current = s ? s[key] : undefined;

				if (pick === unset) {
					push(leafErr, "unset_not_allowed");
					continue;
				}

				if (pick === reset) {
					push(leafErr, "reset_not_allowed");
					out[key] = undefined;
					continue;
				}

				if (current === undefined) {
					push(leafErr, "required_missing");
				}

				if (isValue(pick)) {
					out[key] = current;
					continue;
				}

				if (typeof pick === "function") {
					try {
						const fn = pick as (x: unknown) => unknown;
						out[key] = fn(current);
					} catch {
						push(leafErr, "derive_threw");
						out[key] = undefined;
					}
					continue;
				}

				out[key] = current;
				continue;
			}

			// relation one/many or array/object
			if (!isRecord(f)) {
				err[key] = ["type_mismatch"] as GraphErrorCode[];
				continue;
			}

			const kind = (f as Record<string, unknown>).__kind;

			// one relation
			if (kind === "one") {
				const rel = f as { __kind: "one"; target: Nodes; min: 0 | 1 };
				const current = s ? s[key] : undefined;

				// unset/reset on relation field
				if (pick === unset) {
					if (rel.min === 1) {
						const shaped = resolveNode(
							rel.target,
							db[rel.target],
							pick as unknown as NodeSpec<
								Types,
								Nodes,
								Db,
								typeof rel.target
							>,
							undefined,
						);
						(
							(shaped.err as Record<string, unknown>)
								.__self as GraphErrorCode[]
						).push("unset_not_allowed");
						err[key] = shaped.err;
					}
					continue;
				}

				if (pick === reset) {
					if (rel.min === 1) {
						const shaped = resolveNode(
							rel.target,
							db[rel.target],
							pick as unknown as NodeSpec<
								Types,
								Nodes,
								Db,
								typeof rel.target
							>,
							undefined,
						);
						(
							(shaped.err as Record<string, unknown>)
								.__self as GraphErrorCode[]
						).push("reset_not_allowed");
						err[key] = shaped.err;
					}
					out[key] = undefined;
					continue;
				}

				// must be id string
				if (typeof current !== "string") {
					const shaped = resolveNode(
						rel.target,
						db[rel.target],
						pick as unknown as NodeSpec<
							Types,
							Nodes,
							Db,
							typeof rel.target
						>,
						undefined,
					);
					if (rel.min === 1) {
						(
							(shaped.err as Record<string, unknown>)
								.__self as GraphErrorCode[]
						).push("required_missing");
					}
					err[key] = shaped.err;
					out[key] = undefined;
					continue;
				}

				const targetRepo = repositories[rel.target];
				const found = findById(targetRepo, current);

				if (!found) {
					const shaped = resolveNode(
						rel.target,
						db[rel.target],
						pick as unknown as NodeSpec<
							Types,
							Nodes,
							Db,
							typeof rel.target
						>,
						undefined,
					);
					(
						(shaped.err as Record<string, unknown>)
							.__self as GraphErrorCode[]
					).push("relation_not_found");
					err[key] = shaped.err;
					out[key] = undefined;
					continue;
				}

				const sub = resolveNode(
					rel.target,
					db[rel.target],
					pick as unknown as NodeSpec<
						Types,
						Nodes,
						Db,
						typeof rel.target
					>,
					found.state,
				);

				out[key] = sub.out;
				err[key] = sub.err;
				continue;
			}

			// many relation
			if (kind === "many") {
				const rel = f as { __kind: "many"; target: Nodes; min: 0 | 1 };
				const selfErr: GraphErrorCode[] = [];
				const itemsErr: unknown[] = [];
				err[key] = { __self: selfErr, items: itemsErr };

				const current = s ? s[key] : undefined;

				if (pick === unset) {
					if (rel.min === 1) push(selfErr, "unset_not_allowed");
					continue;
				}

				if (pick === reset) {
					if (rel.min === 1) push(selfErr, "reset_not_allowed");
					out[key] = undefined;
					continue;
				}

				if (!Array.isArray(current)) {
					if (rel.min === 1) push(selfErr, "required_missing");
					out[key] = [];
					continue;
				}

				const targetRepo = repositories[rel.target];
				const outItems: unknown[] = [];

				for (const id of current) {
					if (typeof id !== "string") {
						push(selfErr, "type_mismatch");
						continue;
					}

					const found = findById(targetRepo, id);
					if (!found) {
						push(selfErr, "relation_not_found");
						continue;
					}

					const sub = resolveNode(
						rel.target,
						db[rel.target],
						pick as unknown as NodeSpec<
							Types,
							Nodes,
							Db,
							typeof rel.target
						>,
						found.state,
					);

					outItems.push(sub.out);
					itemsErr.push(sub.err);
				}

				out[key] = outItems;
				continue;
			}

			// array (v1 leaf)
			if (kind === "array") {
				const leafErr: GraphErrorCode[] = [];
				err[key] = leafErr;

				const current = s ? s[key] : undefined;

				if (pick === unset) {
					push(leafErr, "unset_not_allowed");
					continue;
				}

				if (pick === reset) {
					push(leafErr, "reset_not_allowed");
					out[key] = undefined;
					continue;
				}

				out[key] = current;
				continue;
			}

			// inline object
			const sub = resolveNode(
				node,
				f as unknown as Db[N],
				pick as unknown as NodeSpec<Types, Nodes, Db, N>,
				s ? s[key] : undefined,
			);
			out[key] = sub.out;
			err[key] = sub.err;
		}

		return { out, err };
	}

	return {
		compile<
			const Root extends Nodes,
			const Sel extends NodeSpec<Types, Nodes, Db, Root>,
		>(root: Root, sel: Sel) {
			type Out = OutputNode<Types, Nodes, Db, Root, Sel>;
			type Err = ErrorsNode<Types, Nodes, Db, Root, Sel>;

			const rootRepo = repositories[root];

			const resolveOne = (id: string): ResolveOne<Out, Err> => {
				const found = findById(rootRepo, id);

				if (!found) {
					const res = resolveNode(root, db[root], sel, undefined);
					(
						(res.err as Record<string, unknown>)
							.__self as GraphErrorCode[]
					).push("root_not_found");
					return { state: undefined, errors: res.err as Err };
				}

				const res = resolveNode(root, db[root], sel, found.state);
				return { state: res.out as Out, errors: res.err as Err };
			};

			const resolveMany = (
				ids: readonly string[],
			): ResolveMany<Out, Err> => {
				const states: (Out | undefined)[] = [];
				const errors: Err[] = [];

				for (const id of ids) {
					const r = resolveOne(id);
					states.push(r.state);
					errors.push(r.errors);
				}

				return { state: states, errors };
			};

			function resolve(id: string): ResolveOne<Out, Err>;
			function resolve(ids: readonly string[]): ResolveMany<Out, Err>;
			function resolve(x: string | readonly string[]) {
				return isReadonlyStringArray(x)
					? resolveMany(x)
					: resolveOne(x);
			}

			const view: GraphView<Out, Err> = { resolve };
			return view;
		},
	};
}
