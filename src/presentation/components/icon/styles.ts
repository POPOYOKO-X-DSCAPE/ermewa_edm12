import { css } from "@styles";

export const icon = css({
	display: "flex",
	"&.small": {
		width: "s.sizes.iconSm",
		height: "s.sizes.iconSm",
		fontSize: "s.fontSizes.iconXs",
	},
	"&.medium": {
		width: "s.sizes.iconMd",
		height: "s.sizes.iconMd",
		fontSize: "s.fontSizes.iconM",
	},
	"&.large": {
		width: "s.sizes.iconLg",
		height: "s.sizes.iconLg",
		fontSize: "s.fontSizes.iconL",
	},
});

export const documentExtension = css({
	position: "relative",
	".extension-name": {
		transform: "translate(-50%, -50%)",
		position: "absolute",
		textTransform: "uppercase",
		color: "s.fg.actionHigh.initial",
		fontSize: "25%",
		lineHeight: 0,
		bottom: "32%",
		left: "45%",
		textAlign: "center",
		fontFamily: "s.fonts.heading",
	},
	svg: {
		width: "100%",
	},
});
