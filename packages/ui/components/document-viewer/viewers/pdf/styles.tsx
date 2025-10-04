import { css } from "@styles";

export const pandaContainer = css({
  display: "flex",
});

export const pandaThumbnails = css({
  gap: "s.padding.s",
  padding: "s.padding.s",
  bg: "s.bg.elevated.initial",
});

export const stylePageNumber = css({
  height: "24px",
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
  border: "1px solid #ccc",
  cursor: "pointer",
  _hover: {
    border: "1px solid #333",
  },
});

export const pandaViewer = css({
  gap: "s.margin.m",
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
  border: "1px solid #ccc",
});

export const pandaDocument = css({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "s.margin.xxl",
});
