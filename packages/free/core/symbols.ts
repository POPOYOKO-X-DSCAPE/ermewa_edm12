export const ENTITY_KIND: unique symbol = Symbol("entity.kind");

export const ENTITY_PRIMARY_KEY: unique symbol = Symbol("entity.primaryKey");

/**
 * Symbol brandé par nom (compile-time only).
 * Runtime = symbol normal.
 */
export type Kind<Name extends string> = symbol & {
	readonly __kind: Name;
};
