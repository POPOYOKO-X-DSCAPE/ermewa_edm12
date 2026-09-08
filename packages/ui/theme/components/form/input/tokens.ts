import { defineTokens } from "@pandacss/dev";
import { bg, fg } from "../../../semantic/colors";
import { radius } from "../../../semantic/radii";
import { padding } from "../../../semantic/spacings";

// Container

const containerSpacing = defineTokens.spacing({
	gap: padding.xxs,
});

export const inputContainer = defineTokens({
	spacing: containerSpacing,
});

// Label

const labelColors = defineTokens.colors({
	color: fg.default.initial,
});

export const inputLabel = defineTokens({
	colors: labelColors,
});

// Input

const inputSpacing = defineTokens.spacing({
	padding: padding.xs,
});

const inputBorderColor = defineTokens.colors({
	initial: bg.default.hover,
});

const inputColors = defineTokens.colors({
	bg: bg.default.initial,
	fg: fg.default.initial,
	borderColor: inputBorderColor,
});

export const inputRadii = defineTokens.radii({
	radius: radius.s,
});

export const input = defineTokens({
	radii: inputRadii,
	spacing: inputSpacing,
	colors: inputColors,
});

// Error

const inputErrorColors = defineTokens.colors({
	border: fg.actionHigh.hover,
});

export const inputError = defineTokens({
	colors: inputErrorColors,
});

// Focus

const inputFocusColors = defineTokens.colors({
	border: fg.elevated.active,
});

export const inputFocus = defineTokens({
	colors: inputFocusColors,
});

// Disabled

const inputDisabledColors = defineTokens.colors({
	bg: bg.actionLow.hover,
	fg: fg.default.hover,
});

export const inputDisabled = defineTokens({
	colors: inputDisabledColors,
});
