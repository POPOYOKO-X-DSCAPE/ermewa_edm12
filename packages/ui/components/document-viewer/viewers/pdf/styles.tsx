import { css } from "@styles";

export const pandaContainer = css({
	display: "flex",
	flexDirection: "column",
	minWidth: "c.documentViewer.thumbnailContainer",
});

export const pandaThumbnails = css({
	gap: "s.padding.s",
	padding: "s.padding.s",
	bg: "s.bg.elevated.initial",
});

export const stylePageNumber = css({
	height: "c.documentViewer.pageNumber",
	backgroundColor: "s.bg.elevated.initial",
	paddingX: "s.padding.xxs",
	position: "absolute",
	left: "s.margin.s",
	bottom: "s.margin.s",
});

export const pandaThumbnailContainer = css({
	gap: "s.padding.m",
});

export const pandaThumbnail = css({
	borderWidth: "1px",
	borderStyle: "solid",
	borderColor: "c.documentViewer.border.initial",
	cursor: "pointer",
	_hover: {
		borderWidth: "1px",
		borderStyle: "solid",
		borderColor: "c.documentViewer.border.hover",
	},
});

export const pandaViewer = css({
	gap: "s.margin.m",
	padding: "s.padding.m",
	bg: "s.bg.default.initial",
	overflowX: "hidden",
});

export const pandaViewerPadding = css({
	padding: "s.padding.m",
});

export const pandaHide = css({
	opacity: 0,
	transition: "opacity .6s ease-out",
});

export const pandaOverlay = css({
	transition: "opacity .3s ease-out",
});

export const pandaShow = css({
	opacity: "1",
});

export const pandaPage = css({
	borderWidth: "1px",
	borderStyle: "solid",
	borderColor: "c.documentViewer.border.initial",
});

export const pandaDocument = css({
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
	gap: "s.margin.xxl",
});

export const pandaThumbnailsButtons = css({
	gap: "s.padding.s",
	padding: "s.padding.s",
});
