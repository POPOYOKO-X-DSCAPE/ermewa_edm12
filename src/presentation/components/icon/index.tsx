import classNames from "classnames";
import type { ComponentChildren } from "preact";
import AddFile from "../../icons/add-file.svg?react";
import Add from "../../icons/add.svg?react";
import ArrowDown from "../../icons/arrow-down.svg?react";
import ArrowUp from "../../icons/arrow-up.svg?react";
import Clipboard from "../../icons/clipboard.svg?react";
import Close from "../../icons/close.svg?react";
import CopyFile from "../../icons/copy-file.svg?react";
import Delete from "../../icons/delete.svg?react";
import Destroy from "../../icons/destroy.svg?react";
import DocumentExtensionIcon from "../../icons/document-extension.svg?react";
import Document from "../../icons/document.svg?react";
import Documents from "../../icons/documents.svg?react";
import Download from "../../icons/download.svg?react";
import Edit from "../../icons/edit.svg?react";
import Export from "../../icons/export.svg?react";
import Folder from "../../icons/folder.svg?react";
import Image from "../../icons/image.svg?react";
import Import from "../../icons/import.svg?react";
import Mail from "../../icons/mail.svg?react";
import MenuSearch from "../../icons/menu-search.svg?react";
import More from "../../icons/more.svg?react";
import Nature from "../../icons/nature.svg?react";
import Reload from "../../icons/reload.svg?react";
import Sync from "../../icons/sync.svg?react";
import ViewPages from "../../icons/view-pages.svg?react";
import "./index.scss";

export type IconSize = "small" | "medium" | "large";

interface IconProps {
	children: string | ComponentChildren;
	size: IconSize;
	title?: string;
}

export const Icon = ({ children, size = "medium", title }: IconProps) => {
	return (
		<div className={classNames("icon", size)} title={title}>
			{children}
		</div>
	);
};

Icon.Folder = ({ size }: Omit<IconProps, "children">) => {
	return (
		<Icon size={size} title="folder">
			<Folder />
		</Icon>
	);
};

Icon.Nature = ({ size }: Omit<IconProps, "children">) => {
	return (
		<Icon size={size} title="nature">
			<Nature />
		</Icon>
	);
};

Icon.Document = ({ size }: Omit<IconProps, "children">) => {
	return (
		<Icon size={size} title="mono-document">
			<Document />
		</Icon>
	);
};

Icon.Documents = ({ size }: Omit<IconProps, "children">) => {
	return (
		<Icon size={size} title="multi-documents">
			<Documents />
		</Icon>
	);
};

Icon.AddFile = ({ size }: Omit<IconProps, "children">) => {
	return (
		<Icon size={size} title="multi-documents">
			<AddFile />
		</Icon>
	);
};

Icon.Add = ({ size }: Omit<IconProps, "children">) => {
	return (
		<Icon size={size} title="multi-documents">
			<Add />
		</Icon>
	);
};

Icon.CopyFile = ({ size }: Omit<IconProps, "children">) => {
	return (
		<Icon size={size} title="multi-documents">
			<CopyFile />
		</Icon>
	);
};

Icon.Clipboard = ({ size }: Omit<IconProps, "children">) => {
	return (
		<Icon size={size} title="multi-documents">
			<Clipboard />
		</Icon>
	);
};

Icon.Edit = ({ size }: Omit<IconProps, "children">) => {
	return (
		<Icon size={size} title="multi-documents">
			<Edit />
		</Icon>
	);
};

Icon.ViewPages = ({ size }: Omit<IconProps, "children">) => {
	return (
		<Icon size={size} title="view-pages">
			<ViewPages />
		</Icon>
	);
};

Icon.Image = ({ size }: Omit<IconProps, "children">) => {
	return (
		<Icon size={size} title="image">
			<Image />
		</Icon>
	);
};

Icon.More = ({ size }: Omit<IconProps, "children">) => {
	return (
		<Icon size={size} title="more">
			<More />
		</Icon>
	);
};

Icon.ArrowDown = ({ size }: Omit<IconProps, "children">) => {
	return (
		<Icon size={size} title="arrow-down">
			<ArrowDown />
		</Icon>
	);
};

Icon.ArrowUp = ({ size }: Omit<IconProps, "children">) => {
	return (
		<Icon size={size} title="arrow-down">
			<ArrowUp />
		</Icon>
	);
};

Icon.Delete = ({ size }: Omit<IconProps, "children">) => {
	return (
		<Icon size={size} title="arrow-down">
			<Delete />
		</Icon>
	);
};

Icon.Close = ({ size }: Omit<IconProps, "children">) => {
	return (
		<Icon size={size} title="arrow-down">
			<Close />
		</Icon>
	);
};

Icon.Reload = ({ size }: Omit<IconProps, "children">) => {
	return (
		<Icon size={size} title="sync">
			<Reload />
		</Icon>
	);
};

Icon.Sync = ({ size }: Omit<IconProps, "children">) => {
	return (
		<Icon size={size} title="sync">
			<Sync />
		</Icon>
	);
};

Icon.Export = ({ size }: Omit<IconProps, "children">) => {
	return (
		<Icon size={size} title="export">
			<Export />
		</Icon>
	);
};

Icon.Import = ({ size }: Omit<IconProps, "children">) => {
	return (
		<Icon size={size} title="export">
			<Import />
		</Icon>
	);
};

Icon.Download = ({ size }: Omit<IconProps, "children">) => {
	return (
		<Icon size={size} title="export">
			<Download />
		</Icon>
	);
};

Icon.Mail = ({ size }: Omit<IconProps, "children">) => {
	return (
		<Icon size={size} title="export">
			<Mail />
		</Icon>
	);
};

Icon.MenuSearch = ({ size }: Omit<IconProps, "children">) => {
	return (
		<Icon size={size} title="export">
			<MenuSearch />
		</Icon>
	);
};

Icon.DestroyFile = ({ size }: Omit<IconProps, "children">) => {
	return (
		<Icon size={size} title="export">
			<Destroy />
		</Icon>
	);
};

interface DocumentExtensionProps {
	fill: string;
	extension: string;
	title: string;
}

Icon.DocumentExtension = ({
	fill,
	extension,
	title,
}: DocumentExtensionProps) => {
	return (
		<div
			className={classNames("document-extension", "icon", "large")}
			title={title}
		>
			<div className={"extension-name"}>{extension}</div>
			<DocumentExtensionIcon style={{ fill }} />
		</div>
	);
};
