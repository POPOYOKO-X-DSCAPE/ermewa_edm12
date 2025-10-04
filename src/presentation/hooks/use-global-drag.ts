import { useState, useEffect } from "react";

export function useGlobalDrag(): boolean {
  const [isDragging, setIsDragging] = useState<boolean>(false);

  useEffect(() => {
    const handleDragStart = (): void => {
      setIsDragging(true);
    };

    const handleDragEnd = (): void => {
      setIsDragging(false);
    };

    const handleDragEnter = (e: DragEvent): void => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleDragOver = (e: DragEvent): void => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent): void => {
      e.preventDefault();
      setIsDragging(false);
    };

    const handleDragEndExternal = (): void => {
      setIsDragging(false);
    };

    window.addEventListener("dragstart", handleDragStart);
    window.addEventListener("dragend", handleDragEnd);
    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);
    window.addEventListener("dragend", handleDragEndExternal);

    return () => {
      window.removeEventListener("dragstart", handleDragStart);
      window.removeEventListener("dragend", handleDragEnd);
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
      window.removeEventListener("dragend", handleDragEndExternal);
    };
  }, []);

  return isDragging;
};
