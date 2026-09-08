// core/infer/repositories.types.ts

import type { ENTITY_KIND } from "../symbols";

export type HasMeta<K extends symbol = symbol> = {
	readonly meta: {
		readonly id: string;
		readonly [ENTITY_KIND]: K;
	};
};

export type Ret<F> = F extends (...args: readonly never[]) => infer R
	? R
	: never;
export type Params<F> = F extends (...args: infer P) => unknown
	? P
	: never;

export type BuilderFrom<T> = T extends (...args: infer P) => infer R
	? T extends { kind: infer K }
		? K extends symbol
			? ((...args: P) => R) & { kind: K }
			: never
		: never
	: never;

export type PatchInput<E> = E extends { patch(input: infer P): unknown }
	? P
	: never;
export type SetInput<E> = E extends { set(input: infer P): unknown }
	? P
	: never;

// distributed pattern-match (works under strictFunctionTypes)
export type FnMember<T> = T extends (ops: infer Ops) => infer Out
	? (ops: Ops) => Out
	: never;

export type PatchCb<E> = FnMember<PatchInput<E>>;
export type SetCb<E> = FnMember<SetInput<E>>;

export type FlatPatch<E> = Exclude<PatchInput<E>, PatchCb<E>>;
export type FlatSet<E> = Exclude<SetInput<E>, SetCb<E>>;

export type EachSelection<E> = {
	patch(mapper: (entity: E) => FlatPatch<E> | PatchCb<E>): readonly E[];
	set(mapper: (entity: E) => FlatSet<E> | SetCb<E>): readonly E[];
};

export type Selection<E> = {
	delete(): void;

	patch(plan: PatchCb<E>): readonly E[];
	set(plan: SetCb<E>): readonly E[];

	each: EachSelection<E>;
};

export type Repository<E, Initial> = {
	insert(...inputs: readonly Initial[]): readonly E[];

	read(): readonly E[];
	read<R>(select: (entities: readonly E[]) => R): R;

	getById(id: string): E | undefined;

	select(pick: (entities: readonly E[]) => readonly E[]): Selection<E>;
};

export type EntityByName<
	M extends Record<string, symbol>,
	E extends HasMeta,
> = {
	[K in keyof M & string]: Extract<
		E,
		{ readonly meta: { readonly [ENTITY_KIND]: M[K] } }
	>;
};
