import { defineTokens } from "@pandacss/dev";
import { radius } from "../../semantic/radii";
import { padding } from "../../semantic/spacings";

const colors = defineTokens.colors({
	// High-contrast marker: pure black surface, pure white glyph.
	bg: { initial: { value: "#000000" } },
	fg: { initial: { value: "#FFFFFF" } },
});

const spacing = defineTokens.spacing({
	padding: padding.s,
});

export const radii = defineTokens.radii({
	radius: radius.m,
});

export const badge = defineTokens({
	spacing,
	radii,
	colors,
});
