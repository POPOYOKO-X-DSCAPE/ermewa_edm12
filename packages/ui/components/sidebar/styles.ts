import { css } from "@styles";

const Main = css({
	bg: "c.sidebar.bg.initial",
	color: "c.sidebar.fg.initial",
	boxSizing: "border-box",
	"& button": {
		textAlign: "left",
	},
});

const Group = css({
	borderLeftColor: "c.sidebar.border.guide",
	borderLeftStyle: "solid",
	borderLeftWidth: "2px",
	marginLeft: "c.sidebar.element.gap",
	gap: "s.margin.m",
});

const Active = css({
	backgroundColor: "c.sidebar.element.bg.active",
	color: "c.sidebar.element.fg.active",
});

const Button = css({
	display: "flex",
	flexGrow: 1,
	flexShrink: 0,
	cursor: "pointer",
	"&:hover": {
		backgroundColor: "c.sidebar.element.bg.hover",
	},
});

const ElementContent = css({
	flexShrink: 2,
	overflowY: "hidden",
	minHeight: "100%",
});

const DisclosureIcon = css({
	flexShrink: 0,
});

export const Styles = {
	Main,
	Group,
	Active,
	Button,
	ElementContent,
	DisclosureIcon,
};
