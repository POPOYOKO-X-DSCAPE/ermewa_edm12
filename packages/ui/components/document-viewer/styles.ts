import { css } from "@styles";

const header = css({
	padding: "c.documentViewer.padding",
	gap: "c.documentViewer.gap",
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	bg: "c.documentViewer.bg",
});

const zoom = css({
	display: "flex",
	flex: 1,
	justifyContent: "center",
	alignItems: "center",
	gap: "c.documentViewerZoom.gap",
	padding: "c.documentViewer.padding",
	backgroundColor: "s.bg.elevated.initial",
	userSelect: "none",
});

const action = css({
	gap: "c.documentViewer.gap",
	flex: 0,
});

const meta = css({
	gap: "s.margin.s",
});

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

const headingGroup = css({
	gap: "s.margin.s",
});

const pdfViewerRoot = css({
	display: "flex",
	flex: 1,
	minHeight: 0,
	position: "relative",
});

const error = css({
	color: "s.danger",
});

const zoomField = css({
	minWidth: "c.documentViewer.zoomField",
	textAlign: "center",
});

const unwrappedWords = css({
	whiteSpace: "nowrap",
});

export const styles = {
	header,
	zoom,
	action,
	meta,
	metaActions,
	metaDialogBody,
	metaField,
	headingGroup,
	pdfViewerRoot,
	error,
	zoomField,
	unwrappedWords,
};
