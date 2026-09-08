import { css } from "@styles";

const container = css({
	display: "flex",
	flexDirection: "column",
	gap: "c.inputContainer.gap",
});

const label = css({
	color: "c.inputLabel.color",
	fontWeight: "bold",
});

const base = css({
	display: "flex",
	flexDirection: "row",
	alignItems: "center",
	gap: "c.inputContainer.gap",
	padding: "c.input.padding",
	borderWidth: "1px",
	borderColor: "c.input.borderColor.initial",
	borderRadius: "c.input.radius",
	backgroundColor: "c.input.bg",
	"&:focus-within": {
		borderColor: "c.inputFocus.border",
	},
});

const inner = css({
	flex: "1",
	backgroundColor: "transparent",
	border: "none",
	outline: "none",
	color: "c.input.fg",
	fontSize: "sm",
	resize: "none",
});

const prefix = css({
	display: "flex",
	alignItems: "center",
	flexShrink: "0",
	color: "c.input.fg",
});

const suffix = css({
	display: "flex",
	alignItems: "center",
	flexShrink: "0",
	color: "c.input.fg",
});

const stateError = css({
	borderColor: "c.inputError.border",
});

const stateDisabled = css({
	backgroundColor: "c.inputDisabled.bg",
	color: "c.inputDisabled.fg",
	pointerEvents: "none",
});

const errorMessage = css({
	marginTop: "c.inputContainer.gap",
	color: "c.inputError.border",
	fontSize: "sm",
});

export const Styles = {
	container,
	label,
	base,
	inner,
	prefix,
	suffix,
	stateError,
	stateDisabled,
	errorMessage,
};
