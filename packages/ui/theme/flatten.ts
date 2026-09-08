import type { Recursive, Token, TokenDataTypes } from "@pandacss/types";

const getTokensFromTokenDataTypes = <T extends keyof TokenDataTypes>(
	tokenType: T,
	tokens: Recursive<Token<string>>,
	prefix: string,
) => {
	return Object.values(
		Object.entries(tokens).map(([key, value]) => {
			return { [key]: value[tokenType as keyof typeof value] };
		}),
	)
		.filter((subElement) => {
			return Object.entries(subElement)[0][1] !== undefined;
		})
		.reduce(
			(acc, item) => {
				const [componentName] = Object.keys(item);

				Object.assign(acc, {
					[`${prefix}.${componentName}`]: item[componentName],
				});
				return acc;
			},
			{} as Record<string, TokenDataTypes[T]>,
		) as Recursive<Token<string>>;
};

// Categories scanned per component bundle. A category only ships if present in
// `tokenTypes`; others are silently dropped.
const tokenTypes = [
	"colors",
	"sizes",
	"spacing",
	"fonts",
	"fontSizes",
	"fontWeights",
	"radii",
] as const;

// Flatten a map of component token bundles into a `c.<name>.*` tree suitable
// for `defineTokens`. This is the single source of the flatten logic — the kit
// default theme and every project local theme call this instead of copy-pasting.
export const buildComponentTokens = (
	components: Recursive<Token<string>>,
	prefix = "c",
) =>
	tokenTypes.reduce(
		(acc, tokenType) => {
			const tokens = getTokensFromTokenDataTypes(
				tokenType,
				components,
				prefix,
			);
			if (Object.keys(tokens).length > 0) {
				acc[tokenType] = tokens;
			}
			return acc;
		},
		{} as Record<string, Recursive<Token<string>>>,
	);
