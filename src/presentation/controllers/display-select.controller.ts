import { createController } from "@src/core/presentation.builder";

export const displaySelectController = createController(
	({ api, stores }) => {
		let displaySelectPromise:
			| Promise<number | undefined>
			| undefined;

		const loadDisplaySelect = () => api.ermewa.get.displaySelect();

		const readDisplaySelectState = () => {
			const appProfile = stores.appStore.state.appProfile as
				| {
						user?: {
							defaultLanguage?: string;
						};
				  }
				| undefined;

			return {
				items: stores.appStore.state.displaySelectItems,
				loading: stores.appStore.state.displaySelectLoading,
				loaded: stores.appStore.state.displaySelectLoaded,
				errorMessage: stores.appStore.state.displaySelectError,
				appProfile: stores.appStore.state.appProfile,
				locale: appProfile?.user?.defaultLanguage,
			} as const;
		};

		const navigateToFolder = (input: {
			folderName: string;
			folderSid: string;
		}) => {
			const folderName = input.folderName.trim();
			const folderSid = input.folderSid.trim();

			if (!folderName || !folderSid) {
				return false;
			}

			const url = new URL(window.location.href);
			const basePath = url.pathname.replace(/\/+$/, "");

			url.pathname = `${basePath}/${encodeURIComponent(
				folderName,
			)}/${encodeURIComponent(folderSid)}`;

			window.location.replace(url.toString());
			return true;
		};

		const ensureDisplaySelectLoaded = () => {
			if (stores.appStore.state.displaySelectLoaded) {
				return Promise.resolve(
					stores.appStore.state.displaySelectItems.length,
				);
			}

			if (displaySelectPromise) {
				return displaySelectPromise;
			}

			stores.appStore.patch({
				displaySelectLoading: true,
				displaySelectError: undefined,
			});

			displaySelectPromise = (async () => {
				try {
					const result = await loadDisplaySelect();

					if (!result.ok) {
						stores.appStore.patch({
							displaySelectLoading: false,
							displaySelectLoaded: false,
							displaySelectError:
								"display-select-request-failed",
						});

						return undefined;
					}

					const items = result.value.data;
					if (!items) {
						stores.appStore.patch({
							displaySelectLoading: false,
							displaySelectLoaded: false,
							displaySelectError:
								"display-select-validation-failed",
						});

						return undefined;
					}

					stores.appStore.patch({
						displaySelectItems: [...items],
						displaySelectLoading: false,
						displaySelectLoaded: true,
						displaySelectError: undefined,
					});

					return items.length;
				} catch {
					stores.appStore.patch({
						displaySelectLoading: false,
						displaySelectLoaded: false,
						displaySelectError: "display-select-load-failed",
					});

					return undefined;
				}
			})().finally(() => {
				displaySelectPromise = undefined;
			});

			return displaySelectPromise;
		};

		return {
			loadDisplaySelect,
			ensureDisplaySelectLoaded,
			readDisplaySelectState,
			navigateToFolder,
		};
	},
).build();
