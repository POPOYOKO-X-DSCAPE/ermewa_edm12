import {
	Tooltip,
	TooltipAnchor,
	TooltipProvider,
} from "@ariakit/react";
import { Badge, Ellipsis, Stack } from "@packages/ui";
import {
	RiAddBoxLine,
	RiClipboardLine,
	RiFolderZipLine,
} from "@remixicon/react";
import { translations } from "@src/i18n";
import type {
	SidebarAction,
	SidebarNature,
} from "@src/presentation/contracts/side-bar.interface";
import { memo, useCallback, useMemo } from "react";
import { DocumentNode } from "./document-node";
import type { SelectDocumentHandler } from "./side-bar";
import {
	SideBarElementRow,
	SideBarGroupRow,
} from "./side-bar-primitives";
import { SideBarActionButtons } from "./sidebar-actions";
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

const NatureHeader = memo(({ nature }: { nature: SidebarNature }) => (
	<Stack direction="row" className={Styles.gapped} grow>
		<Stack>
			<Stack>
				<RiFolderZipLine />
			</Stack>
			<Stack
				position={{
					type: "relativeToParent",
					position: ["top", "right"],
				}}
				className={Styles.badge}
			>
				{nature.content.mode === "multi" && (
					<Badge>{nature.children.length}</Badge>
				)}
			</Stack>
		</Stack>
		{nature.content.isMandatory && (
			<div
				style={{
					color: "red",
					fontWeight: 700,
					minWidth: "10px",
				}}
			>
				!
			</div>
		)}
		<div>{nature.content.code}</div>
		<TooltipProvider>
			<Tooltip>{nature.content.name}</Tooltip>
			<TooltipAnchor render={<div style={{ overflow: "hidden" }} />}>
				<Ellipsis>{nature.content.description}</Ellipsis>
			</TooltipAnchor>
		</TooltipProvider>
	</Stack>
));

export const NatureNode = memo(
	({
		nature,
		currentFolder,
		createDocument,
		pasteDocument,
		selectDocument,
	}: {
		nature: SidebarNature;
		currentFolder?: CurrentFolder;
		createDocument?: CreateDocument;
		pasteDocument?: PasteDocument;
		selectDocument?: SelectDocumentHandler;
	}) => {
		const canCreateDocument =
			nature.content.mode === "multi" || nature.children.length === 0;
		const canPasteDocument = nature.canPaste === true;

		const handleCreateDocument = useCallback(() => {
			if (!currentFolder || !canCreateDocument) return;

			void createDocument?.({
				folderSid: currentFolder.sid,
				natureCode: nature.content.code,
			});
		}, [
			canCreateDocument,
			createDocument,
			currentFolder,
			nature.content.code,
		]);

		const handlePasteDocument = useCallback(() => {
			if (!currentFolder || !canPasteDocument) return;

			void pasteDocument?.({
				folderSid: currentFolder.sid,
				natureCode: nature.content.code,
			});
		}, [
			canPasteDocument,
			currentFolder,
			nature.content.code,
			pasteDocument,
		]);

		const createActions = useMemo<SidebarAction[]>(
			() => [
				...(canPasteDocument
					? [
							{
								id: "paste" as const,
								label: translations.t("actionPaste"),
								icon: <RiClipboardLine />,
								disabled: false,
								hidden: false,
								handler: handlePasteDocument,
							},
						]
					: []),
				...(canCreateDocument
					? [
							{
								id: "upload" as const,
								label: translations.t("createDocumentTitle"),
								icon: <RiAddBoxLine />,
								disabled: false,
								hidden: false,
								handler: handleCreateDocument,
							},
						]
					: []),
			],
			[
				canCreateDocument,
				canPasteDocument,
				handleCreateDocument,
				handlePasteDocument,
			],
		);

		if (nature.children.length > 0) {
			return (
				<SideBarGroupRow
					header={
						<Stack direction="row" alignItems="center" grow>
							<Ellipsis>
								<NatureHeader nature={nature} />
							</Ellipsis>
							<SideBarActionButtons actions={createActions} />
						</Stack>
					}
					isInitiallyOpen={true}
				>
					{nature.children.map((document) => (
						<DocumentNode
							key={document.id}
							document={document}
							selectDocument={selectDocument}
						/>
					))}
				</SideBarGroupRow>
			);
		}

		return (
			<SideBarElementRow
				content={<NatureHeader nature={nature} />}
				actions={<SideBarActionButtons actions={createActions} />}
			/>
		);
	},
	(previousProps, nextProps) =>
		previousProps.nature === nextProps.nature &&
		previousProps.currentFolder === nextProps.currentFolder &&
		previousProps.createDocument === nextProps.createDocument &&
		previousProps.pasteDocument === nextProps.pasteDocument &&
		previousProps.selectDocument === nextProps.selectDocument,
);
