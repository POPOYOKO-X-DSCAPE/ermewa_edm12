import { useMemo, useState } from "react";

import type { FileInterface } from "@/domain/types";

import { repositories } from "@/domain/repositories";

import useRepository from "./use-repository";

const useFiles = (documentCode?: string) => {
  const [_files, setFiles] = useState<FileInterface[]>([]);
  const [displayedFile, setDisplayedFile] = useState<FileInterface | undefined>(
    undefined
  );

  const files = useMemo(
    () => _files.filter((file) => file.documentCode === documentCode),
    [_files, documentCode]
  );

  useRepository(repositories.files, {
    onCreate: ({ diff }) => {
      const items = Object.values(diff)
        .map(({ meta: { id }, state }) => ({ ...state, id }))
        .sort((a, b) => a.index - b.index);

      setFiles((prev) => [...prev, ...items]);
      setDisplayedFile({
        id: Object.values(diff)[0].meta.id,
        ...Object.values(diff)[0].state,
      });
    },
    onUpdate: ({ diff }) => {
      const items = Object.values(diff)
        .map(({ meta: { id }, state }) => ({ ...state, id }))
        .sort((a, b) => a.index - b.index);
      setFiles((prev) => [
        ...prev.filter((old) => !Object.keys(diff).includes(old.id)),
        ...items,
      ]);
    },
    onDelete: ({ diff }) => {
      const items = Object.values(diff)
        .map(({ meta: { id }, state }) => ({ ...state, id }))
        .sort((a, b) => a.index - b.index);

      setFiles((prev) =>
        prev.filter((item) => !Object.keys(diff).includes(item.id))
      );

      if (Object.values(diff)[0].meta.id === displayedFile?.id) {
        setDisplayedFile(items[0]);
      }
    },
  });

  return { files, displayedFile, setDisplayedFile };
};

export default useFiles;
