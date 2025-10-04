import { useEffect, useMemo, useState } from "react";

import useCases from "@/domain/use-cases";

import { useAppContext } from "@/presentation/contexts/app-context";
import useAsync from "@/presentation/hooks/use-async";

import useDocument from "@/presentation/hooks/use-document";
import type { FolderTreeProps } from "../types";

const useFolderTree = ({
  tree,
  naturesStore,
  saveNatures,
  loadingPath,
  isRoot,
  shouldNotLoad,
}: Omit<FolderTreeProps, "children">) => {
  const {
    appProfile: {
      user: { languages },
      profile: {
        parameters: {
          supervisionManagement: { parameter: supervisionLevel },
        },
      },
    },
    navigationState,
    navigateFn,
    currentNode,
  } = useAppContext();

  const { createNewDocument } = useDocument();

  const [isOpen, setIsOpen] = useState(!!isRoot);
  const toggleOpen = (forced?: boolean) =>
    setIsOpen((prev) => (forced ? forced : !prev));

  const isSupervisor = useMemo(
    () => Number(supervisionLevel) >= 100,
    [supervisionLevel]
  );

  const {
    result: natureObjects,
    isLoading,
    call: loadFolder,
  } = useAsync(
    async () => {
      let content = naturesStore[tree.sid];
      if (!content) {
        console.log("load...");

        content = await useCases.loadFolderContent(
          {
            object: tree.name,
            sid: tree.sid,
          },
          isSupervisor
        );

        saveNatures(tree.sid, content);
      }

      const { folder, nature } = currentNode;
      if (
        navigationState.document?.toLowerCase() === "new" &&
        nature?.code &&
        folder?.sid
      ) {
        const documentId = createNewDocument(nature?.code, folder?.sid);
        if (documentId) {
          const natureIndex = content.findIndex((n) => n.code === nature.code);
          if (natureIndex) {
            // redirect to new doc after created via url
            navigateFn({ ...navigationState, document: documentId });
          }
        }
      }

      return content;
    },
    { shouldLoadOnInit: !shouldNotLoad }
  );

  const folderDisplay = useMemo(() => {
    const {
      display: { sid: showSid },
      folder: folderName,
    } = tree;
    const folderDescription = tree.folderName?.[languages[0]]?.description;

    return {
      label: `${tree.name} ${showSid ? tree.sid : folderName || tree.sid}`,
      title: folderDescription || folderName || tree.name,
    };
  }, [tree, languages]);

  const handleInitialLoad = async () => {
    if (loadingPath?.includes(tree.sid)) {
      await loadFolder();
      toggleOpen(true);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    handleInitialLoad();
  }, []);

  return {
    isOpen,
    toggleOpen,
    isLoading,
    natureObjects,
    folderDisplay,
  };
};

export default useFolderTree;
