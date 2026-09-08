import type {
	GraphDb,
	ManyRel,
	ObjectDef,
	OneRel,
} from "../dsl/graph.definition";
import type { OneOfField } from "../dsl/state.definition";
import type { LeafErrors } from "../runtime/graph.errors";

/**
 * token types (no runtime import emitted)
 */
type ValueToken = typeof import("../dsl/graph.definition").value;
type UnsetToken = typeof import("../dsl/graph.definition").unset;
type ResetToken = typeof import("../dsl/graph.definition").reset;
type SelfToken = typeof import("../dsl/graph.definition").self;

/* -----------------------
   runtime scalar type extraction
----------------------- */

type RuntimeType<V> = V extends readonly ((
	value: infer T,
) => boolean | string)[]
	? T
	: never;

type IsOptScalar<S extends string> = S extends `${string}?`
	? true
	: false;
type StripOptScalar<S extends string> = S extends `${infer T}?` ? T : S;

type ScalarOut<
	Types extends Record<string, unknown>,
	S extends string,
> = StripOptScalar<S> extends keyof Types
	? RuntimeType<Types[StripOptScalar<S>]>
	: never;

type DeriveFn<T, Optional extends boolean> = Optional extends true
	? (current: T | undefined) => T | undefined
	: (current: T | undefined) => T;

/* -----------------------
   leaf spec
----------------------- */

type LeafSpec<T, Optional extends boolean> =
	| ValueToken
	| DeriveFn<T, Optional>
	| (Optional extends true ? UnsetToken | ResetToken : never);

/* -----------------------
   spec builder types
----------------------- */

type InlineObjectSpec<
	Types extends Record<string, unknown>,
	Nodes extends string,
	Db extends GraphDb<Nodes, keyof Types & string>,
	Def extends ObjectDef<Nodes, keyof Types & string>,
> = {
	readonly [K in keyof Def & string]?: SpecForField<
		Types,
		Nodes,
		Db,
		Def[K]
	>;
};

type SpecForField<
	Types extends Record<string, unknown>,
	Nodes extends string,
	Db extends GraphDb<Nodes, keyof Types & string>,
	F,
> = F extends string
	? LeafSpec<ScalarOut<Types, F>, IsOptScalar<F>>
	: F extends OneOfField<infer T>
		? LeafSpec<T[number], false>
		: F extends OneRel<infer Target>
			? Target extends Nodes
				?
						| SelfToken
						| (F extends { readonly min: 0 }
								? UnsetToken | ResetToken
								: never)
						| NodeSpec<Types, Nodes, Db, Target>
				: never
			: F extends ManyRel<infer Target>
				? Target extends Nodes
					?
							| SelfToken
							| (F extends { readonly min: 0 }
									? UnsetToken | ResetToken
									: never)
							| NodeSpec<Types, Nodes, Db, Target>
					: never
				: F extends { readonly __kind: "array"; readonly of: infer OF }
					? OF extends string
						? ValueToken
						: OF extends OneOfField<infer T>
							? LeafSpec<T[number], false>
							: OF extends ObjectDef<Nodes, keyof Types & string>
								? InlineObjectSpec<Types, Nodes, Db, OF>
								: never
					: F extends ObjectDef<Nodes, keyof Types & string>
						? InlineObjectSpec<Types, Nodes, Db, F>
						: never;

export type NodeSpec<
	Types extends Record<string, unknown>,
	Nodes extends string,
	Db extends GraphDb<Nodes, keyof Types & string>,
	Node extends Nodes,
> = InlineObjectSpec<Types, Nodes, Db, Db[Node]>;

/* -----------------------
   output types
----------------------- */

type OutputForField<
	Types extends Record<string, unknown>,
	Nodes extends string,
	Db extends GraphDb<Nodes, keyof Types & string>,
	F,
	Sel,
