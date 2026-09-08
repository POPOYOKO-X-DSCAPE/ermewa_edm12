import type { ReactNode } from "react";

export interface CreateDocumentDialogState {
	folderSid: string;
	natureCode: string;
}

export interface DuplicableDocumentOption {
	id: string;
	documentCode: string;
	documentName: string;
	folderName: string;
	folderSid: string;
	natureCode: string;
	fileExtension: string;
	label: {
		folder?: string;
		nature?: string;
		document: string;
	};
	conversion: "native" | "pdf";
}

export interface SidebarAction {
	id:
		| "save"
		| "upload"
		| "download"
		| "email"
		| "pending"
		| "validate"
		| "reject"
		| "remove"
		| "delete"
		| "copy"
		| "paste";
	label: string;
	icon: ReactNode;
	handler: () => void;
	disabled?: boolean;
	hidden?: boolean;
}

export interface SidebarDocument {
	name: string;
	type: "document";
	id: string;
	isSelected: boolean;
	path: [folderName: string, folderSid: string, natureCode: string];
	status: {
		number: number;
		label?: string;
	};
	badge?: "N" | "M";
	selectOnAction: () => void;
	actions: readonly SidebarAction[];
}

export interface SidebarNature {
	name: string;
	content: {
		code: string;
		name: string;
		description: string;
		mode: "mono" | "multi";
		isMandatory: boolean;
	};
	children: readonly SidebarDocument[];
	type: "nature";
	id: string;
	canPaste?: boolean;
}

export interface SidebarFolder {
	name: string;
	children: readonly (SidebarFolder | SidebarNature)[];
	type: "folder";
	id: string;
	isRoot?: boolean;
	isInitiallyOpen?: boolean;
	isLoading?: boolean;
}

export type SidebarTree = readonly (
	| SidebarFolder
	| SidebarNature
	| SidebarDocument
)[];

export interface SidebarProps {
	folderTree: readonly SidebarFolder[];
	selectDocument?: (description: {
		documentCode: string;
		natureCode: string;
		folder: { name: string; sid: string };
	}) => void;
	folderInit?: (folderSid: string) => void;
	selectedDocumentActions?: readonly SidebarAction[];
	createDocument?: (args: {
		folderSid: string;
		natureCode: string;
	}) => void;
	pasteDocument?: (args: {
		folderSid: string;
		natureCode: string;
	}) => void;
}
