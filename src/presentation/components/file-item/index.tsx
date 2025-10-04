import { useEffect, useMemo, useRef } from "preact/hooks";

import type { FileInterface } from "@/domain/types";
import useCases from "@/domain/use-cases";

import CopyIcon from "@/presentation/assets/svg/exclude.svg?react";

import "./index.scss";
import { useAppContext } from "@/presentation/contexts/app-context";
import classNames from "classnames";
import usePdfPageCount from "@/presentation/hooks/use-pdf-page-count";
import useTextualContent from "@/presentation/hooks/use-textual-content";

type FileItemProps = {
  file: FileInterface;
  displayFile: () => void;
  handleDragStart: (e: DragEvent) => void;
  handleDrag: (e: DragEvent) => void;
  handleDragEnd: (e: DragEvent) => void;
  showUploadButton: boolean;
  isActive?: boolean;
};

const FileItem: React.FC<FileItemProps> = ({
  file: { id, instance, documentCode /* , ...rest */ },
  displayFile,
  handleDragStart,
  handleDrag,
  handleDragEnd,
  isActive,
}) => {
  const text = useTextualContent();
  const {
    localMemory: { draggedFileId },
    setLocalMemory,
    copiedFile,
  } = useAppContext();

  const ref = useRef<HTMLDivElement>(null);

  const pageCount = usePdfPageCount(instance);

  const showSplitButton = useMemo(
    () => instance.type === "application/pdf" && !!pageCount && pageCount > 1,
    [instance.type, pageCount]
  );
  const isMsg = useMemo(() => instance.name.endsWith(".msg"), [instance.name]);
  const showConvertButton = useMemo(
    () => instance.type !== "application/pdf" && !isMsg,
    [instance.type, isMsg]
  );

  const convert = (e: Event) => {
    e.stopPropagation();
    e.preventDefault();

    useCases.convertFileToPdf(id);
  };

  const split = (e: Event) => {
    e.stopPropagation();
    e.preventDefault();

    useCases.splitPdf(id, documentCode);
  };

  const remove = (e: Event) => {
    e.stopPropagation();
    e.preventDefault();

    useCases.removeFiles(id);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (!ref.current) return;

    if (id === draggedFileId) {
      ref.current.classList.add("ghost");
    } else {
      ref.current.classList.remove("ghost");
    }
  }, [draggedFileId]);

  const handleCopy = () => {
    // setCopiedFile({ id, instance, documentCode, ...rest })
    setLocalMemory("copiedFileId", id);
  };

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
    <li
      // @ts-ignore
      ref={ref}
      className={classNames("file-item", { active: isActive })}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      onClick={displayFile}
      draggable
    >
      {instance.name}
      <span className="file-actions">
        {copiedFile?.id !== id && (
          <span title={text.copyFile}>
            <CopyIcon onClick={handleCopy} />
          </span>
        )}
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
        <div
          title="[missing: MSG]"
          className={classNames("icon", "warning", {
            hidden: !showSplitButton,
          })}
          onClick={split}
        >
          &#9986;
        </div>
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
        <div
          title="[missing: MSG]"
          className={classNames("icon", "warning", {
            hidden: !showConvertButton,
          })}
          onClick={convert}
        >
          &#x267A;
        </div>
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
        <div className="icon error" onClick={remove} title={text.deleteFile}>
          &#10006;
        </div>
      </span>
    </li>
  );
};

export default FileItem;
