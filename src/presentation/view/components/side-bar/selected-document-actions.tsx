import { createComponent } from "@src/core/component.builder";
import { toSidebarActions } from "./action-icons";
import { SideBarActionButtons } from "./sidebar-actions";

export const SelectedDocumentActions = createComponent<{
	documentCode: string;
}>(
	({
		models: {
			documentModel: { documentViewerActionsByDocumentCode },
		},
		controllers: {
			documentController: { runDocumentAction },
		},
		props,
	}) => {

		const actions = toSidebarActions({
			documentCode: props.documentCode,
			actions: documentViewerActionsByDocumentCode(props.documentCode),
			runDocumentAction,
		});

		return <SideBarActionButtons actions={actions} />;
	},
);
