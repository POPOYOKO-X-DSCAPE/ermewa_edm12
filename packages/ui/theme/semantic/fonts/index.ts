import { defineSemanticTokens } from "@pandacss/dev";
import { brand } from "../../brand";

export const fonts = defineSemanticTokens.fonts({
	heading: brand.fonts.heading,
	body: brand.fonts.body,
});
