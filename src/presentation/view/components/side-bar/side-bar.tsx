import { Resizable, Stack } from "@packages/ui";
import { Scrollable } from "@packages/ui/abstract/scrollable/scrollable";
import type { SidebarFolder } from "@src/presentation/contracts/side-bar.interface";
import { Anchor } from "./anchor";
import { Filters } from "./filters";
import { SideBarShell } from "./side-bar-primitives";
import { SideBarTree } from "./side-bar-tree";
import { UnsavedDocuments } from "./unsaved-documents";

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

export type SelectDocumentHandler = (
	input: Readonly<{
		documentCode: string;
		natureCode: string;
		folder: {
			name: string;
			sid: string;
		};
	}>,
) => void | Promise<void>;

export type SideBarViewProps = {
	folderTree?: readonly SidebarFolder[];
	folderInit?: (folderSid: string) => void;
	createDocument?: CreateDocument;
	pasteDocument?: PasteDocument;
	selectDocument?: SelectDocumentHandler;
};

export const SideBarView = ({
	folderTree = [],
	folderInit,
	createDocument,
	pasteDocument,
	selectDocument,
}: SideBarViewProps) => {
	return (
		<Resizable.Provider axis="x" minSize={300}>
			<Resizable.Content>
				<Stack direction="column" grow>
					<Stack>
						<Filters />
						<UnsavedDocuments selectDocument={selectDocument} />
					</Stack>
					<Scrollable.Provider axis="y">
						<Scrollable.Content>
							<SideBarShell>
								<SideBarTree
									tree={folderTree}
									folderInit={folderInit}
									createDocument={createDocument}
									pasteDocument={pasteDocument}
									selectDocument={selectDocument}
								/>
							</SideBarShell>
						</Scrollable.Content>
					</Scrollable.Provider>
				</Stack>
			</Resizable.Content>

			<Resizable.Anchor>
				<Anchor />
			</Resizable.Anchor>
		</Resizable.Provider>
	);
};
