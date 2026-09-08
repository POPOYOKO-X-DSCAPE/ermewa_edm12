import { defineSemanticTokens } from "@pandacss/dev";
import { fonts as brandFonts } from "../../brand/fonts";

export const fonts = defineSemanticTokens.fonts({
	heading: brandFonts.heading,
	body: brandFonts.body,
});

export const { heading, body } = fonts;
