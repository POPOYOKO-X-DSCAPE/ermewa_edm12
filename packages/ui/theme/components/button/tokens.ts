import { defineTokens } from "@pandacss/dev";
import { bg, fg } from "../../semantic/colors";
import { radius } from "../../semantic/radii";
import { padding } from "../../semantic/spacings";

const spacing = defineTokens.spacing({
	padding: padding.s,
	gap: padding.xxs,
});

export const radii = defineTokens.radii({
	radius: radius.m,
});

const primaryColors = defineTokens.colors({
	bg: { initial: bg.actionHigh.initial, hover: bg.actionHigh.hover },
	fg: { initial: fg.actionHigh.initial, hover: fg.actionHigh.hover },
});

const secondaryColors = defineTokens.colors({
	bg: { initial: bg.actionLow.initial, hover: bg.actionLow.hover },
	fg: { initial: fg.actionLow.initial, hover: fg.actionLow.hover },
});

const menuColors = defineTokens.colors({
	bg: { initial: bg.elevated.initial, hover: bg.elevated.hover },
	fg: { initial: fg.elevated.initial, hover: fg.elevated.hover },
});

const menuItemsColors = defineTokens.colors({
	bg: { initial: bg.actionLow.initial, hover: bg.actionLow.hover },
	fg: { initial: fg.actionLow.initial, hover: fg.actionLow.hover },
});

export const buttonPrimary = defineTokens({
	radii,
	spacing,
	colors: primaryColors,
});

export const buttonSecondary = defineTokens({
	radii,
	spacing,
	colors: secondaryColors,
});

export const buttonMenu = defineTokens({
	radii,
	spacing: { padding: padding.s },
	colors: menuColors,
});

export const buttonMenuItem = defineTokens({
	radii,
	spacing,
	colors: menuItemsColors,
});
