export type TypeNames<D> = Extract<keyof D, string>;
export interface PrimaryKeyField<TType extends string> {
	readonly __kind: "primaryKey";
	readonly of: TType;
}
export interface EntityObjectField<D> {
	readonly [key: string]: EntityField<D>;
}

export interface ArrayField<D, OF extends EntityField<D>> {
	readonly __kind: "array";
	readonly of: OF;
	readonly __of?: OF;
}

export interface RefField<
	MIN extends number,
	MAX extends number | "n",
	TTarget extends symbol = symbol,
> {
	readonly __kind: "ref";
	readonly min: MIN;
	readonly max: MAX;
	readonly kind: TTarget;
}
export interface OptionalField<D, OF extends EntityField<D>> {
	readonly __kind: "opt";
	readonly of: OF;
	readonly __of?: OF;
}

export type OneOfValue = string | number | boolean | null | undefined;
export interface OneOfField<T extends readonly OneOfValue[]> {
	readonly __kind: "oneOf";
	readonly values: T;
}

export interface DictField<
	D,
	OF extends EntityField<D>,
	K extends string = string,
> {
	readonly __kind: "dict";
	readonly of: OF;
	readonly __only?: readonly K[];
	readonly __of?: OF;

	only<const A extends readonly string[]>(
		...keys: A
	): DictField<D, OF, A[number]> & { readonly __only: A };
}

export interface SelfField {
	readonly __kind: "self";
}

export interface LazyField<D, OF extends EntityField<D>> {
	readonly __kind: "lazy";
	readonly get: () => OF;
	readonly __of?: OF;
}

export type EntityField<D> =
	| TypeNames<D>
	| `${TypeNames<D>}?`
	| PrimaryKeyField<TypeNames<D>>
	| EntityObjectField<D>
	| ArrayField<D, EntityField<D>>
	| RefField<number, number | "n">
	| OptionalField<D, EntityField<D>>
	| OneOfField<readonly OneOfValue[]>
	| DictField<D, EntityField<D>>
	| LazyField<D, EntityField<D>>
	| SelfField;

/* ============================================================
 * HELPERS
 * ============================================================ */

export type RefFinalizer<
	MIN extends number,
	MAX extends number | "n",
> = <T extends symbol>(target: T) => RefField<MIN, MAX, T>;

export type RefBuilder<
	MIN extends number,
	MAX extends number | "n" = MIN,
> = RefFinalizer<MIN, MAX> & {
	to<NEW_MAX extends number>(max: NEW_MAX): RefBuilder<MIN, NEW_MAX>;
	toMany(): RefBuilder<MIN, "n">;
};

export type RefHelpers = {
	hasOne(): RefBuilder<1>;
	has<MIN extends number>(min: MIN): RefBuilder<MIN>;
};

export type DefinitionHelpers<
	D extends Record<string, unknown>,
	TRefs extends Record<string, symbol>,
> = {
	array<F extends EntityField<D>>(of: F): ArrayField<D, F>;
	optional<F extends EntityField<D>>(of: F): OptionalField<D, F>;
	oneOf<const T extends readonly OneOfValue[]>(
		...values: T
	): OneOfField<T>;
	dict<F extends EntityField<D>>(of: F): DictField<D, F>;
	lazy<F extends EntityField<D>>(
		build: (self: SelfField) => F,
	): LazyField<D, F>;
	ref: RefHelpers;
	refs: TRefs;
};

export type EntityHelpers<
	D extends Record<string, unknown>,
	TRefs extends Record<string, symbol>,
> = DefinitionHelpers<D, TRefs> & {
	primaryKey<T extends TypeNames<D>>(type: T): PrimaryKeyField<T>;
};
