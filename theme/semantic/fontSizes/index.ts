import { semantic as kitSemantic } from "@packages/ui/theme/semantic";
import { defineTokens } from "@pandacss/dev";

const { h1, h2, h3, h4, h5, h6, body } = kitSemantic.fontSizes.s;

export const fontSizes = defineTokens.fontSizes({
	h1,
	h2,
	h3,
	h4,
	h5,
	h6,
	body,
	appTitle: { value: "1.25em" },
	appMeta: { value: "0.75em" },
	iconXs: { value: "0.875em" },
	iconM: { value: "1.5em" },
	iconL: { value: "2em" },
	badge: { value: ".5em" },
});
