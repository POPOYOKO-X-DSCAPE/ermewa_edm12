import { css } from "../../../../styled-system/css";

export const styles = {
	container: css({
		display: "flex",
		flexDirection: "column",
		flexGrow: 1,
		padding: "s.padding.m",
		background: "s.bg.elevated.initial",
		borderRadius: "s.radius.xl",
	}),
	clickable: css({
		cursor: "pointer",
		_hover: {
			backgroundColor: "s.bg.elevated.hover",
		},
	}),
};
