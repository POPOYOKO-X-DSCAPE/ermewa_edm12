export type TypeValidator<T> = {
	(value: T): boolean | string;
	biVarianceHack?: (value: T) => boolean | string;
};

type TypeMap = Record<string, unknown>;

type TypeDefinition<T extends TypeMap> = {
	[K in keyof T]: readonly TypeValidator<T[K]>[];
};

type TypeHelpers<D extends TypeDefinition<Record<string, unknown>>> = {
	[K in keyof D]: (
		...rules: D[K] extends readonly TypeValidator<infer T>[]
			? readonly TypeValidator<T>[]
			: never
	) => readonly TypeValidator<
		D[K] extends readonly TypeValidator<infer T>[] ? T : never
	>[];
};

const createTypeSystem = <T extends TypeMap>(
	definition: TypeDefinition<T>,
) => {
	return {
		load: () => definition,

		refine: <U extends Record<string, readonly TypeValidator<never>[]>>(
			// @ts-expect-error <ts limitation but type safe in implementation layer>
			extend: (h: TypeHelpers<typeof definition>) => U,
		) => {
			// @ts-expect-error <ts limitation but type safe in implementation layer>
			const helpers = {} as TypeHelpers<typeof definition>;

			for (const key in definition) {
				helpers[key] = ((
					...rules: readonly TypeValidator<
						(typeof definition)[typeof key] extends readonly TypeValidator<
							infer R
						>[]
							? R
							: never
					>[]
				) => [...definition[key], ...rules]) as TypeHelpers<
					// @ts-expect-error <ts limitation but type safe in implementation layer>
					typeof definition
				>[typeof key];
			}

			return createTypeSystem({
				...definition,
				...extend(helpers),
			} as TypeDefinition<
				T & {
					[K in keyof U]: U[K] extends readonly TypeValidator<infer R>[]
						? R
						: never;
				}
			>);
		},
	};
};

export const typeSystem = createTypeSystem({
	string: [(v: string) => typeof v === "string" || "not a string"],

	number: [
		(v: number) =>
			(typeof v === "number" && !Number.isNaN(v)) || "not a number",
	],

	boolean: [(v: boolean) => typeof v === "boolean" || "not a boolean"],

	bigint: [(v: bigint) => typeof v === "bigint" || "not a bigint"],

	symbol: [(v: symbol) => typeof v === "symbol" || "not a symbol"],

	undefined: [(v: undefined) => v === undefined || "not undefined"],

	null: [(v: null) => v === null || "not null"],

	object: [
		(v: object) =>
			(typeof v === "object" && v !== null) || "not an object",
	],
});

export const defaultTypes = typeSystem.load();
