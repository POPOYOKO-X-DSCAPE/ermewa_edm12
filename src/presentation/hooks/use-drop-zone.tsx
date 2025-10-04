import { useCallback, useEffect, useRef, useState } from "react";

export type MoveOptions = "before" | "after" | "toLast";

export type DropZoneOptions =
  | {
      allowedExtensions: string[];
      itemsSelector: string;
      groupsSelector: string;
      insertIndicatorStyle?: React.CSSProperties;
      ghostElementStyle?: React.CSSProperties;
      onMove?: (options: {
        sourceId: string;
        targetId?: string;
        patch?: Record<string, unknown>;
        position?: MoveOptions;
      }) => void | Promise<void>;
      onDrop: (
        files: File[],
        targetRef: {
          id: string;
          position: MoveOptions;
          patch?: Record<string, unknown>;
        }
      ) => void | Promise<void>;
    }
  | undefined;

const useDropZone = (
  config: DropZoneOptions,
  dragged?: { id: string; extension: string }
) => {
  const dropZoneRef = useRef<HTMLDivElement | null>(null);
  const selectedDocumentRef = useRef<HTMLElement | null>(null);
  const targetRef = useRef<{
    id: string;
    position: MoveOptions;
  } | null>(null);

  const [indicatorPositions, setIndicatorPositions] = useState<
    Array<{
      element: HTMLElement;
      centerX: number;
      centerY: number;
    }>
  >([]);

  const rafId = useRef<number | null>(null);

  if (!config) return { dropZoneRef, selectedDocumentRef };

  const {
    // allowedExtensions,
    // itemsSelector,
    // groupsSelector,
    // insertIndicatorStyle,
    // ghostElementStyle,
    onDrop,
    onMove,
  } = config;

  const preventBrowserDefaults = useCallback((e: Event) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const updateIndicatorPositions = useCallback(() => {
    if (!dropZoneRef.current) return;

    const dropZone = dropZoneRef.current;
    const indicators = Array.from(
      dropZone.querySelectorAll<HTMLElement>(".insert-indicator")
    );

    const positions = indicators.map((indicator) => {
      const rect = indicator.getBoundingClientRect();
      const dropZoneRect = dropZone.getBoundingClientRect();

      return {
        element: indicator,
        centerX:
          rect.left - dropZoneRect.left + rect.width / 2 + dropZone.scrollLeft,
        centerY:
          rect.top - dropZoneRect.top + rect.height / 2 + dropZone.scrollTop,
      };
    });

    setIndicatorPositions(positions);
  }, []);

  const hideIndicators = useCallback(() => {
    if (dropZoneRef.current) {
      const indicators = Array.from(
        dropZoneRef.current.querySelectorAll<HTMLElement>(".insert-indicator")
      );
      for (const indicator of indicators) {
        indicator.classList.add("hidden");
      }
    }
  }, []);

  useEffect(() => {
    const dropZone = dropZoneRef.current;
    if (!dropZone) return;

    const observer = new MutationObserver(() => {
      updateIndicatorPositions();
    });

    observer.observe(dropZone, {
      childList: true,
      subtree: true,
    });

    updateIndicatorPositions();

    return () => observer.disconnect();
  }, [updateIndicatorPositions]);

  const handleDragover = useCallback(
    (e: DragEvent) => {
      preventBrowserDefaults(e);

      if (!dropZoneRef.current) return;

      const dropZone = dropZoneRef.current;

      const mouseX =
        e.clientX - dropZone.getBoundingClientRect().left + dropZone.scrollLeft;
      const mouseY =
        e.clientY - dropZone.getBoundingClientRect().top + dropZone.scrollTop;

      if (rafId.current) cancelAnimationFrame(rafId.current);

      rafId.current = requestAnimationFrame(() => {
        let closestIndicator = null;
        let closestDistance = Number.POSITIVE_INFINITY;

        const filteredIndicators = indicatorPositions.filter(
          ({ element }) => !element.classList.contains("ignored")
        );

        for (const { element, centerX, centerY } of filteredIndicators) {
          const distance = Math.sqrt(
            (mouseX - centerX) ** 2 + (mouseY - centerY) ** 2
          );

          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndicator = { element };
          }

          element.classList.add("hidden");
        }

        if (closestIndicator) {
          const { element } = closestIndicator;
          element.classList.remove("hidden");
          const target = element.getAttribute("data-drop");

          if (target) {
            const [position, id] = target.split(":") ?? [];

            if (["after", "before", "toLast"].includes(position)) {
              targetRef.current = {
                id,
                position: position as MoveOptions,
              };
            } else {
              console.warn(`Position "${position}" is not a conform position.`);
            }
          } else {
            console.warn("No target element found.");
          }
        }
      });
    },
    [preventBrowserDefaults, indicatorPositions]
  );

  const handleDrop = useCallback(
    async (e: DragEvent) => {
      preventBrowserDefaults(e);
      hideIndicators();

      if (!targetRef.current) return;

      const { id, position } = targetRef.current;

      const files = Array.from(e.dataTransfer?.files || []);

      try {
        if (onMove && dragged) {
          const sourceId = dragged.id;
          await onMove({ sourceId, targetId: id, position });
          return;
        }

        if (files.length > 0 && onDrop) {
          await onDrop(files, { id, position });
        }
      } catch (error) {
        console.error(error);
      }
    },
    [preventBrowserDefaults, hideIndicators, onDrop, onMove, dragged]
  );

  useEffect(() => {
    const ref = dropZoneRef.current;

    if (!ref) return;

    ref.addEventListener("dragenter", preventBrowserDefaults);
    ref.addEventListener("dragover", handleDragover);
    ref.addEventListener("dragleave", hideIndicators);
    ref.addEventListener("drop", handleDrop);

    return () => {
      ref.removeEventListener("dragenter", preventBrowserDefaults);
      ref.removeEventListener("dragover", handleDragover);
      ref.removeEventListener("dragleave", hideIndicators);
      ref.removeEventListener("drop", handleDrop);
    };
  }, [handleDragover, handleDrop, preventBrowserDefaults, hideIndicators]);

  return { dropZoneRef, selectedDocumentRef };
};

export default useDropZone;
