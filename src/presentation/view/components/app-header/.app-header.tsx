import { useSnackbarContext } from "@packages/ui";

import { createComponent } from "@src/core/component.builder";

import { AppHeaderView } from "./app-header";

const DEFAULT_VERSION = "12.0.0";

const navigateToFoldersBase = () => {
	const pathParts = window.location.pathname.split("/").filter(Boolean);
	const basePathIndex = import.meta.env.DEV ? 0 : 2;
	const basePath = pathParts[basePathIndex];

	if (!basePath) {
		return;
	}

	const targetPath = `/${pathParts.slice(0, basePathIndex + 1).join("/")}/`;
	window.location.href = targetPath;
};

export const AppHeader = createComponent(
	({
		models: {
			appHeaderModel: {
				headerRuntime: { appName, title, login },
			},
			i18nModel: { i18n },
		},
	}) => {
		const snackbarContext = useSnackbarContext();

		return (
			<AppHeaderView
				appName={appName || "EDoc Management"}
				title={title}
				version={DEFAULT_VERSION}
				login={login}
				foldersLabel={i18n.t("headerFolders")}
				today={i18n.formatDate(new Date(), {
					year: "numeric",
					month: "2-digit",
					day: "2-digit",
				})}
				onFoldersClick={navigateToFoldersBase}
				onReloadClick={() => {
					window.location.reload();
				}}
			/>
		);
	},
);
