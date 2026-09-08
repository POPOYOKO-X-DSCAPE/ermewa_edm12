import { defineTokens } from "@pandacss/dev";
import { bg, fg } from "../../semantic/colors";
import { fontSizes } from "../../semantic/fontSizes";
import { fontWeights } from "../../semantic/fontWeights";

export const app = defineTokens({
	colors: {
		bg: bg.default.initial,
		fg: fg.default.initial,
	},
	fontSizes: {
		h1: fontSizes.h1,
		h2: fontSizes.h2,
		h3: fontSizes.h3,
		h4: fontSizes.h4,
		h5: fontSizes.h5,
		h6: fontSizes.h6,
	},
	fontWeights: {
		h1: fontWeights.h1,
		h2: fontWeights.h2,
		h3: fontWeights.h3,
		h4: fontWeights.h4,
		h5: fontWeights.h5,
		h6: fontWeights.h6,
	},
});
