import { defineTokens } from "@pandacss/dev";
import { brand } from "../../brand";

export const fontSizes = defineTokens.fontSizes({
	h1: brand.fontSizes.h1,
	h2: brand.fontSizes.h2,
	h3: brand.fontSizes.h3,
	h4: brand.fontSizes.h4,
	h5: brand.fontSizes.h5,
	h6: brand.fontSizes.h6,
	body: brand.fontSizes.body,
	badge: brand.fontSizes.badge,
});
