import {
	derive,
	reset,
	self,
	unset,
	value,
} from "../dsl/graph.definition";
import type { GraphDb } from "../dsl/graph.definition";
import type {
	ErrorsNode,
	NodeSpec,
	OutputNode,
} from "../infer/graph.infer";
import type { HasMeta, Repository } from "../infer/repositories.infer";
import { ENTITY_KIND } from "../symbols";
import { createGraphResolver } from "./graph.engine";
import type { GraphView } from "./graph.engine";

/**
 * repos entities must expose meta + state (graph resolver reads .state)
 */
type GraphEntity = HasMeta & { readonly state: unknown };

type ReposMap<Nodes extends string> = Record<
	Nodes,
	Repository<GraphEntity, unknown>
>;
type KindMap<Nodes extends string> = Record<Nodes, symbol>;

export type GraphOps<
	Nodes extends string,
	KM extends KindMap<Nodes>,
> = {
	readonly refs: {
		readonly [K in Nodes]: { readonly [ENTITY_KIND]: KM[K] };
	};
	readonly value: typeof value;
	readonly unset: typeof unset;
	readonly reset: typeof reset;
	readonly derive: typeof derive;
	readonly self: typeof self;
};

export type EnhancedRepositoriesWithGraph<
	Types extends Record<string, unknown>,
	Nodes extends string,
	Db extends GraphDb<Nodes, keyof Types & string>,
	KM extends KindMap<Nodes>,
	Repos extends ReposMap<Nodes>,
> = {
	readonly [K in Nodes]: Repos[K] & {
		// ✅ lean DX
		graph<const Sel extends NodeSpec<Types, Nodes, Db, K>>(
			spec: Sel,
		): GraphView<
			OutputNode<Types, Nodes, Db, K, Sel>,
			ErrorsNode<Types, Nodes, Db, K, Sel>
		>;

		// ✅ compat callback
		graph<const Sel extends NodeSpec<Types, Nodes, Db, K>>(
			build: (ops: GraphOps<Nodes, KM>) => Sel,
		): GraphView<
			OutputNode<Types, Nodes, Db, K, Sel>,
			ErrorsNode<Types, Nodes, Db, K, Sel>
		>;
	};
};

export function enhanceRepositoriesWithGraph<
	Types extends Record<string, unknown>,
	Nodes extends string,
	Db extends GraphDb<Nodes, keyof Types & string>,
	KM extends KindMap<Nodes>,
	Repos extends ReposMap<Nodes>,
>(deps: {
	types: Types;
	db: Db;
	kindMap: KM;
	repositories: Repos;
}): EnhancedRepositoriesWithGraph<Types, Nodes, Db, KM, Repos> {
	const { types, db, kindMap, repositories } = deps;

	const resolver = createGraphResolver<Types, Nodes, Db, Repos>({
		types,
		db,
		repositories,
	});

	const refs = {} as {
		[K in Nodes]: { readonly [ENTITY_KIND]: KM[K] };
	};
	for (const k in kindMap) {
		const key = k as unknown as Nodes;
		refs[key] = { [ENTITY_KIND]: kindMap[key] };
	}

	const enhanced = {} as Record<string, unknown>;

	for (const k in repositories) {
		const key = k as unknown as Nodes;
		const base = repositories[key];

		const graphImpl = (arg: unknown) => {
			const sel =
				typeof arg === "function"
					? (arg as (ops: GraphOps<Nodes, KM>) => unknown)({
							refs,
							value,
							unset,
							reset,
							derive,
							self,
						})
					: arg;

			return resolver.compile(
				key,
				sel as unknown as NodeSpec<Types, Nodes, Db, typeof key>,
			);
		};

		enhanced[key] = {
			...base,
			graph: graphImpl,
		};
	}

	return enhanced as unknown as EnhancedRepositoriesWithGraph<
		Types,
		Nodes,
		Db,
		KM,
		Repos
	>;
}
