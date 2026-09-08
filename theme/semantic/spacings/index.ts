import { semantic as kitSemantic } from "@packages/ui/theme/semantic";
import { defineSemanticTokens } from "@pandacss/dev";

const { padding, margin } = kitSemantic.spacing.s;

export const spacing = defineSemanticTokens.spacing({
	padding: {
		...padding,
		"3xl": { value: "32px" },
	},
	margin,
});

export const { padding: paddingScale, margin: marginScale } = spacing;
