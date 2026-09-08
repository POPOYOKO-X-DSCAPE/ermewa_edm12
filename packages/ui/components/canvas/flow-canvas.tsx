/**
 * FlowCanvas — a generic React Flow wrapper.
 *
 * NOTE: @xyflow/react's stylesheet is NOT imported here. Consumers must
 * import it once in their own entry file, e.g.
 * `import "@xyflow/react/dist/style.css";` (see tools/git-history/src/main.tsx)
 * — without it the canvas chrome and default nodes will be unstyled.
 * No extra ReactFlowProvider is needed: this component composes its own.
 */
import {
	Background,
	Controls,
	type Edge,
	type FitViewOptions,
	MiniMap,
	type Node,
	type NodeMouseHandler,
	type NodeTypes,
	type OnEdgesChange,
	type OnMove,
	type OnNodesChange,
	ReactFlow,
	ReactFlowProvider,
	useReactFlow,
} from "@xyflow/react";
import classNames from "classnames";
import {
	type MouseEvent as ReactMouseEvent,
	useEffect,
	useRef,
} from "react";
import { Styles } from "./styles";

export interface FlowCanvasProps {
	nodes: Node[];
	edges: Edge[];
	/** Custom node components, keyed by node type. */
	nodeTypes?: NodeTypes;
	onNodesChange?: OnNodesChange<Node>;
	onEdgesChange?: OnEdgesChange<Edge>;
	/** Called when the (empty) pane is clicked. */
	onPaneClick?: (event: ReactMouseEvent) => void;
	onNodeClick?: NodeMouseHandler<Node>;
	/** Fit the whole graph to the viewport once on mount (default `true`). */
	fitOnMount?: boolean;
	/**
	 * Re-fit the viewport whenever the composition of the graph changes
	 * (the set of node ids), e.g. when nodes are filtered in or out.
	 * Plain property updates on existing nodes (selection, dragging) do
	 * not trigger a fit. Default `false`.
	 */
	fitOnNodesChange?: boolean;
	/**
	 * Pan the viewport with a plain wheel/trackpad scroll (instead of
	 * zooming). Trackpad pinch (ctrl+wheel) still zooms. Default `false`
	 * (wheel zooms, as usual).
	 */
	panOnScroll?: boolean;
	/**
	 * Key (or keys) that, while held, panning with a mouse drag uses —
	 * e.g. `["Meta", "Control"]` for cmd/ctrl+drag. Default `"Space"`.
	 */
	panActivationKeyCode?: "Space" | string | string[] | null;
	/**
	 * Which mouse buttons start a pane drag-pan (the modifier-key pan
	 * always uses the left button). `true` = any button (default),
	 * an array restricts it, e.g. `[0, 2]` for left + right.
	 */
	panOnDrag?: boolean | number[];
	/**
	 * Key that, while held, makes wheel scroll zoom instead of pan —
	 * only relevant with `panOnScroll`. Default `null` (no key zoom;
	 * trackpad pinch still zooms).
	 */
	zoomActivationKeyCode?: string | string[] | null;
	minZoom?: number;
	maxZoom?: number;
	/** Show the zoom / fit / lock controls, bottom-left (default `true`). */
	showControls?: boolean;
	/** Show the minimap, bottom-right (default `true`). */
	showMiniMap?: boolean;
	/**
	 * Background dot color. Defaults to a kit token; pass a CSS color to
	 * override. The canvas surface itself always uses the kit background
	 * token.
	 */
	backgroundColor?: string;
	/** Background dot pattern gap (default 24). */
	backgroundGap?: number;
	/**
	 * Exposes the React Flow `fitView` action (e.g. to focus a
	 * sub-area of the graph). Unstable identity — only consume it in
	 * event handlers, never as an effect dependency.
	 */
	fitViewRef?: { current: FitViewFn | null };
	/**
	 * Exposes the React Flow viewport actions (`zoomIn`, `zoomOut`,
	 * `zoomTo`, `getZoom`, `fitView`) for consumers that render their own
	 * control chrome (e.g. a custom zoom bar with `showControls` off).
	 * Unstable identity — only consume it in
	 * event handlers, never as an effect dependency.
	 */
	actionsRef?: { current: FlowCanvasActions | null };
	/**
	 * React Flow `onMove` passthrough — fires on every pan/zoom of the
	 * viewport (including its start and end). Consumers use it to keep
	 * their own chrome in sync, e.g. a live zoom-percentage label.
	 */
	onMove?: OnMove;
	/**
	 * When `current` is true, the auto whole-graph fit is skipped for
	 * the next node-set change (the id set is still tracked, so the
	 * following change fits normally). Consumers use it while fitting a
	 * sub-area instead: set `current` to true synchronously in the
	 * action that grows/shrinks the graph, then clear it once the
	 * focused fit resolves.
	 */
	skipAutoFitRef?: { current: boolean };
	classname?: string;
}

