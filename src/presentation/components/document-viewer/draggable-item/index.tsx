import { useRef, useEffect, useCallback } from "preact/compat";

interface DraggableItemProps {
  children: (refCallback?: (el: HTMLElement | null) => void) => React.ReactNode;
  handleDragStart?: (e: DragEvent) => void;
  handleDragEnd?: (e: DragEvent) => void;
  disabled?: boolean;
}

const DraggableItem = ({
  children,
  handleDragStart,
  handleDragEnd,
  disabled = false,
}: DraggableItemProps) => {
  const childRef = useRef<HTMLElement | null>(null);

  const setRef = useCallback(
    (el: HTMLElement | null) => {
      if (childRef.current) {
        // Clean up listeners on the old element
        const oldElement = childRef.current;
        handleDragStart &&
          oldElement.removeEventListener("dragstart", handleDragStart);
        handleDragEnd &&
          oldElement.removeEventListener("dragend", handleDragEnd);
      }

      if (el) {
        // Set up listeners on the new element
        el.draggable = !disabled;
        el.style.cursor = disabled ? "default" : "grab";
        handleDragStart && el.addEventListener("dragstart", handleDragStart);
        handleDragEnd && el.addEventListener("dragend", handleDragEnd);
      }

      // Update the ref to point to the current element
      childRef.current = el;
    },
    [handleDragStart, handleDragEnd, disabled]
  );

  useEffect(() => {
    // Cleanup listeners when the component unmounts
    return () => {
      if (childRef.current) {
        const element = childRef.current;
        handleDragStart &&
          element.removeEventListener("dragstart", handleDragStart);
        handleDragEnd && element.removeEventListener("dragend", handleDragEnd);
      }
    };
  }, [handleDragStart, handleDragEnd]);

  return <>{children(setRef)}</>;
};

export default DraggableItem;
