import { Handle, Position } from "@xyflow/react";
import classNames from "classnames";
import type { ReactNode } from "react";
import { Styles } from "./styles";

export interface FlowNodeCardData {
	/**
	 * Left-border accent color (any CSS color), e.g. one per author.
	 * Falls back to the default neutral border token when omitted.
	 */
	accent?: string;
	/**
	 * Persistent emphasis level, from the viewer outward: "current" is
	 * the strongest (the viewer's own context), "near" is one level
	 * further, "far" the calmest/furthest. Unset = the default card.
	 * Adds a tinted surface and border ring, independent of hover and
	 * of the interactive selection ring.
	 */
	tone?: "current" | "near" | "far";
	/** First row, middle — ellipsis'd (e.g. a commit subject). */
	title?: string;
	/** First row, left — muted (e.g. a short hash). */
	top?: ReactNode;
	/**
	 * Full content override — renders in place of the two default slot
	 * rows. When set, `icon`/`top`/`bottomLabel`/`bottomRight` are
	 * ignored; the card keeps its shell (accent border, tone, selection
	 * ring, click, handles).
	 */
	content?: ReactNode;
	/** Second row, left — muted (e.g. an author name). */
	bottomLabel?: ReactNode;
	/** Second row, right — small stat (e.g. a churn count). */
	bottomRight?: ReactNode;
	selected: boolean;
	onClick: () => void;
}

interface FlowNodeCardProps {
	data: FlowNodeCardData;
	/** Accessible name for the card (defaults to the title). */
	"aria-label"?: string;
	/**
	 * Edge orientation. "horizontal" (default): edges run left→right,
	 * handles on the left (target) and right (source) edges.
	 * "vertical": edges run bottom→top, handles on the bottom (target)
	 * and top (source) edges.
	 */
	direction?: "horizontal" | "vertical";
	classname?: string;
}

/**
 * A generic React Flow node shell: a clickable card with a colored left
 * border, a two-row layout (top: muted label + ellipsis'd title, bottom:
 * muted label + small stat) and hidden Handles so default edges connect
 * along the given direction. Usable directly as an entry in `nodeTypes`.
 */
export const FlowNodeCard = ({
	data,
	"aria-label": ariaLabel,
	direction = "horizontal",
	classname,
}: FlowNodeCardProps) => {
	const isVertical = direction === "vertical";
	return (
		<button
			type="button"
			className={classNames(
				Styles.card,
				data.tone === "current" && Styles.cardHighlighted,
				data.tone === "near" && Styles.cardNear,
				data.tone === "far" && Styles.cardFar,
				data.selected && Styles.cardSelected,
				classname,
			)}
			style={
				data.accent && !data.tone
					? { borderLeftColor: data.accent }
					: undefined
			}
			aria-label={ariaLabel ?? data.title}
			onClick={data.onClick}
		>
			<Handle
				type="target"
				position={isVertical ? Position.Bottom : Position.Left}
				className={Styles.hiddenHandle}
			/>
			{data.content ? (
				data.content
			) : (
				<>
					<span className={Styles.cardRow}>
						{data.top ? (
							<span
								className={classNames(
									Styles.cardEllipsis,
									Styles.cardMuted,
								)}
							>
								{data.top}
							</span>
						) : null}
						{data.title ? (
							<span className={Styles.cardEllipsis} title={data.title}>
								{data.title}
							</span>
						) : null}
					</span>
					<span className={Styles.cardRow}>
						{data.bottomLabel ? (
							<span
								className={classNames(
									Styles.cardEllipsis,
									Styles.cardMuted,
								)}
							>
								{data.bottomLabel}
							</span>
						) : null}
						{data.bottomRight ? (
							<span className={Styles.cardStat}>
								{data.bottomRight}
							</span>
						) : null}
					</span>
				</>
			)}
			<Handle
				type="source"
				position={isVertical ? Position.Top : Position.Right}
				className={Styles.hiddenHandle}
			/>
		</button>
	);
};
