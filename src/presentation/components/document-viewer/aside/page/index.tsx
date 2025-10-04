import classNames from "classnames";

import {
	type Dispatch,
	type DragEvent,
	type MouseEvent,
	type ReactNode,
	type SetStateAction,
	useMemo,
	useState,
} from "react";

import type { DocumentViewerProps } from "@/presentation/components/document-viewer";

import Button from "@/presentation/components/button";
import { Icon } from "@/presentation/components/icon";

export type PageConfig = {
	fileId: string;
	pageId: string;
	imageSrc: string;
	alt: string;
	style: {
		objectFit: string;
		width: string;
		height: string;
	};
	pageNumber: number;
	pageCount: number;
	extension: string;
	msgFile: File | null;
	groupIndex: number;
};

export type DragConfig = {
	handleDragStart?: (payload?: {
		extension: string;
		index: number;
		itemNumber?: number;
		repository: "pages" | "files";
		id: string;
	}) => void;
	handleDragEnd?: () => void;
	dragged?: { id: string; extension: string; documentCode: string };
};

// --- util function for icon rendering ---
function renderIcon(
	IconProp: ((props: { size?: "small" | "medium" | "large" }) => ReactNode) | ReactNode,
): ReactNode {
	if (typeof IconProp === "function") {
		return <IconProp size="small" />;
	}

	return IconProp;
}

// --- util function for action rendering ---
type IDKey = "fileId" | "pageId";

export function renderActionsPanel(
	actions: DocumentViewerProps["actions"] | undefined,
	contextId: string,
	idKey: IDKey = "fileId",
): ReactNode | null {
	if (!actions) return null;

	const visibleActions = actions.filter((a) => a /* a.predicate !== false */);
	const firstThree = visibleActions.slice(0, 3);
	const remaining = visibleActions.slice(3);
	return (
		<div className="actions">
			{firstThree.map(({ label, handler, Icon: ActionIcon }, index) => (
				<Button.Icon
					key={`action-${label + index}`}
					title={label}
					onClick={() => handler({ [idKey]: contextId })}
				>
					{/* @ts-ignore */}
					{ActionIcon ? renderIcon(ActionIcon) : renderIcon(Icon.Edit)}
				</Button.Icon>
			))}

			{remaining.length > 0 && (
				<Button.MenuIcon
					size="small"
					buttons={remaining.map(
						({ handler, label, disabled, Icon: MenuIcon }, index) => ({
							onClick: () => handler({ [idKey]: contextId }),
							disabled,
							children: [
								<div className="menu-item" key={`menu-action-${label + index}`}>
									{/* @ts-ignore */}
									{MenuIcon ? renderIcon(MenuIcon) : renderIcon(Icon.Edit)}
									<span>{label}</span>
								</div>,
							],
						}),
					)}
				/>
			)}
		</div>
	);
}

// --- AsidePage Component ---
export interface AsidePageProps {
	config: PageConfig;
	isFocus: boolean;
	pageIndex: number;
	actions?: DocumentViewerProps["actions"];
	draggable?: boolean;
	dragHandlers?: DragConfig;
	setDraggedIndex: Dispatch<SetStateAction<number | null>>;
	handlePageNavigation: (focus: [number, number]) => void;
	navigateToAnchor: (anchor: string) => void;
}

export const AsidePage = ({
	config: { imageSrc, extension, pageNumber, pageId },
	isFocus,
	pageIndex,
	actions,
	draggable,
	dragHandlers,
	setDraggedIndex,
	navigateToAnchor,
}: AsidePageProps): ReactNode => {
	const handleClick = (e: MouseEvent) => {
		e.preventDefault();
		navigateToAnchor(`page${pageNumber}`);
	};

	return (
		<span
			className="aside-page"
			onDragStart={(e: DragEvent<HTMLSpanElement>) => {
				if (!draggable) return;
				e.stopPropagation();
				setDraggedIndex(pageIndex);
				dragHandlers?.handleDragStart?.({
					extension,
					index: pageIndex,
					itemNumber: pageNumber,
					repository: "pages",
					id: pageId || "none",
				});
			}}
			draggable={draggable}
		>
			{!["pdf", "png", "jpeg", "jpg"].includes(extension) ? (
				// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
				<div
					id={`page${pageNumber}`}
					className={classNames("page", "unreadable", { selected: isFocus })}
					onClick={handleClick}
				>
					<Icon.DocumentExtension
						title={extension}
						extension={extension}
						fill="black"
					/>
				</div>
			) : (
				// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
				<img
					id={`page${pageNumber}`}
					className={classNames("page", { selected: isFocus })}
					src={imageSrc}
					onClick={handleClick}
					alt={`${extension} page`}
				/>
			)}
			{renderActionsPanel(actions, pageId, "pageId")}
		</span>
	);
};

