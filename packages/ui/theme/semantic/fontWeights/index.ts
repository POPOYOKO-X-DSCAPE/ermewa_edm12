import { defineTokens } from "@pandacss/dev";
import { brand } from "../../brand";

export const fontWeights = defineTokens.fontWeights({
	h1: brand.fontWeights.h1,
	h2: brand.fontWeights.h2,
	h3: brand.fontWeights.h3,
	h4: brand.fontWeights.h4,
	h5: brand.fontWeights.h5,
	h6: brand.fontWeights.h6,
	body: brand.fontWeights.body,
});