> = Sel extends ResetToken
	? undefined
	: F extends string
		? IsOptScalar<F> extends true
			? ScalarOut<Types, F> | undefined
			: ScalarOut<Types, F>
		: F extends OneOfField<infer T>
			? T[number]
			: F extends OneRel<infer Target>
				? Target extends Nodes
					? F extends { readonly min: 0 }
						?
								| OutputNode<
										Types,
										Nodes,
										Db,
										Target,
										Sel & NodeSpec<Types, Nodes, Db, Target>
								  >
								| undefined
						: OutputNode<
								Types,
								Nodes,
								Db,
								Target,
								Sel & NodeSpec<Types, Nodes, Db, Target>
							>
					: never
				: F extends ManyRel<infer Target>
					? Target extends Nodes
						? F extends { readonly min: 0 }
							?
									| readonly OutputNode<
											Types,
											Nodes,
											Db,
											Target,
											Sel & NodeSpec<Types, Nodes, Db, Target>
									  >[]
									| undefined
							: readonly OutputNode<
									Types,
									Nodes,
									Db,
									Target,
									Sel & NodeSpec<Types, Nodes, Db, Target>
								>[]
						: never
					: F extends {
								readonly __kind: "array";
								readonly of: infer OF;
							}
						? OF extends string
							? readonly (IsOptScalar<OF> extends true
									? ScalarOut<Types, OF> | undefined
									: ScalarOut<Types, OF>)[]
							: OF extends OneOfField<infer T>
								? readonly T[number][]
								: OF extends ObjectDef<Nodes, keyof Types & string>
									? readonly OutputInlineObject<
											Types,
											Nodes,
											Db,
											OF,
											Sel
										>[]
									: unknown
						: F extends ObjectDef<Nodes, keyof Types & string>
							? OutputInlineObject<Types, Nodes, Db, F, Sel>
							: unknown;

type OutputInlineObject<
	Types extends Record<string, unknown>,
	Nodes extends string,
	Db extends GraphDb<Nodes, keyof Types & string>,
	Def extends ObjectDef<Nodes, keyof Types & string>,
	Sel,
> = Sel extends Record<string, unknown>
	? {
			readonly [K in keyof Sel & string as Sel[K] extends UnsetToken
				? never
				: K]: K extends keyof Def & string
				? OutputForField<Types, Nodes, Db, Def[K], Sel[K]>
				: never;
		}
	: Record<string, never>;

export type OutputNode<
	Types extends Record<string, unknown>,
	Nodes extends string,
	Db extends GraphDb<Nodes, keyof Types & string>,
	Node extends Nodes,
	Sel extends NodeSpec<Types, Nodes, Db, Node>,
> = OutputInlineObject<Types, Nodes, Db, Db[Node], Sel>;

/* -----------------------
   errors types (shape = spec)
----------------------- */

type ManyErrors<Item> = {
	readonly __self: LeafErrors;
	readonly items: readonly Item[];
};

type ErrorsForField<
	Types extends Record<string, unknown>,
	Nodes extends string,
	Db extends GraphDb<Nodes, keyof Types & string>,
	F,
	Sel,
> = F extends string
	? LeafErrors
	: F extends OneOfField<infer _T>
		? LeafErrors
		: F extends OneRel<infer Target>
			? Sel extends UnsetToken | ResetToken
				? LeafErrors
				: Target extends Nodes
					? ErrorsNode<
							Types,
							Nodes,
							Db,
							Target,
							Sel & NodeSpec<Types, Nodes, Db, Target>
						>
					: LeafErrors
			: F extends ManyRel<infer Target>
				? Sel extends UnsetToken | ResetToken
					? LeafErrors
					: Target extends Nodes
						? ManyErrors<
								ErrorsNode<
									Types,
									Nodes,
									Db,
									Target,
									Sel & NodeSpec<Types, Nodes, Db, Target>
								>
							>
						: LeafErrors
				: F extends { readonly __kind: "array"; readonly of: infer OF }
					? OF extends OneOfField<infer _T>
						? LeafErrors
						: OF extends ObjectDef<Nodes, keyof Types & string>
							? ManyErrors<
									ErrorsInlineObject<Types, Nodes, Db, OF, Sel>
								>
							: LeafErrors
					: F extends ObjectDef<Nodes, keyof Types & string>
						? ErrorsInlineObject<Types, Nodes, Db, F, Sel>
						: LeafErrors;

type ErrorsInlineObject<
	Types extends Record<string, unknown>,
	Nodes extends string,
	Db extends GraphDb<Nodes, keyof Types & string>,
	Def extends ObjectDef<Nodes, keyof Types & string>,
	Sel,
> = Sel extends Record<string, unknown>
	? {
			readonly __self?: LeafErrors;
		} & {
			readonly [K in keyof Sel & string]: K extends keyof Def & string
				? ErrorsForField<Types, Nodes, Db, Def[K], Sel[K]>
				: LeafErrors;
		}
	: { readonly __self?: LeafErrors };

export type ErrorsNode<
	Types extends Record<string, unknown>,
	Nodes extends string,
	Db extends GraphDb<Nodes, keyof Types & string>,
	Node extends Nodes,
	Sel extends NodeSpec<Types, Nodes, Db, Node>,
> = ErrorsInlineObject<Types, Nodes, Db, Db[Node], Sel>;
