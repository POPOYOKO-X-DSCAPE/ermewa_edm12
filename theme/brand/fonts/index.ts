import { defineSemanticTokens } from "@pandacss/dev";

export const fonts = defineSemanticTokens.fonts({
	body: { value: '"Merriweather", serif' },
	heading: { value: '"Work Sans", sans-serif' },
});
