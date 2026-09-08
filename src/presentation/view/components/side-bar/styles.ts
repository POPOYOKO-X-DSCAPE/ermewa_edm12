import { css } from "../../../../../../../styled-system/css";

const main = css({
	userSelect: "none",
	bg: "c.sidebar.bg.initial",
	color: "c.sidebar.fg.initial",
	boxSizing: "border-box",
});

const group = css({
	borderLeft: "solid var(--colors-s-fg-default-initial) 2px",
	marginLeft: "c.sidebar.element.gap",
	gap: "s.margin.m",
});

const active = css({
	backgroundColor: "c.sidebar.element.bg.active",
	color: "c.sidebar.element.fg.active",
});

const button = css({
	cursor: "pointer",
	"&:hover": {
		backgroundColor: "c.sidebar.element.bg.hover",
	},
	minHeight: "40px",
});

const actionButton = css({
	display: "inline-flex",
	alignItems: "center",
	justifyContent: "center",
	cursor: "pointer",
	padding: "s.padding.xs",
	"&:hover": {
		backgroundColor: "c.sidebar.element.bg.hover",
	},
});

const ariaFullWidth = css({
	width: "100%",
});

const wrapper = css({
	width: "100%",
});

const gapped = css({
	gap: "s.margin.m",
	padding: "s.padding.xs",
	userSelect: "none",
});

const elementContent = css({
	gap: "s.padding.xs",
	width: "100%",
	minHeight: "40px",
});

const disclosureIcon = css({
	flexShrink: 0,
	paddingRight: "s.padding.xs",
});

export const Styles = {
	main,
	button,
	active,
	disclosureIcon,
	group,
	actionButton,
	badge: css({
		right: "-7px",
		top: "-7px",
	}),
	modifiedBadge: css({
		left: "-7px",
		bottom: "-7px",
		overflow: "visible",
	}),
	elementContent,
	wrapper,
	gapped,
	ariaFullWidth,
};