/** The React Flow `fitView` action, as exposed through `fitViewRef`. */
export type FitViewFn = (
	options?: FitViewOptions<Node>,
) => Promise<boolean>;

/**
 * The React Flow viewport actions, as exposed through `actionsRef`
 * (consumers typically use them from their own control chrome).
 */
export type FlowCanvasActions = {
	zoomIn: ReturnType<typeof useReactFlow>["zoomIn"];
	zoomOut: ReturnType<typeof useReactFlow>["zoomOut"];
	zoomTo: ReturnType<typeof useReactFlow>["zoomTo"];
	getZoom: ReturnType<typeof useReactFlow>["getZoom"];
	fitView: FitViewFn;
};

const FitOnChange = ({
	enabled,
	nodes,
	fitView,
	skipAutoFitRef,
}: {
	enabled: boolean;
	nodes: Node[];
	fitView: FitViewFn;
	skipAutoFitRef?: { current: boolean };
}) => {
	const idsRef = useRef<string | null>(null);
	useEffect(() => {
		// Sorted, comma-joined id list: stable across node property updates
		// (selection, dragging), changes only when the set of nodes does.
		const key = [...nodes.map((n) => n.id)].sort().join(",");
		// While disabled, track the id set without fitting so re-enabling
		// does not re-fit for changes that happened meanwhile.
		if (!enabled) {
			idsRef.current = key;
			return;
		}
		if (nodes.length === 0) return;
		if (key === idsRef.current) return;
		idsRef.current = key;
		// A focused sub-area fit is in flight for this exact change:
		// the consumer (a fold-dot click) set the flag and will fit the
		// sub-area itself — do not run the whole-graph fit over it.
		if (skipAutoFitRef?.current) return;
		// Let React Flow finish applying the new node set before fitting.
		const raf = requestAnimationFrame(() =>
			fitView({ duration: 300, padding: 0.08 }),
		);
		return () => cancelAnimationFrame(raf);
	}, [enabled, nodes, fitView, skipAutoFitRef]);
	return null;
};

const FlowCanvasInner = ({
	nodes,
	edges,
	fitViewRef,
	actionsRef,
	onMove,
	skipAutoFitRef,
	nodeTypes,
	onNodesChange,
	onEdgesChange,
	onPaneClick,
	onNodeClick,
	fitOnMount = true,
	fitOnNodesChange = false,
	panOnScroll = false,
	panActivationKeyCode = "Space",
	panOnDrag = true,
	zoomActivationKeyCode = null,
	minZoom = 0.05,
	maxZoom = 2,
	showControls = true,
	showMiniMap = true,
	backgroundColor,
	backgroundGap = 24,
	classname,
}: FlowCanvasProps) => {
	const { fitView, zoomIn, zoomOut, zoomTo, getZoom } = useReactFlow();
	// Expose the actions without re-rendering consumers (unstable
	// identity — same contract as `fitViewRef`).
	if (fitViewRef) fitViewRef.current = fitView;
	if (actionsRef)
		actionsRef.current = { zoomIn, zoomOut, zoomTo, getZoom, fitView };
	return (
		<div
			className={classNames(Styles.canvas, classname)}
			style={{
				...Styles.canvasVars,
				backgroundColor: Styles.canvasSurface,
			}}
		>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				nodeTypes={nodeTypes}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onPaneClick={onPaneClick}
				onNodeClick={onNodeClick}
				fitView={fitOnMount}
				fitViewOptions={{ duration: 300, padding: 0.08 }}
				onMove={onMove}
				panOnScroll={panOnScroll}
				panActivationKeyCode={panActivationKeyCode}
				zoomActivationKeyCode={zoomActivationKeyCode}
				panOnDrag={panOnDrag}
				minZoom={minZoom}
				maxZoom={maxZoom}
				proOptions={{ hideAttribution: true }}
				defaultEdgeOptions={{ type: "default" }}
			>
				<FitOnChange
					enabled={fitOnNodesChange}
					nodes={nodes}
					fitView={fitView}
					skipAutoFitRef={skipAutoFitRef}
				/>
				<Background
					color={backgroundColor ?? Styles.backgroundPatternColor}
					gap={backgroundGap}
				/>
				{showControls ? (
					<Controls
						position="bottom-left"
						className={Styles.controls}
						style={Styles.controlsButtons}
					/>
				) : null}
				{showMiniMap ? (
					<MiniMap
						position="bottom-right"
						className={Styles.miniMap}
						{...Styles.miniMapProps}
					/>
				) : null}
			</ReactFlow>
		</div>
	);
};

export const FlowCanvas = (props: FlowCanvasProps) => (
	<ReactFlowProvider>
		<FlowCanvasInner {...props} />
	</ReactFlowProvider>
);
