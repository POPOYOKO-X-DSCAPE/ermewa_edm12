import { createComponent } from "@src/core/component.builder";
import type { SidebarFolder } from "@src/presentation/contracts/side-bar.interface";
import { useCallback, useEffect } from "react";
import { SideBarView } from "./side-bar";

export const SideBar = createComponent(
	({
		controllers: {
			folderTreeController: {
				loadFolder,
				openCreateDocumentDialog,
				createLocalDocumentFromFiles,
			},
			documentController: {
				selectDocument,
				getClipboardSourceFile,
			},
		},
		models: {
			folderTreeModel: { filteredTree },
			documentModel: { documentClipboard },
		},
	}) => {
		const folderTree = (filteredTree ?? []) as readonly SidebarFolder[];

		useEffect(() => {
			if (folderTree.length === 0) return;
			requestAnimationFrame(() => {
				const el = document.querySelector<HTMLElement>(
					'.sidebar [class*="bg-c_c.sidebar.element.bg.active"]',
				);
				if (el) {
					el.scrollIntoView({
						block: "nearest",
						behavior: "instant",
					});
				}
			});
		}, [folderTree]);

		const handleCreateDocument = useCallback(
			async (input: { folderSid: string; natureCode: string }) => {
				void openCreateDocumentDialog(input);
			},
			[openCreateDocumentDialog],
		);

		const handlePasteDocument = useCallback(
			async (input: { folderSid: string; natureCode: string }) => {
				if (!documentClipboard?.documentCode) {
					return;
				}

				const sourceFile = await getClipboardSourceFile();
				if (!sourceFile) {
					return;
				}

				await createLocalDocumentFromFiles({
					folderSid: input.folderSid,
					natureCode: input.natureCode,
					files: [sourceFile],
				});
			},
			[
				createLocalDocumentFromFiles,
				documentClipboard?.documentCode,
				getClipboardSourceFile,
			],
		);

		const handleFolderInit = useCallback(
			(folderSid: string) => {
				void loadFolder(folderSid);
			},
			[loadFolder],
		);

		const handleSelectDocument = useCallback(
			(input: {
				documentCode: string;
				natureCode: string;
				folder: { name: string; sid: string };
			}) => {
				void selectDocument(input);
			},
			[selectDocument],
		);

		return (
			<SideBarView
				folderTree={folderTree}
				folderInit={handleFolderInit}
				createDocument={handleCreateDocument}
				pasteDocument={handlePasteDocument}
				selectDocument={handleSelectDocument}
			/>
		);
	},
);
