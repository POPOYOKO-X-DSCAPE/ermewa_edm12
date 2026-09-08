import { css } from "@styles";

const CHECK_TICK =
	"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23fafafa' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='3.5,8.5 6.5,11.5 12.5,4.5'/%3E%3C/svg%3E\")";

const MIXED_DASH =
	"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23fafafa' stroke-width='2' stroke-linecap='round'%3E%3Cline x1='4' y1='8' x2='12' y2='8'/%3E%3C/svg%3E\")";

const tickBase = {
	backgroundPosition: "center",
	backgroundRepeat: "no-repeat",
	backgroundSize: "50%",
};

const group = css({
	display: "inline-flex",
	alignItems: "center",
	gap: "c.checkbox.labelGap",
	color: "c.checkbox.fg.label",
	cursor: "pointer",
	userSelect: "none",
	_hover: {
		color: "c.checkbox.fg.labelHover",
	},
	"&:has(:disabled)": {
		color: "c.checkbox.fg.labelDisabled",
		cursor: "not-allowed",
		_hover: {
			color: "c.checkbox.fg.labelDisabled",
		},
	},
});

const checkbox = css({
	appearance: "none",
	WebkitAppearance: "none",
	margin: 0,
	flexShrink: 0,
	boxSizing: "border-box",
	width: "c.checkbox.default",
	height: "c.checkbox.default",
	borderWidth: "1px",
	borderStyle: "solid",
	borderColor: "c.checkbox.bg.uncheckedHover",
	borderRadius: "c.checkbox.outer",
	backgroundColor: "c.checkbox.bg.unchecked",
	color: "c.checkbox.fg.check",
	cursor: "pointer",
	transition:
		"background-color 120ms ease, border-color 120ms ease, outline-color 120ms ease",
	_focusVisible: {
		outlineWidth: "2px",
		outlineStyle: "solid",
		outlineColor: "c.checkbox.focus",
		outlineOffset: "2px",
	},
	_hover: {
		backgroundColor: "c.checkbox.bg.uncheckedHover",
	},
	_checked: {
		backgroundColor: "c.checkbox.bg.checked",
		borderColor: "c.checkbox.bg.checked",
		backgroundImage: CHECK_TICK,
		...tickBase,
		_hover: {
			backgroundColor: "c.checkbox.bg.checkedHover",
			borderColor: "c.checkbox.bg.checkedHover",
		},
	},
	"&[aria-checked=mixed]": {
		backgroundColor: "c.checkbox.bg.checked",
		borderColor: "c.checkbox.bg.checked",
		backgroundImage: MIXED_DASH,
		...tickBase,
	},
	_disabled: {
		backgroundColor: "c.checkbox.bg.disabled",
		borderColor: "c.checkbox.bg.disabled",
		cursor: "not-allowed",
		_focusVisible: {
			outlineWidth: 0,
		},
		_hover: {
			backgroundColor: "c.checkbox.bg.disabled",
			borderColor: "c.checkbox.bg.disabled",
		},
	},
});

export const Styles = {
	group,
	checkbox,
};
