import { css } from "@styles";

const metaDialogBody = css({
	display: "flex",
	flexDirection: "column",
	gap: "s.margin.s",
	minWidth: "c.documentViewer.metaDialog",
});

const metaField = css({
	display: "flex",
	flexDirection: "column",
	gap: "s.margin.xs",
});

const metaActions = css({
	display: "flex",
	justifyContent: "flex-end",
	gap: "s.margin.s",
});

const redColor = css({
	color: "s.danger",
});

export const styles = {
	metaDialogBody,
	metaField,
	metaActions,
	redColor,
};
