import { HeadingLevel } from "@ariakit/react";
import {
	Suspense,
	lazy,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { useLocation } from "react-router-dom";

import { App, Loadable, Stack, useLoadable } from "@packages/ui";

import { createComponent } from "./core/component.builder";
import { api } from "./infrastructure/services/raw.api";
import { AppHeader } from "./presentation/view/components/app-header";
import { DocumentViewerSlot } from "./presentation/view/components/document-viewer-slot";
import { SideBar } from "./presentation/view/components/side-bar";

import { Loader } from "./presentation/components/loader";

const LazyCreateDocumentDialog = lazy(async () => {
	const module = await import(
		"./presentation/view/components/side-bar/create-document-dialog"
	);

	return { default: module.CreateDocumentDialog };
});

const LazyDisplaySelectPage = lazy(async () => {
	const module = await import(
		"./presentation/view/components/display-select/display-select-page"
	);

	return { default: module.DisplaySelectPage };
});

const DocumentViewerLoadableBridge = createComponent(
	({
		models: {
			documentModel: {
				selectedDocumentCode,
				selectedDocumentViewerContent,
			},
		},
	}) => {
		const { setIsLoading } = useLoadable();

		const viewerDocumentCode =
			selectedDocumentViewerContent?.documentCode;

		const hasViewerSelection = Boolean(
			viewerDocumentCode || selectedDocumentCode,
		);

		const isFetchingViewerPayload = Boolean(
			selectedDocumentViewerContent?.loading,
		);

		const hasViewerUrl = Boolean(selectedDocumentViewerContent?.url);
		const hasViewerError = Boolean(
			selectedDocumentViewerContent?.error,
		);

		useEffect(() => {
			if (!hasViewerSelection) {
				setIsLoading(false);
				return;
			}

			setIsLoading(
				isFetchingViewerPayload || (!hasViewerUrl && !hasViewerError),
			);
		}, [
			hasViewerSelection,
			isFetchingViewerPayload,
			hasViewerUrl,
			hasViewerError,
			setIsLoading,
		]);

		return null;
	},
);

const FLOW_DEBUG_KEY = "__ERMEWA_FLOW_DEBUG__";
const CRITICAL_DOCUMENT_BOOT_TIMEOUT_MS = 5000;

const waitForNextPaint = () =>
	new Promise<void>((resolve) => {
		window.requestAnimationFrame(() => {
			window.requestAnimationFrame(() => {
				resolve();
			});
		});
	});

const wait = (ms: number) =>
	new Promise<void>((resolve) => {
		window.setTimeout(resolve, ms);
	});

type FlowDebugEvent = {
	ts: string;
	scope: string;
	event: string;
	payload?: unknown;
};

const toDebugError = (error: unknown) =>
	error instanceof Error
		? {
				name: error.name,
				message: error.message,
			}
		: { message: String(error) };

const pushAppFlowDebug = (event: string, payload?: unknown) => {
	const entry: FlowDebugEvent = {
		ts: new Date().toISOString(),
		scope: "app",
		event,
		payload,
	};

	console.log(`[FLOW][app] ${event}`, payload ?? "");

	const root = window as Window & {
		[FLOW_DEBUG_KEY]?: FlowDebugEvent[];
	};

	const current = root[FLOW_DEBUG_KEY] ?? [];
	current.push(entry);
	if (current.length > 500) {
		current.splice(0, current.length - 500);
	}
	root[FLOW_DEBUG_KEY] = current;
};

const ensureDevAuthWarmup = async () => {
	if (
		import.meta.env.MODE !== "development" ||
		import.meta.env.VITE_ENABLE_OFFLINE_SERVICES === "true"
	) {
		pushAppFlowDebug("dummy.auth.skip", {
			mode: import.meta.env.MODE,
		});
		return;
	}

	pushAppFlowDebug("dummy.auth.start");

	try {
		const response = await api.dummy.get.auth();
		console.log(response);
	} catch (error) {
		console.error(error);
	}
	// const response =
	// console.log(response);

	// if (!response.ok) {
	// 	throw new Error(
	// 		`dummy auth failed (${response.error.kind}${
	// 			"status" in response.error &&
	// 			typeof response.error.status === "number"
	// 				? `:${response.error.status}`
	// 				: ""
	// 		})`,
	// 	);
	// }

	pushAppFlowDebug("dummy.auth.done");
};

const isFolderSelectionEntry = (
	pathname: string,
	search: string,
): boolean => {
	const [folderNameFromQuery = "", folderSidFromQuery = ""] = (
		new URLSearchParams(search).get("FLD")?.trim() ?? ""
	).split("$");

	if (folderNameFromQuery && folderSidFromQuery) {
		return false;
	}

	return pathname.split("/").filter(Boolean).length < 2;
};

const EDM12 = createComponent(
	({
		models: {
			i18nModel: { i18n },
		},
		controllers: {
			folderTreeController: {
				readTargetFolderFromLocation,
				readCreateDocumentRequestFromLocation,
				openCreateDocumentDialogFromLocation,
				ensureTreeShellLoaded,
				expandPathToFolder,
				hydrateFolderContext,
			},
			documentController: {
				readNavigationFromLocation,
				preloadDocumentDescriptor,
				preloadDocumentBinary,
				attachPreloadedDocumentToCanonicalContext,
				refreshAllEditorActions,
			},
			appController: { loadAppProfile },
			displaySelectController: { ensureDisplaySelectLoaded },
		},
	}) => {
		const location = useLocation();
		const bootRef = useRef(false);
		const [sidebarReady, setSidebarReady] = useState(false);
		const [loading, setLoading] = useState(true);
		const [folderSelectionReady, setFolderSelectionReady] =
			useState(false);

		const folderSelectionEntry = isFolderSelectionEntry(
			location.pathname,
			location.search,
		);

		const viewerReadyResolveRef = useRef<(() => void) | null>(null);

		const handleViewerPrimaryPaintReady = useCallback(
			(documentCode: string) => {
				pushAppFlowDebug("viewer.primary-paint", {
					documentCode,
				});

				void waitForNextPaint().then(() => {
					pushAppFlowDebug("viewer.paint-flushed", {
						documentCode,
					});
					viewerReadyResolveRef.current?.();
					viewerReadyResolveRef.current = null;
				});
			},
			[],
		);

		useEffect(() => {
			if (bootRef.current) return;
			bootRef.current = true;

			if (folderSelectionEntry) {
				pushAppFlowDebug("folder-selection.boot.start");

				void (async () => {
					try {
						await ensureDevAuthWarmup();
					} catch (error) {
						pushAppFlowDebug("dummy.auth.error", toDebugError(error));
						return;
					}

					const profilePromise = (async () => {
						pushAppFlowDebug("xprm.start");
						try {
							const result = await loadAppProfile();
							pushAppFlowDebug("xprm.done", {
								ok: result?.ok,
							});
							return result;
						} catch (error) {
							pushAppFlowDebug("xprm.error", toDebugError(error));
							throw error;
						}
					})();

					const displaySelectPromise = (async () => {
						pushAppFlowDebug("xsel.start");
						try {
							const itemCount = await ensureDisplaySelectLoaded();
							pushAppFlowDebug("xsel.done", {
								ok: itemCount !== undefined,
								itemCount,
							});
							return itemCount;
						} catch (error) {
							pushAppFlowDebug("xsel.error", toDebugError(error));
							throw error;
						}
					})();

					await Promise.allSettled([
						profilePromise,
						displaySelectPromise,
					]);

					setFolderSelectionReady(true);
					pushAppFlowDebug("folder-selection.boot.complete");
				})();

				return;
			}

			const navigation = readNavigationFromLocation();
			const targetFolder = readTargetFolderFromLocation();
			const createDocumentRequest =
				readCreateDocumentRequestFromLocation();

			pushAppFlowDebug("boot.start", {
				navigation,
				targetFolder,
				createDocumentRequest,
			});

			const viewerReadyPromise = new Promise<string>((resolve) => {
				viewerReadyResolveRef.current = () => {
					resolve("viewer-ready");
				};
			});

			void (async () => {
				try {
					await ensureDevAuthWarmup();
				} catch (error) {
					pushAppFlowDebug("dummy.auth.error", toDebugError(error));
					setSidebarReady(true);
					return;
				}

				const profilePromise = (async () => {
					pushAppFlowDebug("xprm.start");
					try {
						const result = await loadAppProfile();
						pushAppFlowDebug("xprm.done", {
							ok: result?.ok,
						});
						return result;
					} catch (error) {
						pushAppFlowDebug("xprm.error", toDebugError(error));
						throw error;
					}
				})();

				const treeShellPromise = (async () => {
					pushAppFlowDebug("xtree.shell.start");
					try {
						await ensureTreeShellLoaded();
						if (targetFolder?.sid) {
							expandPathToFolder(targetFolder.sid);
						}
						pushAppFlowDebug("xtree.shell.done", {
							targetFolderSid: targetFolder?.sid,
						});
					} catch (error) {
						pushAppFlowDebug("xtree.shell.error", toDebugError(error));
						throw error;
					} finally {
						setSidebarReady(true);
					}
				})();

				void profilePromise.catch(() => undefined);
				void treeShellPromise.catch(() => undefined);

				let hasDescriptor = false;

				const descriptorPromise = navigation
					? (async () => {
							try {
								const descriptor =
									await preloadDocumentDescriptor(navigation);

								hasDescriptor = Boolean(descriptor);
								pushAppFlowDebug("descriptor.xdoc.done", {
									hasDescriptor,
									documentCode: navigation.documentCode,
								});

								return descriptor;
							} catch (error) {
								pushAppFlowDebug(
									"descriptor.xdoc.error",
									toDebugError(error),
								);
								return undefined;
							}
						})()
					: Promise.resolve(undefined);

				const criticalBinaryPromise = navigation
					? descriptorPromise.then((descriptor) => {
							if (!descriptor) {
								return false;
							}

							return preloadDocumentBinary(navigation, descriptor, {
								source: "xdoc",
							});
						})
					: Promise.resolve(false);

				const backgroundUnlockReason = navigation
					? await Promise.race([
							viewerReadyPromise,
							criticalBinaryPromise
								.then((ok) =>
									ok
										? new Promise<string>(() => {})
										: "critical-binary-miss",
								)
								.catch(() => "critical-binary-error"),
							wait(CRITICAL_DOCUMENT_BOOT_TIMEOUT_MS).then(
								() => "timeout",
							),
						])
					: "no-navigation";

				pushAppFlowDebug("background.unlock", {
					reason: backgroundUnlockReason,
					hasNavigation: Boolean(navigation),
					hasDescriptor,
				});

				const folderHydrationPromise = targetFolder
					? (async () => {
							pushAppFlowDebug("folder.hydrate.start", targetFolder);
							try {
								await treeShellPromise;
								const ok = await hydrateFolderContext(targetFolder);
								pushAppFlowDebug("folder.hydrate.done", {
									ok,
									folderSid: targetFolder.sid,
								});
								return ok;
							} catch (error) {
								pushAppFlowDebug(
									"folder.hydrate.error",
									toDebugError(error),
								);
								throw error;
							}
						})()
					: Promise.resolve(false);

				void (async () => {
					try {
						await folderHydrationPromise;

						if (createDocumentRequest) {
							const opened = openCreateDocumentDialogFromLocation();
							pushAppFlowDebug("create-document-dialog.open", {
								opened,
								...createDocumentRequest,
							});
						}

						if (navigation) {
							const attached =
								await attachPreloadedDocumentToCanonicalContext(
									navigation,
								);

							pushAppFlowDebug("canonical.attach.done", {
								attached,
								documentCode: navigation.documentCode,
							});
						}
					} catch (error) {
						pushAppFlowDebug(
							"canonical.attach.error",
							toDebugError(error),
						);
					}
				})();

				void (async () => {
					try {
						await profilePromise;
					} catch {
						// already logged above
					} finally {
						refreshAllEditorActions();
						pushAppFlowDebug("boot.complete", {
							hasNavigation: Boolean(navigation),
							hasTargetFolder: Boolean(targetFolder),
						});
					}
				})();
			})();
		}, [
			attachPreloadedDocumentToCanonicalContext,
			expandPathToFolder,
			ensureTreeShellLoaded,
			hydrateFolderContext,
			folderSelectionEntry,
			loadAppProfile,
			ensureDisplaySelectLoaded,
			openCreateDocumentDialogFromLocation,
			preloadDocumentBinary,
			preloadDocumentDescriptor,
			readCreateDocumentRequestFromLocation,
			readNavigationFromLocation,
			readTargetFolderFromLocation,
			refreshAllEditorActions,
		]);

		if (folderSelectionEntry) {
			return (
				<App>
					<HeadingLevel>
						<AppHeader />
						{folderSelectionReady ? (
							<Suspense fallback={null}>
								<LazyDisplaySelectPage />
							</Suspense>
						) : (
							<Stack grow alignItems="center" justifyContent="center">
								<Loader />
								{i18n.t("loadingFolders")}
							</Stack>
						)}
					</HeadingLevel>
				</App>
			);
		}

		return (
			<App>
				<Suspense fallback={null}>
					<LazyCreateDocumentDialog />
				</Suspense>
				<HeadingLevel>
					<AppHeader />
					<main>
						{sidebarReady ? (
							<SideBar />
						) : (
							<div
								style={{ width: 300, minWidth: 300, flexShrink: 0 }}
							/>
						)}
						<Loadable.Provider>
							<DocumentViewerLoadableBridge />
							<Loadable.Content>
								<DocumentViewerSlot
									onPrimaryPaintReady={handleViewerPrimaryPaintReady}
								/>
							</Loadable.Content>
							<Loadable.Loader>
								<Stack grow alignItems="center" justifyContent="center">
									<Loader />
									{i18n.t("loadingView")}
								</Stack>
							</Loadable.Loader>
						</Loadable.Provider>
					</main>
				</HeadingLevel>
			</App>
		);
	},
);

export default () => {
	return <EDM12 />;
};
