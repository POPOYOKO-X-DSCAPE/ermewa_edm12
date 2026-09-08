import { defineSemanticTokens } from "@pandacss/dev";

//Brand Layer
import { brand } from "../brand";

//Semantic Layer
import { colors } from "./colors";
import { fontSizes } from "./fontSizes";
import { fontWeights } from "./fontWeights";
import { fonts } from "./fonts";
import { radii } from "./radii";
import { sizes } from "./sizes";
import { spacing } from "./spacings";

export const semantic = defineSemanticTokens({
	colors: {
		b: { ...brand.colors },
		s: { ...colors },
	},
	sizes: {
		b: { ...brand.sizes },
		s: { ...sizes },
	},
	fonts: {
		b: { ...brand.fonts },
		s: { ...fonts },
	},
	fontSizes: {
		b: { ...brand.fontSizes },
		s: { ...fontSizes },
	},
	spacing: {
		b: { ...brand.spacings },
		s: { ...spacing },
	},
	fontWeights: {
		b: { ...brand.fontWeights },
		s: { ...fontWeights },
	},
	radii: {
		b: { ...brand.radii },
		s: { ...radii },
	},
});
