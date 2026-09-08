import { app as kitApp } from "@packages/ui/theme/components/app/tokens";
import { badge as kitBadge } from "@packages/ui/theme/components/badge/tokens";
import {
	buttonMenu as kitButtonMenu,
	buttonMenuItem as kitButtonMenuItem,
	buttonPrimary as kitButtonPrimary,
	buttonSecondary as kitButtonSecondary,
} from "@packages/ui/theme/components/button/tokens";
import { checkbox as kitCheckbox } from "@packages/ui/theme/components/checkbox/tokens";
import {
	documentViewer as kitDocumentViewer,
	documentViewerZoom as kitDocumentViewerZoom,
} from "@packages/ui/theme/components/documentViewer/tokens";
import {
	input as kitInput,
	inputContainer as kitInputContainer,
	inputDisabled as kitInputDisabled,
	inputError as kitInputError,
	inputFocus as kitInputFocus,
	inputLabel as kitInputLabel,
} from "@packages/ui/theme/components/form/input/tokens";
import { header as kitHeader } from "@packages/ui/theme/components/header/tokens";
import { sidebar as kitSidebar } from "@packages/ui/theme/components/sidebar/tokens";
import { snackbar as kitSnackbar } from "@packages/ui/theme/components/snackbar/tokens";
import { defineTokens } from "@pandacss/dev";

// Reference so the emitted --colors-c.* var points at the (conditional) --colors-s.*
// var, letting component colors flip with data-color-mode.
const ref = (path: string) => ({ value: `{colors.${path}}` });

const elevatedColors = () => ({
	bg: {
		initial: ref("s.bg.elevated.initial"),
		hover: ref("s.bg.elevated.hover"),
	},
	fg: ref("s.fg.elevated.initial"),
});

const actionHighColors = () => ({
	bg: {
		initial: ref("s.bg.actionHigh.initial"),
		hover: ref("s.bg.actionHigh.hover"),
	},
	fg: {
		initial: ref("s.fg.actionHigh.initial"),
		hover: ref("s.fg.actionHigh.hover"),
	},
});

const actionLowColors = () => ({
	bg: {
		initial: ref("s.bg.actionLow.initial"),
		hover: ref("s.bg.actionLow.hover"),
	},
	fg: {
		initial: ref("s.fg.actionLow.initial"),
		hover: ref("s.fg.actionLow.hover"),
	},
});

export const components = {
	app: defineTokens({
		...kitApp,
		colors: {
			bg: ref("s.bg.default.initial"),
			fg: ref("s.fg.default.initial"),
		},
	}),
	header: defineTokens({
		...kitHeader,
		colors: elevatedColors(),
	}),
	sidebar: defineTokens({
		...kitSidebar,
		colors: {
			bg: {
				initial: ref("s.bg.elevated.initial"),
				hover: ref("s.bg.elevated.hover"),
			},
			fg: { initial: ref("s.fg.elevated.initial") },
			border: {
				// Keep the pre-tokenization sidebar group guide color (#3333).
				guide: { value: "#3333" },
			},
			element: {
				bg: {
					initial: ref("s.bg.elevated.initial"),
					hover: ref("s.bg.elevated.hover"),
					active: ref("s.bg.elevated.active"),
				},
				fg: {
					initial: ref("s.fg.elevated.initial"),
					hover: ref("s.fg.elevated.hover"),
					active: ref("s.fg.elevated.active"),
				},
			},
		},
	}),
	documentViewer: defineTokens({
		...kitDocumentViewer,
		colors: {
			...elevatedColors(),
			// PDF page / thumbnail outlines: pre-tokenization #ccc / #333.
			border: {
				initial: { value: "#ccc" },
				hover: { value: "#333" },
			},
		},
	}),
	documentViewerZoom: defineTokens({ ...kitDocumentViewerZoom }),
	buttonPrimary: defineTokens({
		...kitButtonPrimary,
		colors: actionHighColors(),
	}),
	buttonSecondary: defineTokens({
		...kitButtonSecondary,
		colors: actionLowColors(),
	}),
	buttonMenu: defineTokens({
		...kitButtonMenu,
		colors: elevatedColors(),
	}),
	buttonMenuItem: defineTokens({
		...kitButtonMenuItem,
		colors: actionLowColors(),
	}),
	snackbar: defineTokens({
		...kitSnackbar,
		colors: elevatedColors(),
	}),
	inputContainer: defineTokens({ ...kitInputContainer }),
	inputLabel: defineTokens({
		...kitInputLabel,
		colors: { color: ref("s.fg.default.initial") },
	}),
	input: defineTokens({
		...kitInput,
		colors: {
			bg: ref("s.bg.default.initial"),
			fg: ref("s.fg.default.initial"),
			borderColor: { initial: ref("s.bg.default.hover") },
		},
	}),
	inputError: defineTokens({
		...kitInputError,
		colors: { border: ref("s.fg.actionHigh.hover") },
	}),
	inputFocus: defineTokens({
		...kitInputFocus,
		colors: { border: ref("s.fg.elevated.active") },
	}),
	inputDisabled: defineTokens({
		...kitInputDisabled,
		colors: {
			bg: ref("s.bg.actionLow.hover"),
			fg: ref("s.fg.default.hover"),
		},
	}),
	badge: defineTokens({ ...kitBadge }),
	checkbox: defineTokens({
		...kitCheckbox,
		colors: {
			bg: {
				unchecked: ref("s.bg.default.initial"),
				uncheckedHover: ref("s.bg.default.hover"),
				checked: ref("s.bg.actionHigh.initial"),
				checkedHover: ref("s.bg.actionHigh.hover"),
				disabled: ref("s.bg.actionLow.hover"),
			},
			fg: {
				check: ref("s.fg.actionHigh.initial"),
				label: ref("s.fg.default.initial"),
				labelHover: ref("s.fg.default.hover"),
				labelDisabled: ref("s.fg.default.hover"),
				disabled: ref("s.bg.actionLow.hover"),
			},
			border: {
				checked: ref("s.bg.actionHigh.initial"),
			},
			focus: ref("s.fg.elevated.active"),
		},
	}),
};
