import { css } from "@styles";
import type { CSSProperties } from "react";

type XYVars = CSSProperties & Record<`--${string}`, string>;

// FlowCanvas — @xyflow/react chrome (background, controls, minimap)
// ---------------------------------------------------------------------------
// xyflow themes its chrome through `--xy-*` CSS variables (see
// @xyflow/react/dist/style.css). Those overrides are plain CSSProperties
// objects, and inline styles cannot carry Panda conditions — so the
// semantic tokens are referenced as CSS custom properties
// (`var(--colors-s-*)`, the same convention ermewa_edm12 uses in its
// styles). Panda emits each var on `:root` and re-emits it under the
// consumer's dark condition (`[data-color-mode=dark]`), so every value
// flips with the color mode. Any inline value a consumer passes (e.g.
// <Background color>, <MiniMap bgColor>) still wins.

const canvas = css({
	position: "relative",
	width: "100%",
	height: "100%",
});

// The kit base surface for the canvas area (set inline on the wrapper so it
// wins over `.react-flow`'s own background variable chain).
const canvasSurface = "var(--colors-s-bg-default-initial)";

// Edge / connection-line strokes, cascaded from the wrapper div onto the
// whole React Flow instance.
const canvasVars: XYVars = {
	"--xy-edge-stroke": "var(--colors-s-bg-elevated-hover)",
	"--xy-edge-stroke-selected": "var(--colors-s-fg-elevated-active)",
	"--xy-connectionline-stroke": "var(--colors-s-bg-elevated-hover)",
};

const controls = css({
	backgroundColor: "c.flowNodeCard.bg.initial",
	borderWidth: "1px",
	borderStyle: "solid",
	borderColor: "c.flowNodeCard.border.initial",
	borderRadius: "c.flowNodeCard.radius",
});

// Re-skin the zoom / fit / lock buttons to the kit's elevated surfaces.
const controlsButtons: XYVars = {
	"--xy-controls-button-background-color": "var(--colors-s-bg-elevated-initial)",
	"--xy-controls-button-background-color-hover":
		"var(--colors-s-bg-elevated-hover)",
	"--xy-controls-button-color": "var(--colors-s-fg-elevated-initial)",
	"--xy-controls-button-color-hover": "var(--colors-s-fg-elevated-initial)",
	"--xy-controls-button-border-color": "var(--colors-s-bg-default-hover)",
};

const miniMap = css({
	borderWidth: "1px",
	borderStyle: "solid",
	borderColor: "c.flowNodeCard.border.initial",
	borderRadius: "c.flowNodeCard.radius",
});

// Minimap internals, passed as MiniMap props (inline CSS variables, so they
// win over xyflow's defaults regardless of stylesheet order).
const miniMapProps = {
	bgColor: "var(--colors-s-bg-elevated-initial)",
	nodeColor: "var(--colors-s-bg-elevated-hover)",
	maskStrokeColor: "var(--colors-s-fg-elevated-active)",
};

// Default background dot color (consumers can override via backgroundColor).
const backgroundPatternColor = "var(--colors-s-bg-elevated-hover)";

// FlowNodeCard
// ---------------------------------------------------------------------------

const card = css({
	display: "flex",
	flexDirection: "column",
	gap: "c.flowNodeCard.gap",
	width: "c.flowNodeCard.width",
	padding: "c.flowNodeCard.padding",
	borderRadius: "c.flowNodeCard.radius",
	borderWidth: "1px",
	borderLeftWidth: "3px",
	borderStyle: "solid",
	borderColor: "c.flowNodeCard.border.initial",
	borderLeftColor: "c.flowNodeCard.border.initial",
	backgroundColor: "c.flowNodeCard.bg.initial",
	color: "c.flowNodeCard.fg.initial",
	boxSizing: "border-box",
	cursor: "pointer",
	transition: "border-color 120ms ease, color 120ms ease",
	"&:hover": {
		borderColor: "c.flowNodeCard.border.accent",
	},
	_focusVisible: {
		outlineWidth: "2px",
		outlineStyle: "solid",
		outlineColor: "s.fg.elevated.active",
		outlineOffset: "2px",
	},
});

const cardSelected = css({
	borderColor: "c.flowNodeCard.border.accent",
	// Distinct solid accent ring (separate from the hover border change).
	outlineWidth: "2px",
	outlineStyle: "solid",
	outlineColor: "s.fg.elevated.active",
	outlineOffset: "1px",
	_hover: {
		borderColor: "c.flowNodeCard.border.accent",
	},
});

// Persistent emphasis levels (a node sits in exactly one): the tinted
// surface and border ring are kept distinct from the selection ring
// (which is interactive, not semantic).
const cardHighlighted = css({
	backgroundColor: "c.flowNodeCard.emphasis.current.bg",
	borderColor: "c.flowNodeCard.emphasis.current.stroke",
	borderLeftColor: "c.flowNodeCard.emphasis.current.stroke",
	_hover: {
		borderColor: "c.flowNodeCard.emphasis.current.stroke",
	},
});

const cardNear = css({
	backgroundColor: "c.flowNodeCard.emphasis.near.bg",
	borderColor: "c.flowNodeCard.emphasis.near.stroke",
	borderLeftColor: "c.flowNodeCard.emphasis.near.stroke",
	_hover: {
		borderColor: "c.flowNodeCard.emphasis.near.stroke",
	},
});

const cardFar = css({
	backgroundColor: "c.flowNodeCard.emphasis.far.bg",
	borderColor: "c.flowNodeCard.emphasis.far.stroke",
	borderLeftColor: "c.flowNodeCard.emphasis.far.stroke",
	_hover: {
		borderColor: "c.flowNodeCard.emphasis.far.stroke",
	},
});

const cardRow = css({
	display: "flex",
	flexDirection: "row",
	alignItems: "center",
	gap: "c.flowNodeCard.gap",
});

const cardEllipsis = css({
	flexGrow: 1,
	overflow: "hidden",
	textOverflow: "ellipsis",
	whiteSpace: "nowrap",
	fontWeight: "bold",
});

const cardStat = css({
	flexShrink: 0,
	overflow: "hidden",
	textOverflow: "ellipsis",
	whiteSpace: "nowrap",
	fontSize: "c.flowNodeCard.statFontSize",
});

const cardMuted = css({
	color: "c.flowNodeCard.fg.muted",
});

const hiddenHandle = css({
	opacity: 0,
	pointerEvents: "none",
});

export const Styles = {
	canvas,
	canvasSurface,
	canvasVars,
	controls,
	controlsButtons,
	miniMap,
	miniMapProps,
	backgroundPatternColor,
	card,
	cardSelected,
	cardHighlighted,
	cardNear,
	cardFar,
	cardRow,
	cardEllipsis,
	cardStat,
	cardMuted,
	hiddenHandle,
};
