import { defineSemanticTokens } from "@pandacss/dev";

import { brand } from "../brand";

import { colors } from "./colors";
import { fontSizes } from "./fontSizes";
import { fontWeights } from "./fontWeights";
import { fonts } from "./fonts";
import { radii as radiiAlias } from "./radii";
import { sizes } from "./sizes";
import { spacing } from "./spacings";

export const semantic = defineSemanticTokens({
	colors: {
		b: brand.colors,
		s: colors.s,
	},
	sizes: {
		s: sizes,
	},
	fonts: {
		b: brand.fonts,
		s: fonts,
	},
	fontSizes: {
		b: fontSizes,
		s: fontSizes,
	},
	spacing: {
		b: spacing,
		s: spacing,
	},
	fontWeights: {
		b: fontWeights,
		s: fontWeights,
	},
	radii: {
		b: radiiAlias,
		s: radiiAlias,
	},
});
