import { defineTokens } from "@pandacss/dev";
import { bg, fg } from "../../semantic/colors";
import { radius } from "../../semantic/radii";
import { margin, padding } from "../../semantic/spacings";

export const colors = defineTokens.colors({
	bg: bg.elevated.initial,
	fg: fg.elevated.initial,
});

export const spacing = defineTokens.spacing({
	padding: padding.l,
	margin: margin.xxl,
});

export const radii = defineTokens.radii({
	radius: radius.l,
});

const sizes = defineTokens.sizes({
	// Card width in characters.
	width: { value: "36ch" },
});

export const snackbar = defineTokens({
	radii,
	colors,
	spacing,
	sizes,
});
