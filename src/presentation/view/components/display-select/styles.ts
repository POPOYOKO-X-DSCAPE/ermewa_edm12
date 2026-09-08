import { css } from "../../../../../../../styled-system/css";

export const styles = {
	container: css({
		minHeight: 0,
	}),
	header: css({
		padding: "s.padding.m",
		gap: "s.padding.xxs",
		backgroundColor: "s.bg.elevated.initial",
	}),
	filters: css({
		padding: "s.padding.m",
		gap: "s.padding.xxs",
		backgroundColor: "s.bg.elevated.initial",
	}),
	results: css({
		gap: "s.padding.l",
		position: "relative",
		padding: "s.padding.s",
	}),
	resultsList: css({
		gap: "s.padding.m",
		position: "relative",
	}),
	folderCard: css({
		padding: "s.padding.m",
		gap: "s.padding.m",
		flexDirection: "row",
		flexWrap: "wrap",
	}),
	inputs: css({
		gap: "s.padding.s",
		flexWrap: "wrap",
	}),
	input: css({
		padding: "s.padding.xs",
		backgroundColor: "s.bg.elevated.initial",
		border: "1px solid",
		borderColor: "s.fg.elevated.initial",
		borderRadius: "s.radius.l",
	}),
	field: css({
		minWidth: "0",
		overflowWrap: "anywhere",
	}),
	fieldValue: css({
		minWidth: "0",
		display: "block",
		overflowWrap: "anywhere",
	}),
	cappedWidth: css({
		display: "flex",
		width: "100%",
		maxWidth: "100%",
	}),
};
