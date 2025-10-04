import type { FolderTreeInterface } from "../types";

import extractInitialNode from "./extract-initial-node";
import findNodeBySid from "./find-node-by-sid";

const extractInitialFolderPath = (folderTree: FolderTreeInterface) => {
  const {
    folder: { sid },
  } = extractInitialNode();

  const initialFolderNode = findNodeBySid(folderTree, sid);

  return initialFolderNode?.path;
};

export default extractInitialFolderPath;
