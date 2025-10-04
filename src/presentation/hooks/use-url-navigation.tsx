import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import type { FolderTreeInterface } from "@/domain/types";

import findNodeBySid from "@/domain/parts/find-node-by-sid";

export type NavigationKeys = {
  folder: { sid: string; name: string };
  document: string;
  nature: string;
};

const useUrlNavigation = (
  folderTree: FolderTreeInterface | undefined,
  options?: { shouldCheckOnInit?: boolean }
) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [navigationKeys, setNavigationKeys] = useState<Partial<NavigationKeys>>(
    { folder: undefined, document: undefined, nature: undefined }
  );

  const navigateFn = (options: Partial<NavigationKeys>) => {
    const folderPart = options?.folder
      ? `FLD=${options.folder.name}$${options.folder.sid}`
      : "";
    const naturePart = options?.nature ? `NAT=${options.nature}` : "";
    const documentPart = options?.document ? `DOC=${options.document}` : "";

    const url = [folderPart, naturePart, documentPart]
      .filter((v) => !!v)
      .join("&");

    navigate(`?${url}`);
    setNavigationKeys(options);
  };

  useEffect(() => {
    if (folderTree && options?.shouldCheckOnInit) {
      const searchParams = new URLSearchParams(location.search);
      const folderParams = searchParams.get("FLD")?.split("$") || [
        folderTree.name,
        folderTree.sid,
      ];
      const natureParam = searchParams.get("NAT") || undefined;
      const documentParam = searchParams.get("DOC") || undefined;

      const [_, folderParamSid] = folderParams;
      const folder =
        folderParamSid && findNodeBySid(folderTree, folderParamSid);

      setNavigationKeys({
        folder: folder ? { sid: folder.sid, name: folder.name } : undefined,
        nature: natureParam,
        document: documentParam,
      });
    }
  }, [options?.shouldCheckOnInit, folderTree, location.search]);

  return { navigationKeys, navigateFn };
};

export default useUrlNavigation;