// --- AsidePageGroup Component ---
export interface AsidePageGroupProps {
	configList: PageConfig[];
	groupIndex: number;
	groupAnchor: number;
	pageFocus: number;
	navigateToAnchor: (anchor: string) => void;
	isFocus: boolean;
	isExpended: boolean;
	actions?: DocumentViewerProps["actions"];
	dragHandlers?: DragConfig;
	setDraggedIndex: Dispatch<SetStateAction<number | null>>;
	handlePageNavigation: (focus: [number, number]) => void;
	draggedIndex: number | null;
}

export const AsidePagegroup = ({
	navigateToAnchor,
	handlePageNavigation,
	pageFocus,
	isFocus,
	configList,
	groupIndex,
	groupAnchor,
	isExpended,
	actions,
	dragHandlers,
	setDraggedIndex,
	draggedIndex,
}: AsidePageGroupProps): ReactNode => {
	const [shouldExpend, setShouldExpend] = useState<boolean>(isExpended);
	const fileId = useMemo(() => configList[0]?.fileId, [configList]);

	return (
		<>
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
			<div
				className={classNames("page-group", {
					selected: isFocus,
					expended: shouldExpend,
				})}
				title={configList[0]?.fileId || ""}
				onDoubleClick={(e: MouseEvent<HTMLDivElement>) => {
					e.stopPropagation();
					e.preventDefault();
					setShouldExpend(!shouldExpend);
				}}
				draggable={!shouldExpend}
				style={{ cursor: "grab" }}
				onDragStart={() => {
					setDraggedIndex(groupIndex);
					dragHandlers?.handleDragStart?.({
						extension: "pdf",
						index: groupIndex,
						repository: "files",
						id: configList[0].fileId,
					});
				}}
				onDragEnd={() => {
					dragHandlers?.handleDragEnd?.();
					setDraggedIndex(null);
				}}
				onClick={(e) => {
					e.preventDefault();
					if (!shouldExpend) {
						navigateToAnchor(`page${groupAnchor}`);
					}
				}}
			>
				{configList.map((config, itemIndex) => {
					const isFirstItem = draggedIndex === 0;
					const isIgnored =
						draggedIndex === itemIndex || draggedIndex === itemIndex + 1;
					const pageId = config.pageId;
					const direction =
						draggedIndex !== null
							? itemIndex > draggedIndex
								? "down"
								: "up"
							: "none";

					if (itemIndex === 0 || shouldExpend) {
						return (
							<>
								{itemIndex === 0 && shouldExpend && (
									<div
										className={classNames("insert-indicator", "hidden", {
											ignored: isFirstItem,
										})}
										data-drop={`before:${pageId}`}
									/>
								)}
								<AsidePage
									config={config}
									isFocus={pageFocus === config.pageNumber}
									pageIndex={itemIndex}
									actions={shouldExpend ? actions : undefined}
									dragHandlers={dragHandlers}
									draggable={shouldExpend}
									handlePageNavigation={handlePageNavigation}
									setDraggedIndex={setDraggedIndex}
									navigateToAnchor={navigateToAnchor}
								/>
								{shouldExpend && (
									<div
										className={classNames("insert-indicator", "hidden", {
											ignored: isIgnored,
										})}
										data-drop={
											direction === "down"
												? `before:${pageId}`
												: `after:${pageId}`
										}
									/>
								)}
							</>
						);
					}

					if (itemIndex < 3 && !shouldExpend) {
						return (
							<div className={classNames("group-back")}>
								<AsidePage
									config={config}
									isFocus={pageFocus === config.pageNumber}
									pageIndex={itemIndex}
									dragHandlers={dragHandlers}
									draggable={shouldExpend}
									handlePageNavigation={handlePageNavigation}
									setDraggedIndex={setDraggedIndex}
									navigateToAnchor={navigateToAnchor}
								/>
							</div>
						);
					}
					return null;
				})}
			</div>

			{actions &&
				!shouldExpend &&
				renderActionsPanel(actions, fileId ?? "none", "fileId")}
		</>
	);
};
