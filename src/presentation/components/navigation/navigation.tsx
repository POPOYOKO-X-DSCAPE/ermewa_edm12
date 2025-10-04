import DocumentNode from "./document-node";
import FolderTree from "./folder-tree";
import NatureNode from "./nature-node";

import type { NavigationProps } from "./types";

import { useEffect, useMemo } from "react";

import useViewerProps from "@/presentation/hooks/use-viewer-props";

import "./index.scss";

export const Navigation: React.FC<NavigationProps> = ({
  loadingPath,
  folderTree,
  naturesStore,
  saveNatures,
  navigateFn,
  createNewDocument,
  cancelDocument,
  currentNode,
  records,
}) => {  
  const { actions } = useViewerProps();

  const documentActions = useMemo(
    () =>
      actions.filter(
        ({ slot, predicate }) => slot === "document" && !!predicate
      ),
    [actions]
  );


  useEffect(() => {
    if (currentNode?.document?.documentCode) {
      const rootNode = document.querySelector(".root-node");
      const target = rootNode?.querySelector(
        `[data-anchor="${currentNode.document.documentCode}"]`
      );

      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [currentNode]);

  return (
    <FolderTree
      tree={folderTree}
      naturesStore={naturesStore}
      saveNatures={saveNatures}
      loadingPath={loadingPath}
      isRoot
    >
      {(natures, currentFolder) =>
        natures.map((nature) => (
          <NatureNode
            //@ts-ignore
            nature={
              /** Workaround to make sure nature is sync */
              /* nature */ naturesStore[currentFolder.sid].find(
                (v) => v.code === nature.code
              )
            }
            navigateFn={navigateFn}
            key={nature.code}
            createNewDocument={createNewDocument}
            isMandatory={nature.headers.type === "M"}
          >
            {(_documents) => {
              /** Workaround to make sure docs are sync */
              const persisted =
                naturesStore[currentFolder.sid].find(
                  (natureObject) => nature.code === natureObject.code
                )?.documents || [];

              return persisted
                .sort((a, b) => b.documentCode.localeCompare(a.documentCode))
                .map((document) => (
                  <DocumentNode
                    actions={documentActions}
                    updates={records.find(
                      ({ documentCode }) =>
                        document.documentCode === documentCode
                    )}
                    isSelected={
                      currentNode.document?.documentCode ===
                      document.documentCode
                    }
                    key={document.documentCode}
                    document={document}
                    handleNavigation={() => {
                      navigateFn({
                        folder: {
                          name: currentFolder.name,
                          sid: currentFolder.sid,
                        },
                        nature: nature.code,
                        document: document.documentCode,
                      });
                    }}
                    cancelDocument={() =>
                      cancelDocument(
                        document.documentCode,
                        nature.code,
                        currentFolder.sid
                      )
                    }
                    // customRef={selectedDocumentRef}
                  />
                ));
            }}
          </NatureNode>
        ))
      }
    </FolderTree>
  );
};
