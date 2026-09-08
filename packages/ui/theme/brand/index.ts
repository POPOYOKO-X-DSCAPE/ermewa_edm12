import { defineSemanticTokens } from "@pandacss/dev";
import { colors } from "./colors";
import { fontSizes } from "./fontSizes";
import { fontWeights } from "./fontWeights";
import { fonts } from "./fonts";
import { radii } from "./radii";
import { sizes } from "./sizes";
import { spacings } from "./spacings";

export const brand = defineSemanticTokens({
	colors,
	sizes,
	fontSizes,
	spacings,
	fonts,
	fontWeights,
	radii,
});
