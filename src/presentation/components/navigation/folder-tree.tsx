import classnames from "classnames";

import type { FolderTreeProps } from "./types";

import useFolderTree from "./hooks/use-folder-tree";

import Button from "../button";
import { Icon } from "../icon";
import { Loader } from "../loader";

import "./folder.scss";

const FolderTree: React.FC<FolderTreeProps> = ({ children, ...hookProps }) => {
  const {
    loadingPath,
    tree,
    naturesStore,
    saveNatures,
    isRoot = false,
    shouldNotLoad,
  } = hookProps;

  const { isOpen, toggleOpen, isLoading, natureObjects, folderDisplay } =
    useFolderTree({
      ...hookProps,
      shouldNotLoad: isRoot ? false : shouldNotLoad,
    });

  const RootElement = isRoot ? "nav" : "div";

  return (
    <RootElement
      className={classnames("folder", "nav-element", {
        "root-node": isRoot,
        "folder-node": !isRoot,
      })}
    >
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
      <header
        className={classnames("folder-header", {
          loading: isLoading,
          open: isOpen,
        })}
        title={folderDisplay.title}
        onClick={() => toggleOpen()}
      >
        <Icon.Folder size="small" />
        {folderDisplay.label}
        <div className={classnames("actions")}>
          {isLoading && <Loader />}
          {isOpen ? (
            <Button.Icon title="collapse" onClick={() => toggleOpen()}>
              <Icon.ArrowUp size="small" />
            </Button.Icon>
          ) : (
            <Button.Icon title="open" onClick={() => toggleOpen()}>
              <Icon.ArrowDown size="small" />
            </Button.Icon>
          )}
        </div>
      </header>
      <div className={classnames("nested", { open: isOpen })}>
        <ul>
          {isOpen && (
            <ul className="nature-nodes">
              {children(
                natureObjects
                  ? natureObjects.sort((a, b) => {
                      if (a.headers.type === b.headers.type) return 0;
                      return a.headers.type === "M" ? -1 : 1;
                    })
                  : [],
                {
                  name: tree.name,
                  sid: tree.sid,
                }
              )}
            </ul>
          )}

          {tree.children && tree.children.length > 0 && (
            <ul className={classnames("sub-folder")}>
              {tree.children.map((subFolder) => {
                const shouldNotLoad =
                  loadingPath?.includes(subFolder.sid) || !isOpen || isLoading;
                return (
                  <FolderTree
                    key={`sub-folder-${subFolder.sid}`}
                    loadingPath={loadingPath}
                    tree={subFolder}
                    naturesStore={naturesStore}
                    saveNatures={saveNatures}
                    shouldNotLoad={shouldNotLoad}
                  >
                    {children}
                  </FolderTree>
                );
              })}
            </ul>
          )}
        </ul>
      </div>
    </RootElement>
  );
};

export default FolderTree;
