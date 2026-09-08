import { css } from "@styles";

export const loader = css({
	display: "flex",
	flexDirection: "column",
	gap: "s.margin.m",
	fontWeight: "s.fontWeights.h2",
	fontFamily: "s.fonts.heading",
	"&.fill-container": {
		flexGrow: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	"&::before": {
		content: "''",
		display: "inline-block",
		boxSizing: "border-box",
		justifyContent: "center",
		alignItems: "center",
		width: "s.sizes.loaderSpin",
		aspectRatio: "1 / 1",
		borderWidth: "4px",
		borderStyle: "solid",
		borderBottomStyle: "solid",
		borderColor: "var(--colors-b-primary-s05)",
		borderBottomColor: "transparent",
		borderRadius: "50%",
		animation: "ed12-rotation 1s ease-in-out infinite",
		animationDelay: "-0.1s",
		_dark: {
			borderColor: "var(--colors-b-primary-s06)",
			borderBottomColor: "transparent",
		},
	},
});
