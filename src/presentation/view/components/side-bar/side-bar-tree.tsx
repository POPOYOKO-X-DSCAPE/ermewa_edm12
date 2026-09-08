import type { SidebarFolder } from "@src/presentation/contracts/side-bar.interface";
import { memo } from "react";
import { FolderNode } from "./folder-node";
import type { SelectDocumentHandler } from "./side-bar";

type CreateDocument = (
	input: Readonly<{
		folderSid: string;
		natureCode: string;
	}>,
) => void | Promise<void>;

type PasteDocument = (
	input: Readonly<{
		folderSid: string;
		natureCode: string;
	}>,
) => void | Promise<void>;

export type SideBarTreeProps = {
	tree?: readonly SidebarFolder[];
	folderInit?: (folderSid: string) => void;
	createDocument?: CreateDocument;
	pasteDocument?: PasteDocument;
	selectDocument?: SelectDocumentHandler;
};

export const SideBarTree = memo(
	({
		tree = [],
		folderInit,
		createDocument,
		pasteDocument,
		selectDocument,
	}: SideBarTreeProps) => {
		return (
			<>
				{tree.map((folder) => (
					<FolderNode
						key={folder.id}
						folder={folder}
						folderInit={folderInit}
						createDocument={createDocument}
						pasteDocument={pasteDocument}
						selectDocument={selectDocument}
					/>
				))}
			</>
		);
	},
);
