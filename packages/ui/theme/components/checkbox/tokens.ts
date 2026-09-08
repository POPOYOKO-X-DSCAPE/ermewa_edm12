import { defineTokens } from "@pandacss/dev";
import { bg, fg } from "../../semantic/colors";
import { radius } from "../../semantic/radii";
import { sizes } from "../../semantic/sizes";
import { padding } from "../../semantic/spacings";

const checkboxSize = defineTokens.sizes({
	default: sizes.md,
});

const checkboxRadii = defineTokens.radii({
	outer: radius.xs,
});

const checkboxSpacing = defineTokens.spacing({
	labelGap: padding.xs,
});

const checkboxColors = defineTokens.colors({
	bg: {
		unchecked: bg.default.initial,
		uncheckedHover: bg.default.hover,
		checked: bg.actionHigh.initial,
		checkedHover: bg.actionHigh.hover,
		disabled: bg.actionLow.hover,
	},
	fg: {
		check: fg.actionHigh.initial,
		label: fg.default.initial,
		labelHover: fg.default.hover,
		labelDisabled: fg.default.hover,
		disabled: bg.actionLow.hover,
	},
	border: {
		checked: bg.actionHigh.initial,
	},
	focus: fg.elevated.active,
});

export const checkbox = defineTokens({
	sizes: checkboxSize,
	radii: checkboxRadii,
	spacing: checkboxSpacing,
	colors: checkboxColors,
});
