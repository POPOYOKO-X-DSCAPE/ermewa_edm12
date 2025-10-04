import { css } from "@styles";

const common = css({
	alignItems: "center",
	cursor: "pointer",
});

const primary = css({
	gap: "c.buttonPrimary.gap",
	padding: "c.buttonPrimary.padding",
	rounded: "c.buttonPrimary.radius",
	bg: "c.buttonPrimary.bg.initial",
	color: "c.buttonPrimary.fg.initial",
	_hover: {
		bg: "c.buttonPrimary.bg.hover",
		color: "c.buttonPrimary.fg.hover",
	},
});

const secondary = css({
	gap: "c.buttonSecondary.gap",
	padding: "c.buttonSecondary.padding",
	rounded: "c.buttonSecondary.radius",
	bg: "c.buttonSecondary.bg.initial",
	color: "c.buttonSecondary.fg.initial",
	_hover: {
		bg: "c.buttonSecondary.bg.hover",
		color: "c.buttonSecondary.fg.hover",
	},
});

const menu = css({
	bg: "#fff",
	color: "c.buttonMenu.fg.initial",
	minWidth: "100%",
	zIndex: 100,
	_hover: {
		bg: "c.buttonMenu.bg.hover",
		color: "c.buttonMenu.fg.hover",
	},
});

const menuItem = css({
	display: "flex",
	gap: "c.buttonSecondary.gap",
	padding: "c.buttonMenuItem.padding",
	rounded: "c.buttonMenuItem.radius",
	bg: "c.buttonMenuItem.bg.initial",
	cursor: "pointer",
	_hover: {
		bg: "c.buttonMenuItem.bg.hover",
		color: "c.buttonMenuItem.fg.hover",
	},
});

export const Styles = {
	common,
	primary,
	secondary,
	menu,
	menuItem,
};
