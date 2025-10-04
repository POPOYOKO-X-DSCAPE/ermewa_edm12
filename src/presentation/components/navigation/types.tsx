import type { VNode } from "preact";
// import type { MutableRef } from "preact/hooks";

import type {
  DocumentInterface,
  FolderTreeInterface,
  NatureObject,
} from "@/domain/types";

import type { UpdateRequestInterface } from "@/interface-adapters/gateways/document-update/request-adapter";
import type { AppContext } from "@/presentation/contexts/app-context";

import type DocumentNode from "./document-node";
import type NatureNode from "./nature-node";

export type NavigationProps = {
  loadingPath: AppContext["loadingPath"];
  navigateFn: AppContext["navigateFn"];
  folderTree: FolderTreeInterface;
  naturesStore: AppContext["naturesStore"];
  saveNatures: AppContext["saveNatures"];
  createNewDocument: (nature: string, folder: string) => string | undefined;
  cancelDocument: (
    documentCode: string,
    natureCode: string,
    folder: string
  ) => void;
  currentNode: AppContext["currentNode"];
  records: UpdateRequestInterface[];
};

export type FolderTreeProps = {
  loadingPath: AppContext["loadingPath"];
  tree: FolderTreeInterface;
  naturesStore: AppContext["naturesStore"];
  saveNatures: AppContext["saveNatures"];
  isRoot?: boolean;
  shouldNotLoad?: boolean;
  children: (
    natures: NatureObject[],
    folder: { name: string; sid: string }
  ) => VNode<typeof NatureNode>[];
};

export type NatureNodeProps = {
  nature: NatureObject;
  navigateFn: AppContext["navigateFn"];
  createNewDocument: NavigationProps["createNewDocument"];
  isMandatory?: boolean;
  children: (documents: DocumentInterface[]) => VNode<typeof DocumentNode>[];
};

export type DocumentNodeProps = {
  document: DocumentInterface;
  updates?: UpdateRequestInterface;
  actions: { handler: () => void; label: string }[];
  // customRef?: MutableRef<any>;
  cancelDocument: () => void;
  handleNavigation: () => void;
  isSelected: boolean;
};
