import { css } from "@styles";

const elevatedShadow = "0 0 16px 4px rgba(0 0 0 / 0.1)";

export const header = css({
	display: "flex",
	backgroundColor: "s.bg.elevated.initial",
	padding: "s.padding.m",
	alignItems: "center",
	gap: "s.margin.m",
	borderBottom:
		"1px solid color-mix(in srgb, var(--colors-s-fg-elevated-initial) 5%, transparent)",
	boxShadow: elevatedShadow,
	zIndex: 2,
});

export const appName = css({
	display: "flex",
	flexDirection: "row",
	alignItems: "center",
	gap: "s.padding.3xl",
	fontFamily: "s.fonts.heading",
});

export const appTitle = css({
	margin: 0,
	fontSize: "s.fontSizes.appTitle",
	display: "flex",
	flexDirection: "column",
});

export const appMeta = css({
	fontSize: "s.fontSizes.appMeta",
});

export const version = css({
	color: "s.fg.actionLow.initial",
});

export const wagon = css({
	fontSize: "s.fontSizes.appTitle",
	fontWeight: "s.fontWeights.h2",
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	lineHeight: 1,
	gap: "s.margin.xs",
	padding: "s.padding.xs s.padding.m",
	borderRadius: "s.radii.radius.m",
	backgroundColor: "s.bg.default.initial",
	fontFamily: "s.fonts.heading",
	_icon: {
		width: "s.sizes.wagonIcon",
		height: "s.sizes.wagonIcon",
	},
});

export const right = css({
	marginLeft: "auto",
	display: "flex",
	flexDirection: "row",
	gap: "s.margin.xs",
});

export const loggedUser = css({
	aspectRatio: "1 / 1",
	display: "flex",
	gap: "s.padding.m",
	flexDirection: "column",
	alignItems: "center",
	justifyContent: "center",
	fontWeight: "bolder",
	textTransform: "uppercase",
	fontFamily: "s.fonts.heading",
	backgroundColor: "s.bg.actionHigh.initial",
	color: "s.fg.actionHigh.initial",
	padding: "s.padding.xs",
	borderRadius: "s.radii.radius.m",
});

export const Styles = {
	header,
	appName,
	appTitle,
	appMeta,
	version,
	wagon,
	right,
	loggedUser,
};
