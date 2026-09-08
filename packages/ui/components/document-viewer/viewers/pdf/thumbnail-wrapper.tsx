import { RiDeleteBinLine, RiFileCopyLine } from "@remixicon/react";
import { css } from "@styles";
import classNames from "classnames";
import {
	type HTMLAttributes,
	type ReactNode,
	type SyntheticEvent,
	memo,
} from "react";
import { Stack } from "../../../../abstract/stack/stack";
import { Button } from "../../../button/button";
import { usePdfViewerStrings } from "./pdf-strings";

export type ThumbnailItemWrapperProps = {
	pageId: string;
	index: number;
	children: ReactNode;
	onRemove?: (pageId: string) => void;
	onCopy?: (pageId: string) => void;
	onRotateClockwise?: (pageId: string) => void;
	onRotateAnticlockwise?: (pageId: string) => void;
	disabled?: boolean;
	dragHandleProps?: HTMLAttributes<HTMLDivElement>;
};

const style = css({
	gap: "s.margin.s",
});

const actionIconStyle = css({
	display: "inline-flex",
	alignItems: "center",
	justifyContent: "center",
	width: "c.documentViewer.actionIcon",
	height: "c.documentViewer.actionIcon",
});

const stopActionStartPropagation = (event: SyntheticEvent) => {
	event.preventDefault();
	event.stopPropagation();
};

const stopActionBubblePropagation = (event: SyntheticEvent) => {
	event.stopPropagation();
};

const RotationIcon = ({
	direction,
	title,
}: {
	direction: "clockwise" | "anticlockwise";
	title: string;
}) => {
	const arrowHead =
		direction === "clockwise" ? "M17.5 6.5L20 4v6" : "M6.5 6.5L4 4v6";
	const arc =
		direction === "clockwise"
			? "M19 9a7 7 0 1 1-2.05-4.95"
			: "M5 9a7 7 0 1 0 2.05-4.95";

	return (
		<span aria-hidden className={actionIconStyle}>
			<svg
				viewBox="0 0 24 24"
				width="12"
				height="12"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				focusable="false"
			>
				<title>{title}</title>
				<path d={arc} />
				<path d={arrowHead} />
			</svg>
		</span>
	);
};

const ThumbnailItemWrapperComponent = ({
	pageId,
	index,
	children,
	onRemove,
	onCopy,
	onRotateClockwise,
	onRotateAnticlockwise,
	disabled = false,
	dragHandleProps,
}: ThumbnailItemWrapperProps) => {
	const strings = usePdfViewerStrings();

	return (
		<Stack direction="row" alignItems="center" className={style}>
			<div {...dragHandleProps}>{children}</div>
			<div
				onPointerDown={stopActionStartPropagation}
				onMouseDown={stopActionStartPropagation}
				onTouchStart={stopActionStartPropagation}
				onClick={stopActionBubblePropagation}
				onKeyDown={stopActionBubblePropagation}
			>
				<Stack direction="column" className={classNames(style)}>
					{onCopy ? (
						<Button
							level="secondary"
							onClick={() => {
								onCopy(pageId);
							}}
							aria-label={strings.copyPage(index + 1)}
							disabled={disabled}
						>
							<RiFileCopyLine size={12} />
						</Button>
					) : null}
					{onRemove ? (
						<Button
							level="secondary"
							onClick={() => {
								onRemove(pageId);
							}}
							aria-label={strings.deletePage(index + 1)}
							disabled={disabled}
						>
							<RiDeleteBinLine size={12} />
						</Button>
					) : null}
					{onRotateClockwise ? (
						<Button
							level="secondary"
							onClick={() => {
								onRotateClockwise(pageId);
							}}
							aria-label={strings.rotatePageClockwise(index + 1)}
							disabled={disabled}
						>
							<RotationIcon
								direction="clockwise"
								title={strings.rotateClockwise}
							/>
						</Button>
					) : null}
					{onRotateAnticlockwise ? (
						<Button
							level="secondary"
							onClick={() => {
								onRotateAnticlockwise(pageId);
							}}
							aria-label={strings.rotatePageAnticlockwise(index + 1)}
							disabled={disabled}
						>
							<RotationIcon
								direction="anticlockwise"
								title={strings.rotateAnticlockwise}
							/>
						</Button>
					) : null}
				</Stack>
			</div>
		</Stack>
	);
};

export const ThumbnailItemWrapper = memo(ThumbnailItemWrapperComponent);
