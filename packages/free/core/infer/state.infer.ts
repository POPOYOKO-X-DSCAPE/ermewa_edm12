import type {
	ArrayField,
	DictField,
	EntityField,
	LazyField,
	OneOfField,
	PrimaryKeyField,
	RefField,
	SelfField,
	TypeNames,
} from "../dsl/state.definition";

import type { TypeValidator } from "../types/type.engine";

/* ============================================================
 * RUNTIME TYPE EXTRACTION (no more 'any' leakage)
 * ============================================================ */

type RuntimeType<V> = V extends readonly TypeValidator<infer T>[]
	? T
	: never;

/* ============================================================
 * SMALL UTILS
 * ============================================================ */

type ObjIsOptional<F> = F extends { readonly __kind: "opt" }
	? true
	: F extends `${string}?`
		? true
		: false;

type ObjStripOptional<F> = F extends {
	readonly __kind: "opt";
	readonly of: infer OF;
}
	? OF
	: F extends `${infer T}?`
		? T
		: F;

// depth limiter (only decremented when traversing Lazy)
type PrevDepth = [0, 0, 1, 2, 3, 4, 5];
type DecDepth<N extends number> = N extends keyof PrevDepth
	? PrevDepth[N]
	: 0;

/* ============================================================
 * CORE INFERENCE
 * ============================================================ */

type InferLazy<
	D extends Record<string, unknown>,
	OF,
	Depth extends number,
> = Depth extends 0
	? unknown
	: InferFieldState<D, OF, Depth, InferLazy<D, OF, DecDepth<Depth>>>;

export type InferFieldState<
	D extends Record<string, unknown>,
	F,
	Depth extends number = 5,
	Self = never,
> = Depth extends 0
	? unknown
	: // Self token (only meaningful inside Lazy inference)
		F extends SelfField
		? Self
		: // Lazy => fixpoint
			F extends LazyField<D, infer OF>
			? InferLazy<D, OF, DecDepth<Depth>>
			: // PrimaryKey
				F extends PrimaryKeyField<infer T>
				? T extends TypeNames<D>
					? RuntimeType<D[T]>
					: never
				: // OneOf
					F extends OneOfField<infer T>
					? T[number]
					: // Ref
						F extends RefField<infer MIN, infer MAX>
						? MAX extends 1
							? MIN extends 0
								? string | undefined
								: string
							: string[]
						: // "type?"
							F extends `${infer T}?`
							? T extends TypeNames<D>
								? RuntimeType<D[T]> | undefined
								: never
							: // scalar
								F extends TypeNames<D>
								? RuntimeType<D[F]>
								: // array
									F extends ArrayField<D, infer OF>
									? InferFieldState<D, OF, Depth, Self>[]
									: // opt
										F extends {
												readonly __kind: "opt";
												readonly of: infer OF;
											}
										? InferFieldState<D, OF, Depth, Self> | undefined
										: // dict
											F extends DictField<D, infer OF, infer K>
											? string extends K
												? Record<
														string,
														InferFieldState<D, OF, Depth, Self>
													>
												: Partial<
														Record<
															K,
															InferFieldState<D, OF, Depth, Self>
														>
													>
											: // object
												F extends {
														readonly [key: string]: EntityField<D>;
													}
												? {
														[K in keyof F as ObjIsOptional<
															F[K]
														> extends true
															? never
															: K]: InferFieldState<
															D,
															ObjStripOptional<F[K]>,
															Depth,
															Self
														>;
													} & {
														[K in keyof F as ObjIsOptional<
															F[K]
														> extends true
															? K
															: never]?: InferFieldState<
															D,
															ObjStripOptional<F[K]>,
															Depth,
															Self
														>;
													}
												: never;

/* ============================================================
 * ENTITY STATE
 * ============================================================ */

type IsOptional<F> = F extends PrimaryKeyField<infer _>
	? false
	: F extends `${string}?`
		? true
		: F extends RefField<infer MIN, number | "n">
			? MIN extends 0
				? true
				: false
			: false;

type StripOptional<F> = F extends `${infer T}?` ? T : F;

export type InferEntityState<
	D extends Record<string, unknown>,
	E extends Record<string, EntityField<D>>,
> = {
	[K in keyof E as IsOptional<E[K]> extends true
		? never
		: K]: InferFieldState<D, StripOptional<E[K]>>;
} & {
	[K in keyof E as IsOptional<E[K]> extends true
		? K
		: never]?: InferFieldState<D, StripOptional<E[K]>>;
};
