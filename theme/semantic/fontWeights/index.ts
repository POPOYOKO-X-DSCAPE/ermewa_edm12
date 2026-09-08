import { semantic as kitSemantic } from "@packages/ui/theme/semantic";
import { defineTokens } from "@pandacss/dev";

const { h1, h2, h3, h4, h5, h6, body } = kitSemantic.fontWeights.s;

export const fontWeights = defineTokens.fontWeights({
	h1,
	h2,
	h3,
	h4,
	h5,
	h6,
	body,
});
