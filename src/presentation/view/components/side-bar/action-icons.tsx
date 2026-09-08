import {
	RiCheckLine,
	RiCloseLine,
	RiDeleteBinLine,
	RiDownloadLine,
	RiMailLine,
	RiSaveLine,
	RiTimeLine,
	RiUploadLine,
} from "@remixicon/react";
import type { ReactNode } from "react";
import type { SidebarAction } from "@src/presentation/contracts/side-bar.interface";

type ViewerModelAction = Readonly<{
	id: SidebarAction["id"];
	label: string;
	hidden: boolean;
	disabled: boolean;
}>;

export const actionIconById: Record<SidebarAction["id"], ReactNode> = {
	save: <RiSaveLine />,
	upload: <RiUploadLine />,
	download: <RiDownloadLine />,
	email: <RiMailLine />,
	copy: null,
	paste: null,
	pending: <RiTimeLine />,
	validate: <RiCheckLine />,
	reject: <RiCloseLine />,
	remove: <RiCloseLine />,
	delete: <RiDeleteBinLine />,
};

export const toSidebarActions = (input: {
	documentCode: string | undefined;
	actions: readonly ViewerModelAction[];
	runDocumentAction: (
		actionId: SidebarAction["id"],
		documentCode: string,
		options?: { memo?: string },
	) => Promise<void>;
}): SidebarAction[] => {
	const { documentCode, actions, runDocumentAction } = input;

	if (!documentCode) {
		return [];
	}

	return actions
		.filter((action) => action.id !== "copy" && action.id !== "paste")
		.map((action) => ({
			id: action.id,
			label: action.label,
			icon: actionIconById[action.id],
			disabled: action.disabled,
			hidden: action.hidden,
			handler: () => {
				if (action.disabled) return;
				void runDocumentAction(action.id, documentCode);
			},
		}));
};
