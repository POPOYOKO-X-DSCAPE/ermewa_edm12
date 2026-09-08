// interface-adapters/contracts/common/key-map.ts

export type KeyMap<Ext extends string, Int extends string> = Readonly<{
	byExternal: Readonly<Record<Ext, Int>>;

	/** External keys (left side / keys) as a runtime list */
	externals: readonly Ext[];
	/** Internal keys (right side / values) as a runtime list */
	internals: readonly Int[];

	/** Typed mapping when you already have a typed external key */
	internalOf(external: Ext): Int;
	/** Typed reverse mapping when you already have a typed internal key */
	externalOf(internal: Int): Ext;

	/**
	 * Map a runtime string to internal if known, otherwise returns the input (identity).
	 */
	map(external: string): Int | string;

	/**
	 * Remap keys using mapping + map values.
	 * - strict if src is Record<Ext, ...>
	 * - loose if src is Partial<Record<Ext, ...>>
	 */
	remap<SrcVal, OutVal>(
		src: Readonly<Record<Ext, SrcVal>>,
		make: (value: SrcVal, external: Ext, internal: Int) => OutVal,
	): Readonly<Record<Int, OutVal>>;

	remap<SrcVal, OutVal>(
		src: Readonly<Partial<Record<Ext, SrcVal>>>,
		make: (
			value: SrcVal | undefined,
			external: Ext,
			internal: Int,
		) => OutVal,
	): Readonly<Record<Int, OutVal>>;
}>;

const hasOwn = (o: object, k: PropertyKey): boolean =>
	Object.prototype.hasOwnProperty.call(o, k);

export const createKeyMap = <
	const M extends Readonly<Record<string, string>>,
>(
	byExternal: M,
) => {
	type Ext = keyof M & string;
	type Int = M[keyof M] & string;

	// Unavoidable: Object.keys loses literal types.
	const externals = Object.keys(byExternal) as Ext[];
	const internals = externals.map((k) => byExternal[k]) as Int[];

	const byInternal = externals.reduce(
		(acc, ext) => {
			const internal = byExternal[ext] as Int;
			acc[internal] = ext;
			return acc;
		},
		{} as Record<Int, Ext>,
	);

	const internalOf = (external: Ext) => byExternal[external] as Int;
	const externalOf = (internal: Int) => byInternal[internal];

	const map = (external: string): Int | string =>
		hasOwn(byExternal, external)
			? (byExternal[external as Ext] as Int)
			: external;

	function remap<SrcVal, OutVal>(
		src: Readonly<Partial<Record<Ext, SrcVal>>>,
		make: (
			value: SrcVal | undefined,
			external: Ext,
			internal: Int,
		) => OutVal,
	): Readonly<Record<Int, OutVal>> {
		const out = {} as Record<Int, OutVal>;
		for (const ext of externals) {
			const internal = byExternal[ext] as Int;
			out[internal] = make(src[ext], ext, internal);
		}
		return out;
	}

	return {
		byExternal: byExternal as Readonly<Record<Ext, Int>>,
		externals,
		internals,
		internalOf,
		externalOf,
		map,
		remap,
	} as const satisfies KeyMap<Ext, Int>;
};
