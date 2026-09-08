import { defineTokens } from "@pandacss/dev";
import { bg, fg } from "../../semantic/colors";
import { padding } from "../../semantic/spacings";

export const colors = defineTokens.colors({
	bg: bg.elevated.initial,
	fg: fg.elevated.initial,
});

export const spacing = defineTokens.spacing({
	padding: padding.m,
});

export const header = defineTokens({
	colors,
	spacing,
});
