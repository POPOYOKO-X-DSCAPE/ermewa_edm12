import classNames from "classnames";
import type { Dispatch, PropsWithChildren, ReactNode, SetStateAction } from "react";
import {
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

import useAnchors from "@/presentation/hooks/use-anchors";
import useDropZone, {
	type DropZoneOptions,
} from "@/presentation/hooks/use-drop-zone";

import Button from "../button";
import { Icon } from "../icon";
import { Loader } from "../loader";
import MsgViewer from "../msg-viewer";
import { Aside } from "./aside";

import "./index.scss";
import { useAppContext } from "@/presentation/contexts/app-context";

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

export type DocumentViewerProps = {
	isReadOnly?: boolean;
	onConvert?: (fileId: string) => void | Promise<void>;
	onAdd?: () => void;
	onPaste?: () => void;
	extensionsMap: {
		Icon: ReactNode;
		key: string;
		ext: string;
	}[];
	dropZoneConfig?: DropZoneOptions;
	dragConfig?: DragConfig;
	onMerge?: () => void;
	pageConfigList: PageConfig[][];
	actions: {
		slot: "document" | "selection" | "floating";
		label: string;
		handler: (option?: { fileId?: string; pageId?: string }) => void;
		predicate: boolean;
		disabled?: boolean;
		Icon?: ((props: { size?: "small" | "medium" | "large" }) => ReactNode) | ReactNode;
	}[];
	focus: [number, number];
	setFocus: Dispatch<SetStateAction<[number, number]>>;
};

const PagePlaceholder = ({ fullWidth }: { fullWidth: boolean }) => (
	<div
		className={classNames("page", "placeholder", { "full-width": fullWidth })}
	>
		<Loader />
		Loading page
	</div>
);

export const DocumentViewer = ({
	dropZoneConfig,
	isReadOnly = true,
	actions,
	pageConfigList,
	onAdd,
	onPaste,
	onConvert,
	onMerge,
	children,
	extensionsMap,
	dragConfig,
}: PropsWithChildren<DocumentViewerProps>) => {
	const { isConverterEnabled } = useAppContext();

	const [isLoading, setIsLoading] = useState(false);
	const [isPageView, setIsPageView] = useState<boolean>(true);
	const [loadedPages, setLoadedPages] = useState<(ReactNode | null)[]>([]); // Tableau pour les pages chargées
	const [fullWidthView, setFullWithView] = useState(false);

	const pageFocus = useRef(1);
	const groupFocus = useRef(1);

	const { scrollContainerRef, navigateToAnchor } = useAnchors((hash) => {
		const pageNumber = Number(hash.split("#page")[1]);
		pageFocus.current = pageNumber;

		let pageCount = 0;
		for (let index = 0; index < pageConfigList.length; index++) {
			const config = pageConfigList[index];
			pageCount += config.length;
			if (pageNumber < pageCount) {
				groupFocus.current = index;
				break;
			}
		}

		const mainPageAnchor = document.querySelector(`.page-view > ${hash}.page`);
		mainPageAnchor?.scrollIntoView({ behavior: "smooth" });
	});

	const selectionActions = useMemo(
		() => actions?.filter(({ slot }) => slot === "selection"),
		[actions],
	);

	const { dropZoneRef } = useDropZone(dropZoneConfig, dragConfig?.dragged);

	useEffect(() => {
		const placeholders = new Array(
			pageConfigList.flat()[0]?.pageCount || 0,
		).fill(null);
		setLoadedPages(placeholders);

		pageConfigList.flat().forEach((page, index) => {
			const { extension, pageNumber, pageCount } = page;

			let toLoad: ReactNode;
			switch (extension) {
				case "pdf":
				case "png":
				case "jpg":
				case "jpeg":
					toLoad = (
						<img
							id={`page${index + 1}`}
							src={page.imageSrc}
							className={classNames("page", { "full-width": fullWidthView })}
							key={`${index}/${pageNumber}-${pageCount}`}
							alt={`page ${index + 1}`}
						/>
					);
					break;
				case "msg":
					toLoad = (
						<div
							id={`page${index + 1}`}
							className={classNames("page", "msg-viewer", {
								"full-width": fullWidthView,
							})}
							key={`msg-${page.pageId}`}
						>
							<MsgViewer file={page.msgFile || null} />
						</div>
					);
					break;
				default: {
					const officeExtensions = [
						"doc",
						"docx",
						"dot",
						"dotx",
						"rtf",
						"csv",
						"xls",
						"xlsx",
						"xlsm",
						"xlsb",
						"xlt",
						"xltx",
						"ppt",
						"pptx",
						"pps",
						"ppsx",
						"pot",
						"potx",
						"odt",
						"ods",
						"odp",
						"odb",
						"odg",
						"odf",
					];
					console.log(extension);

					if (isConverterEnabled && officeExtensions.includes(extension)) {
						toLoad = (
							<div
								id={`page${index + 1}`}
								className={classNames("page", "unreadable", {
									"full-width": fullWidthView,
								})}
							>
								Unable to display {extension.toUpperCase()} extensions
								<Icon.DocumentExtension
									title={extension.toUpperCase()}
									extension={extension.toUpperCase()}
									fill="purple"
								/>
								<span className={classNames("actions")}>
									{onConvert && (
										<Button
											onClick={async () => {
												setIsLoading(true);
												await onConvert(page.fileId);
												setIsLoading(false);
											}}
											disabled={isLoading}
										>
											Convert
										</Button>
									)}
								</span>
							</div>
						);
					}
					break;
				}
			}

			setLoadedPages((prev) => {
				const loaded = [...prev];
				loaded[index] = toLoad;
				return loaded;
			});
		});
	}, [pageConfigList, isConverterEnabled, isLoading, onConvert, fullWidthView]);

	return (
		<section className={classNames("document-viewer")}>
			<header>
				{!isReadOnly ? (
					<Button.Icon
						title="edit document"
						onClick={() => setIsPageView(!isPageView)}
					>
						<Icon.Edit size="small" />
					</Button.Icon>
				) : (
					<Button.Icon
						title="view pages"
						onClick={() => setIsPageView(!isPageView)}
					>
						<Icon.ViewPages size="small" />
					</Button.Icon>
				)}
				<div className="custom-header">{children}</div>
			</header>
			<div className={classNames("document-view")}>
				<Aside
					dropZoneRef={dropZoneRef}
					isPageView={isPageView}
					pageConfigList={pageConfigList}
					dragConfig={dragConfig}
					editable={<div>test</div>}
					onAdd={onAdd}
					onMerge={onMerge}
					onPaste={onPaste}
					navigateToAnchor={navigateToAnchor}
					groupFocus={groupFocus.current}
					pageFocus={pageFocus.current}
					actions={selectionActions}
				>
					<div className={classNames("extensions-on-drop")}>
						{extensionsMap.map(({ Icon, ext, key }) => (
							<span title={ext} key={key}>
								{Icon}
							</span>
						))}
					</div>
				</Aside>
				<div className={classNames("page-view")} ref={scrollContainerRef}>
					{loadedPages.map(
						(page) => page || <PagePlaceholder fullWidth={fullWidthView} />,
					)}
					<div className={classNames("floating-toogles")}>
						<Button
							onClick={() => {
								setFullWithView((prev) => !prev);
							}}
						>
							{fullWidthView ? "Zoom out" : "Zoom in"}
						</Button>
					</div>
					<div className={classNames("floating-buttons")}>
						{actions
							.filter(({ slot }) => slot === "floating")
							.map(
								({ handler, label, predicate, disabled }) =>
									predicate && (
										<Button
											onClick={() => handler()}
											disabled={disabled || isLoading}
										>
											{label}
										</Button>
									),
							)}
					</div>
				</div>
			</div>
		</section>
	);
};
