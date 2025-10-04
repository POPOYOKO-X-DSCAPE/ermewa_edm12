import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import classNames from "classnames";
import { PDFDocument } from "pdf-lib";
import { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import type { PositionCombo } from "../../../../abstract";
import { Stack } from "../../../../abstract/stack";
import { useComponentSize } from "../../../../hooks/use-component-size";
import {
  pandaDocument,
  pandaHide,
  pandaOverlay,
  pandaPage,
  pandaViewer,
  pandaViewerPadding,
} from "./styles";
import { ThumbnailItemWrapper } from "./thumbnail-wrapper";
import { PdfThumbnails } from "./thumbnails";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export type PdfViewerMode = "view" | "edit";

export type PdfViewerProps = {
  pdfUrl: string;
  onPageCopy?: (pagePdfUrl: string) => void;
  currentZoom?: number;
  zoomMode?: "fit-width" | "fit-height" | "custom";
  onZoomChange?: (effectiveZoom: number) => void;
  mode?: PdfViewerMode;
  onPagesChange?: (pages: number[]) => void;
  overlayChildren?: { position: PositionCombo; children: React.ReactElement }[];
};

const SortableThumbnail = ({
  id,
  index,
  children,
  onRemove,
  onCopy,
}: {
  id: string;
  index: number;
  children: React.ReactNode;
  onRemove?: (index: number) => void;
  onCopy?: (pageIndex: number) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ThumbnailItemWrapper index={index} onRemove={onRemove} onCopy={onCopy}>
        {children}
      </ThumbnailItemWrapper>
    </div>
  );
};

const NonSortableThumbnail = ({
  id,
  index,
  children,
  onCopy,
}: {
  id: string;
  index: number;
  children: React.ReactNode;
  onRemove?: (index: number) => void;
  onCopy?: (pageIndex: number) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ThumbnailItemWrapper index={index} onCopy={onCopy}>
        {children}
      </ThumbnailItemWrapper>
    </div>
  );
};

export const PdfViewer = ({
  pdfUrl,
  onPageCopy,
  currentZoom = 1,
  zoomMode = "fit-height",
  onZoomChange,
  mode = "view",
  onPagesChange,
  overlayChildren,
}: PdfViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [viewerRef, { width: viewerWidth, height: viewerHeight }] =
    useComponentSize<HTMLDivElement>();
  const [pageSize, setPageSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [pages, setPages] = useState<number[]>([]);

  const [isHidden, setIsHidden] = useState(true);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseMoveOrScroll = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    setIsHidden(false); // Rendre visible lors de l'interaction
    hideTimeoutRef.current = setTimeout(() => {
      setIsHidden(true); // Cacher après 2 secondes d'inactivité
    }, 2000);
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMoveOrScroll);
    window.addEventListener("scroll", handleMouseMoveOrScroll);
    window.addEventListener("click", handleMouseMoveOrScroll);

    return () => {
      window.removeEventListener("mousemove", handleMouseMoveOrScroll);
      window.removeEventListener("scroll", handleMouseMoveOrScroll);
      window.removeEventListener("click", handleMouseMoveOrScroll);

      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const previousBlobUrl = useRef<string | null>(null);
  const loadedPdfBytes = useRef<Uint8Array | null>(null);

  const makePageRefAt =
    (i: number): React.RefCallback<HTMLDivElement> =>
    (el) => {
      pageRefs.current[i] = el;
    };

  const scrollToPage = (index: number) => {
    pageRefs.current[index]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const loadPdfBytes = async () => {
    if (!loadedPdfBytes.current) {
      const arrayBuffer = await fetch(pdfUrl).then((res) => res.arrayBuffer());
      loadedPdfBytes.current = new Uint8Array(arrayBuffer);
    }
    return loadedPdfBytes.current;
  };

  const handlePageCopy = async (pageIndex: number) => {
    if (!onPageCopy) return;
    const pdfBytes = await loadPdfBytes();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const newPdf = await PDFDocument.create();
    const [copiedPage] = await newPdf.copyPages(pdfDoc, [pageIndex]);
    newPdf.addPage(copiedPage);
    const newPdfBytes = await newPdf.save();
    const blob = new Blob([new Uint8Array(newPdfBytes)], {
      type: "application/pdf",
    });
    const blobUrl = URL.createObjectURL(blob);
    if (previousBlobUrl.current) {
      URL.revokeObjectURL(previousBlobUrl.current);
    }
    previousBlobUrl.current = blobUrl;
    onPageCopy(blobUrl);
  };

  const effectiveZoom = useMemo(() => {
    if (!pageSize) return currentZoom;
    if (zoomMode === "fit-width" && viewerWidth)
      return viewerWidth / pageSize.width;
    if (zoomMode === "fit-height" && viewerHeight)
      return viewerHeight / pageSize.height;
    return currentZoom;
  }, [zoomMode, currentZoom, pageSize, viewerWidth, viewerHeight]);

  useEffect(() => {
    onZoomChange?.(effectiveZoom);
  }, [effectiveZoom, onZoomChange]);

  const handleRemove = (index: number) => {
    setPages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      onPagesChange?.(next);
      return next;
    });
  };

  return (
    <Stack direction="row" grow>
      {mode === "edit" ? (
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={({ active, over }) => {
            if (over && active.id !== over.id) {
              setPages((prev) => {
                const oldIndex = prev.indexOf(Number(active.id));
                const newIndex = prev.indexOf(Number(over.id));
                const next = arrayMove(prev, oldIndex, newIndex);
                onPagesChange?.(next);
                return next;
              });
            }
          }}
        >
          <SortableContext
            items={pages.map(String)}
            strategy={verticalListSortingStrategy}
          >
            <PdfThumbnails
              pdfUrl={pdfUrl}
              numPages={numPages}
              onPageClick={scrollToPage}
              renderItem={(i, node) => (
                <SortableThumbnail
                  id={String(i)}
                  key={i}
                  index={i}
                  onRemove={handleRemove}
                  onCopy={onPageCopy ? handlePageCopy : undefined}
                >
                  {node}
                </SortableThumbnail>
              )}
            />
          </SortableContext>
        </DndContext>
      ) : (
        <PdfThumbnails
          pdfUrl={pdfUrl}
          numPages={numPages}
          onPageClick={scrollToPage}
          onPageCopy={onPageCopy ? handlePageCopy : undefined}
          renderItem={(i, node) => (
            <NonSortableThumbnail
              id={String(i)}
              key={i}
              index={i}
              onCopy={onPageCopy ? handlePageCopy : undefined}
            >
              {node}
            </NonSortableThumbnail>
          )}
        />
      )}
      <Stack grow className={classNames(pandaViewer)}>
        <Stack
          ref={viewerRef}
          className={classNames(pandaViewer)}
          grow
          scrollable
          direction="column"
          alignItems="center"
          justifyContent="center"
        >
          <Document
            file={pdfUrl}
            onLoadSuccess={({ numPages }) => {
              setNumPages(numPages);
              if (mode === "edit") {
                setPages(Array.from({ length: numPages }, (_, i) => i));
                onPagesChange?.(Array.from({ length: numPages }, (_, i) => i));
              }
            }}
            className={pandaDocument}
          >
            {(mode === "edit"
              ? pages
              : Array.from({ length: numPages }, (_, i) => i)
            ).map((pageIndex) => (
              <div key={pageIndex} ref={makePageRefAt(pageIndex)}>
                <Page
                  pageNumber={pageIndex + 1}
                  className={pandaPage}
                  scale={effectiveZoom}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  onLoadSuccess={(page) => {
                    if (!pageSize) {
                      const viewport = page.getViewport({ scale: 1 });
                      setPageSize({
                        width: viewport.width,
                        height: viewport.height,
                      });
                    }
                  }}
                />
              </div>
            ))}
          </Document>
        </Stack>
        {overlayChildren?.map((overlayChild, i) => (
          <Stack
            // biome-ignore lint/suspicious/noArrayIndexKey: <static>
            key={i}
            position={{
              position: overlayChild.position,
              type: "relativeToParent",
            }}
            grow
            className={classNames(
              pandaViewerPadding,
              pandaOverlay,
              isHidden && pandaHide
            )}
          >
            {overlayChild.children}
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
};
