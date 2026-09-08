import type { Kind } from "../symbols";

export type KindRegistry<Names extends readonly string[]> = {
	readonly names: Names;
	readonly kinds: { [K in Names[number]]: Kind<K> };
	readonly refs: { [K in Names[number]]: Kind<K> };
	readonly kindMap: { [K in Names[number]]: Kind<K> };
};

export const makeKindRegistry = <const Names extends readonly string[]>(
	names: Names,
): KindRegistry<Names> => {
	type Name = Names[number];

	const kinds = Object.fromEntries(
		names.map((name) => [name, Symbol(name)] as const),
	) as { [K in Name]: Kind<K> };

	return {
		names,
		kinds,
		refs: kinds,
		kindMap: kinds,
	};
};
