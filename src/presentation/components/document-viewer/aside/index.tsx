import classNames from "classnames";
import {
  type ReactNode,
  type RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { /* AsidePage,  */ AsidePagegroup } from "./page";

// import { Icon } from "../../icon";
import Button from "../../button";

import type { DocumentViewerProps, DragConfig, PageConfig } from "..";

import { useAppContext } from "@/presentation/contexts/app-context";
import useDocument from '@/presentation/hooks/use-document';
import { useGlobalDrag } from '@/presentation/hooks/use-global-drag';

export type AsideProps = {
  isPageView: boolean;
  pageConfigList: DocumentViewerProps["pageConfigList"];
  editable?: React.ReactElement;
  dragConfig?: DragConfig;
  pageFocus: number;
  groupFocus: number;
  navigateToAnchor: (anchor: string) => void;
  onAdd?: DocumentViewerProps["onAdd"];
  onPaste?: DocumentViewerProps["onPaste"];
  onMerge?: DocumentViewerProps["onMerge"];
  dropZoneRef: RefObject<HTMLDivElement | null>;
  actions?: DocumentViewerProps["actions"];
  children: ReactNode;
};

export const Aside = ({
  dropZoneRef,
  isPageView,
  pageConfigList,
  dragConfig,
  pageFocus,
  navigateToAnchor,
  onAdd,
  onPaste,
  // onMerge,
  actions,
  children,
}: AsideProps) => {
	const {
		currentNode: { document },
		currentFiles,
		localMemory,
	} = useAppContext();

  const { isActionAllowed } = useDocument();

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

	const isDragging = useGlobalDrag()

	const scrollToFocusedPage = () => {
		const focusedPageElement = pageRefs.current[pageFocus];
		if (focusedPageElement) {
			focusedPageElement.scrollIntoView({
				behavior: "smooth",
				block: "center",
			});
		}
	};
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(scrollToFocusedPage, [pageFocus]);

  const isSameDocument = useMemo(() => {
    return dragConfig?.dragged?.documentCode === document?.documentCode;
  }, [dragConfig?.dragged, document]);

  const handlePageNavigation = (focus: [number, number]) => {
    const flatPageNumber = pageConfigList.slice(0, focus[0]).flat().length + 1;
    navigateToAnchor(`page${flatPageNumber}`);
  };

  useEffect(() => {
    pageRefs.current = pageRefs.current.slice(0, pageConfigList.length);
  }, [pageConfigList]);

  const renderPageGroup = (config: PageConfig[], itemIndex: number) => {
    const groupAnchor = useMemo(() => {
      return (
        pageConfigList
          .slice(0, itemIndex)
          .map((pageConfig) => pageConfig.length)
          .reduce((a, b) => a + b, 0) + 1
      );
    }, [pageConfigList, itemIndex]);

    return (
      <div
        key={`aside-page-group-${itemIndex}`}
        ref={(el) => {
          pageRefs.current[itemIndex] = el;
        }}
        className={classNames("page-container")}
        // onClick={() => {
        //   handlePageNavigation([itemIndex, 1])
        // }}
      >
        <div className={classNames("meta")}>
          {itemIndex + 1}({config[0]?.pageCount || 1})
        </div>
        <AsidePagegroup
          configList={config}
          handlePageNavigation={handlePageNavigation}
          navigateToAnchor={navigateToAnchor}
          isFocus={/* groupFocus === itemIndex */ false}
          pageFocus={pageFocus}
          groupIndex={itemIndex}
          groupAnchor={groupAnchor}
          isExpended={false}
          actions={actions?.filter(({ slot }) => slot === "selection")}
          dragHandlers={dragConfig}
          setDraggedIndex={setDraggedIndex}
          draggedIndex={draggedIndex}
        />
      </div>
    );
  };

  // const renderPage = (config: PageConfig, itemIndex: number) => {
  //   return (
  //     // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
  //     <div
  //       key={`page-container-${itemIndex}`}
  //       ref={(el) => {
  //         pageRefs.current[itemIndex] = el;
  //       }}
  //       className={classNames("page-container")}
  //       onClick={() => handlePageNavigation([itemIndex, 1])}
  //     >
  //       <div className={classNames("meta")}>{config.pageNumber}</div>
  //       <AsidePage
  //         config={config}
  //         isFocus={itemIndex === focus[0] && config.pageNumber === focus[1]}
  //         groupIndex={itemIndex}
  //         dragHandlers={dragConfig}
  //       />
  //       <Button.Icon title="actions" onClick={() => "déplie les actions"}>
  //         <Icon.More size="small" />
  //       </Button.Icon>
  //     </div>
  //   );
  // };

	return (
		<aside
			className={classNames("page-list", { open: isPageView })}
			ref={dropZoneRef}
		>
			<div className={classNames("list")} ref={previewContainerRef}>
				{isActionAllowed(true) && <>
          {onAdd && <Button onClick={onAdd}>Add Files</Button>}
          {onPaste && (
            <Button
              onClick={onPaste}
              disabled={
                localMemory.copiedFileId === undefined ||
                localMemory.clipboard === undefined
              }
            >
              Paste
            </Button>
          )}
          {children && (
            <div className={classNames("custom-aside")}>{children}</div>
          )}
        </>}
				<h3>Pages</h3>
				<div className={classNames("list", { droppable: isDragging, empty: currentFiles.length === 0 })}>
					{pageConfigList.length > 0 ? (
						pageConfigList.map((pages, itemIndex) => {
							const isFirstItem = draggedIndex === 0;
							const isAdjacent =
								draggedIndex === itemIndex || draggedIndex === itemIndex + 1;

              const currentId = pages[0]?.fileId;
              const direction =
                draggedIndex !== null
                  ? itemIndex > draggedIndex
                    ? "down"
                    : "up"
                  : "none";

              return (
                // biome-ignore lint/correctness/useJsxKeyInIterable: <explanation>
                <>
                  {itemIndex === 0 && (
                    <div
                      className={classNames("insert-indicator", "hidden", {
                        ignored: isFirstItem && isSameDocument,
                      })}
                      data-drop={`before:${currentId}`}
                    />
                  )}
                  {renderPageGroup(pages, itemIndex)}
                  {
                    <div
                      className={classNames("insert-indicator", "hidden", {
                        ignored: isAdjacent && isSameDocument,
                      })}
                      data-drop={
                        direction === "down"
                          ? `before:${currentId}`
                          : `after:${currentId}`
                      }
                      key={`insert-after-${currentId}`}
                    />
                  }
                </>
              );
            })
          ) : (
            <>
              <div
                className={classNames("insert-indicator", "hidden")}
                data-drop={"toLast"}
              />
            </>
          )}
        </div>
      </div>
    </aside>
  );
};
