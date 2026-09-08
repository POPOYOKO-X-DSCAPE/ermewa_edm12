import { Ellipsis, Stack } from "@packages/ui";
import { RiFolder2Line } from "@remixicon/react";
import { Loader } from "@src/presentation/components/loader";
import { translations } from "@src/i18n";
import type { SidebarFolder } from "@src/presentation/contracts/side-bar.interface";
import { memo, useCallback, useMemo } from "react";
import { NatureNode } from "./nature-node";
import { resolveFolderSidFromNodeId } from "./node-ids";
import type { SelectDocumentHandler } from "./side-bar";
import {
	SideBarElementRow,
	SideBarGroupRow,
} from "./side-bar-primitives";
import { Styles } from "./styles";

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

type CurrentFolder = Readonly<{
	sid: string;
	name: string;
}>;

const FolderHeader = memo(
	({
		folderName,
		folderSid,
	}: {
		folderName: string;
		folderSid: string;
	}) => (
		<Stack grow direction="row" className={Styles.gapped}>
			<Stack>
				<RiFolder2Line />
			</Stack>
			<Ellipsis>
				{folderName} - {folderSid}
			</Ellipsis>
		</Stack>
	),
);

const FolderLoadingRow = memo(() => (
	<SideBarElementRow
		content={
			<Stack direction="row" className={Styles.gapped} grow>
				<Stack>
					<Loader />
				</Stack>
				<Ellipsis>{translations.t("sidebarLoading")}</Ellipsis>
			</Stack>
		}
	/>
));

export const FolderNode = memo(
	({
		folder,
		folderInit,
		createDocument,
		pasteDocument,
		selectDocument,
	}: {
		folder: SidebarFolder;
		folderInit?: (folderSid: string) => void;
		createDocument?: CreateDocument;
		pasteDocument?: PasteDocument;
		selectDocument?: SelectDocumentHandler;
	}) => {
		const folderSid = resolveFolderSidFromNodeId(folder.id);
		const currentFolder = useMemo<CurrentFolder>(
			() => ({
				sid: folderSid,
				name: folder.name,
			}),
			[folder.name, folderSid],
		);

		const handleOpen = useCallback(() => {
			folderInit?.(folderSid);
		}, [folderInit, folderSid]);

		return (
			<SideBarGroupRow
				header={
					<FolderHeader
						folderName={folder.name}
						folderSid={folderSid}
					/>
				}
				isInitiallyOpen={folder.isRoot || folder.isInitiallyOpen}
				onOpen={handleOpen}
				isLoading={folder.isLoading}
			>
				{folder.isLoading && <FolderLoadingRow />}
				{folder.children.map((node) =>
					node.type === "folder" ? (
						<FolderNode
							key={node.id}
							folder={node}
							folderInit={folderInit}
							createDocument={createDocument}
							pasteDocument={pasteDocument}
							selectDocument={selectDocument}
						/>
					) : (
						<NatureNode
							key={node.id}
							nature={node}
							currentFolder={currentFolder}
							createDocument={createDocument}
							pasteDocument={pasteDocument}
							selectDocument={selectDocument}
						/>
					),
				)}
			</SideBarGroupRow>
		);
	},
	(previousProps, nextProps) =>
		previousProps.folder === nextProps.folder &&
		previousProps.folderInit === nextProps.folderInit &&
		previousProps.createDocument === nextProps.createDocument &&
		previousProps.pasteDocument === nextProps.pasteDocument &&
		previousProps.selectDocument === nextProps.selectDocument,
);
