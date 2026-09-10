import { t } from "@src/i18n";
/* cspell:ignore xtree xnat xohn */
import {
	normalizeBinaryExtension,
	normalizeNatureExtensions,
	resolveDocumentImportDecision,
} from "./document/document-file-policy";
import { navigationBaseController } from "./navigation.controller";

const FLOW_DEBUG_KEY = "__ERMEWA_FLOW_DEBUG__";

type FlowDebugEvent = {
	ts: string;
	scope: string;
	event: string;
	payload?: unknown;
};

type FolderRef = {
	name: string;
	sid: string;
};

type BinaryExtension =
	| "json"
	| "unknown"
	| "pdf"
	| "jpg"
	| "jpeg"
	| "png"
	| "mpeg"
	| "svg"
	| "mp4"
	| "txt"
	| "xml"
	| "msg";

type RemoteBinaryDescriptor = {
	documentCode: string;
	url: string;
	detailedUrl: string;
	shortUrl: string;
	extension: BinaryExtension;
	language: string;
};

type NaturePayload = {
	code?: string;
	show?: string;
	description?: { english?: string };
	dueDate?: number;
	hasExpirationDate?: boolean;
	flags?: unknown;
	maxSize?: unknown;
	mode?: string;
	extensions?: readonly string[];
};

type NaturesEntryPayload = {
	natures?: Record<string, NaturePayload>;
};

type MaskDocumentPayload = {
	documentCode?: string;
	name?: { baseName?: string };
	state?: number;
	stateDescription?: { english?: string };
	documentDate?: string;
	file?: {
		type?: string;
		lang?: string;
		detailedUrl?: string;
		shortUrl?: string;
	};
	url?: string;
	lastTimeUpdated?: string;
	memo?: string;
	documentExpires?: string;
	isLocal?: boolean;
};

type MaskPayload = {
	code?: string;
	headers?: { type?: string };
	documents?: readonly MaskDocumentPayload[];
};

const pushFolderFlowDebug = (event: string, payload?: unknown) => {
	const entry: FlowDebugEvent = {
		ts: new Date().toISOString(),
		scope: "folder-tree",
		event,
		payload,
	};

	console.log(`[FLOW][folder-tree] ${event}`, payload ?? "");

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

const toDebugError = (error: unknown) =>
	error instanceof Error
		? {
				name: error.name,
				message: error.message,
			}
		: { message: String(error) };

const yieldToBrowser = () =>
	new Promise<void>((resolve) => {
		window.setTimeout(resolve, 0);
	});

const fileToBase64 = (file: File): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onloadend = () => {
			const result = reader.result;
			if (typeof result !== "string") {
				reject(new Error("file to base64 failed"));
				return;
			}

			resolve(result);
		};

		reader.onerror = () => {
			reject(reader.error ?? new Error("file to base64 failed"));
		};

		reader.readAsDataURL(file);
	});

const readTargetFolderFromLocation = (): FolderRef | undefined => {
	const url = new URL(window.location.href, window.location.origin);
	const fld = url.searchParams.get("FLD")?.trim() ?? "";
	const [folderNameFromQuery = "", folderSidFromQuery = ""] =
		fld.split("$");

	const sitePrefix = import.meta.env.BASE_URL.replace(/\/+$/, "");
	const relativePathname = sitePrefix
		? (url.pathname.slice(sitePrefix.length) || "/")
		: url.pathname;
	const segments = relativePathname.split("/").filter(Boolean);
	const folderNameFromPath = segments[0] ?? "";
	const folderSidFromPath = segments[1] ?? "";

	const name = folderNameFromQuery || folderNameFromPath;
	const sid = folderSidFromQuery || folderSidFromPath;

	if (!name || !sid) {
		return undefined;
	}

	return { name, sid };
};

const readTargetFolderSidFromLocation = (): string | undefined =>
	readTargetFolderFromLocation()?.sid;

const isCreateDocumentToken = (value: string | undefined): boolean =>
	value?.trim().toLowerCase() === "new";

const readTargetNatureCodeFromLocation = (): string | undefined => {
	const url = new URL(window.location.href, window.location.origin);
	const natureCode = url.searchParams.get("NAT")?.trim() ?? "";
	return natureCode || undefined;
};

const readCreateDocumentRequestFromLocation = () => {
	const url = new URL(window.location.href, window.location.origin);
	const documentCode = url.searchParams.get("DOC")?.trim() ?? "";
	const natureCode = readTargetNatureCodeFromLocation();
	const folder = readTargetFolderFromLocation();

	if (!isCreateDocumentToken(documentCode) || !natureCode || !folder) {
		return undefined;
	}

	return {
		folderSid: folder.sid,
		natureCode,
	} as const;
};

const isCreateDocumentRequestForTarget = (input: {
	folderSid: string;
	natureCode: string;
}): boolean => {
	const request = readCreateDocumentRequestFromLocation();
	if (!request) {
		return false;
	}

	return (
		request.folderSid === input.folderSid &&
		request.natureCode === input.natureCode
	);
};

const readNavigationFromLocation = () => {
	const url = new URL(window.location.href, window.location.origin);
	const sp = url.searchParams;

	const documentCode = sp.get("DOC")?.trim() ?? "";
	const natureCode = sp.get("NAT")?.trim() ?? "";
	const folder = readTargetFolderFromLocation();

	if (
		!documentCode ||
		isCreateDocumentToken(documentCode) ||
		!natureCode ||
		!folder
	) {
		return undefined;
	}

	return {
		documentCode,
		natureCode,
		folder,
	} as const;
};

const redirectToDocumentLocation = (input: {
	folder: FolderRef;
	natureCode: string;
	documentCode: string;
}) => {
	const url = new URL(window.location.href, window.location.origin);

	url.searchParams.set(
		"FLD",
		`${input.folder.name}$${input.folder.sid}`,
	);
	url.searchParams.set("NAT", input.natureCode);
	url.searchParams.set("DOC", input.documentCode);

	window.location.replace(url.toString());
};

type NormalizedNatureFlags = {
	editable?: boolean;
	controllable?: boolean;
	uploadEnabled?: boolean;
	flagEnabled?: boolean;
};

const isRecord = (
	value: unknown,
): value is Record<PropertyKey, unknown> =>
	typeof value === "object" && value !== null;

const asRecord = (
	value: unknown,
): Record<string, unknown> | undefined =>
	typeof value === "object" && value !== null
		? (value as Record<string, unknown>)
		: undefined;

const toPositiveInt = (value: unknown): number | undefined => {
	if (
		typeof value === "number" &&
		Number.isInteger(value) &&
		value > 0
	) {
		return value;
	}

	if (typeof value === "string") {
		const parsed = Number.parseInt(value.trim(), 10);
		if (Number.isInteger(parsed) && parsed > 0) {
			return parsed;
		}
	}

	return undefined;
};

const toBoolean = (value: unknown): boolean | undefined => {
	if (typeof value === "boolean") {
		return value;
	}

	if (typeof value === "number") {
		if (value === 1) return true;
		if (value === 0) return false;
	}

	if (typeof value === "string") {
		const normalized = value.trim().toLowerCase();
		if (["1", "true", "yes", "y", "on"].includes(normalized)) {
			return true;
		}
		if (["0", "false", "no", "n", "off"].includes(normalized)) {
			return false;
		}
	}

	return undefined;
};

const normalizeNatureFlags = (
	value: unknown,
): NormalizedNatureFlags => {
	if (!isRecord(value)) {
		return {};
	}

	const editable = toBoolean(value.editable);
	const controllable =
		toBoolean(value.controllable) ?? toBoolean(value.enableControl);
	const uploadEnabled = toBoolean(value.uploadEnabled);
	const flagEnabled = toBoolean(value.flagEnabled);

	return {
		...(editable !== undefined ? { editable } : {}),
		...(controllable !== undefined ? { controllable } : {}),
		...(uploadEnabled !== undefined ? { uploadEnabled } : {}),
		...(flagEnabled !== undefined ? { flagEnabled } : {}),
	};
};

const normalizeNatureMaxSize = (value: unknown): number | undefined =>
	toPositiveInt(value);

const normalizeDocumentIsLocal = (value: unknown): boolean =>
	value === true;

const normalizeDocumentStatusNumber = (value: unknown): number =>
	toPositiveInt(value) ?? 1;

const normalizeSelectedFiles = (
	input: File | readonly File[],
): readonly File[] =>
	Array.isArray(input)
		? input.filter((file): file is File => file instanceof File)
		: input instanceof File
			? [input]
			: [];

const askUserImportChoice = (file: File): "native" | "pdf" =>
	window.confirm(t("alertImportAsPdf", { name: file.name }))
		? "pdf"
		: "native";

export const folderTreeController = navigationBaseController
	.refine(({ repositories, stores }) => {
		const getFolderBySid = (sid: string) =>
			repositories.folder
				.read()
				.find((folder) => folder.state.sid === sid);

		const getNatureByFolderAndCode = (
			folderSid: string,
			natureCode: string,
		) => {
			const folder = getFolderBySid(folderSid);
			if (!folder) {
				return undefined;
			}

			return repositories.nature
				.read()
				.find(
					(nature) =>
						nature.state.folder === folder.meta.id &&
						nature.state.code === natureCode,
				);
		};

		const canCreateDocumentAtTarget = (input: {
			folderSid: string;
			natureCode: string;
		}) => {
			const nature = getNatureByFolderAndCode(
				input.folderSid,
				input.natureCode,
			);

			if (!nature) {
				return false;
			}

			return (
				nature.state.mode === "multi" ||
				(nature.state.documents?.length ?? 0) === 0
			);
		};

		const openCreateDocumentDialog = (input: {
			folderSid: string;
			natureCode: string;
		}) => {
			if (!canCreateDocumentAtTarget(input)) {
				return false;
			}

			const current = stores.appStore.state.createDocumentDialog;
			if (
				current?.folderSid === input.folderSid &&
				current?.natureCode === input.natureCode
			) {
				return true;
			}

			stores.appStore.patch({
				createDocumentDialog: {
					folderSid: input.folderSid,
					natureCode: input.natureCode,
				},
			});

			return true;
		};

		const closeCreateDocumentDialog = () => {
			if (!stores.appStore.state.createDocumentDialog) {
				return false;
			}

			stores.appStore.patch({
				createDocumentDialog: undefined,
			});

			return true;
		};

		const openCreateDocumentDialogFromLocation = () => {
			const request = readCreateDocumentRequestFromLocation();
			if (!request) {
				return false;
			}

			return openCreateDocumentDialog(request);
		};

		const areShallowEqual = <T>(
			a: readonly T[],
			b: readonly T[],
		): boolean =>
			a.length === b.length &&
			a.every((item, index) => item === b[index]);

		const documentNodeCache = new Map<string, unknown>();
		const natureNodeCache = new Map<string, unknown>();
		const folderNodeCache = new Map<string, unknown>();

		return {
			getFolderBySid,

			getNatureByFolderAndCode,

			canCreateDocumentAtTarget,

			isFolderLoaded: (sid: string) =>
				stores.appStore.state.loadedFolders.includes(sid),

			isFolderLoading: (sid: string) =>
				stores.appStore.state.loadingFolders.includes(sid),

			markFolderLoading: (sid: string) => {
				if (stores.appStore.state.loadingFolders.includes(sid)) return;

				stores.appStore.patch({
					loadingFolders: [
						...stores.appStore.state.loadingFolders,
						sid,
					],
				});
			},

			unmarkFolderLoading: (sid: string) => {
				stores.appStore.patch({
					loadingFolders: stores.appStore.state.loadingFolders.filter(
						(value) => value !== sid,
					),
				});
			},

			markFolderLoaded: (sid: string) => {
				if (stores.appStore.state.loadedFolders.includes(sid)) return;

				stores.appStore.patch({
					loadedFolders: [...stores.appStore.state.loadedFolders, sid],
				});
			},

			setExpandedFolderSids: (nextSids: readonly string[]) => {
				const next = Array.from(
					new Set(
						nextSids.filter((sid): sid is string => Boolean(sid)),
					),
				);
				const current = stores.appStore.state.expandedFolderSids;

				if (
					current.length === next.length &&
					current.every((sid, index) => sid === next[index])
				) {
					return current;
				}

				stores.appStore.patch({
					expandedFolderSids: next,
				});

				return next;
			},

			expandPathToFolder: (targetSid: string) => {
				const allFolders = repositories.folder.read();
				const byId = new Map(
					allFolders.map((folder) => [folder.meta.id, folder]),
				);
				const target = allFolders.find(
					(folder) => folder.state.sid === targetSid,
				);

				if (!target) {
					return stores.appStore.state.expandedFolderSids;
				}

				const pathIds: string[] = [];
				let currentId: string | undefined = target.meta.id;

				while (currentId) {
					pathIds.push(currentId);
					currentId = byId.get(currentId)?.state.parent;
				}

				pathIds.reverse();

				const pathSids = pathIds
					.map((id) => byId.get(id)?.state.sid)
					.filter((sid): sid is string => Boolean(sid));

				return stores.appStore.patch({
					expandedFolderSids: pathSids,
				}).state.expandedFolderSids;
			},

			openCreateDocumentDialog,
			openCreateDocumentDialogFromLocation,
			closeCreateDocumentDialog,
			readCreateDocumentRequestFromLocation,
			readTargetFolderFromLocation,
			readTargetFolderSidFromLocation,

			rebuildFolderTreeStructure: () => {
				const root = repositories.folder
					.read()
					.find((folder) => folder.state.parent === undefined);

				if (!root) {
					stores.appStore.patch({
						folderTreeStructure: undefined,
					});
					return;
				}

				type FolderTreeDocumentNode = Readonly<{
					code: string;
					name: string;
					status: Readonly<{
						number: number;
						label: string;
					}>;
				}>;

				type FolderTreeNatureNode = Readonly<{
					code: string;
					mode: "mono" | "multi";
					isMandatory: boolean;
					isForbidden: boolean;
					label: Readonly<{
						short: string;
						long: string;
					}>;
					documents: readonly FolderTreeDocumentNode[];
				}>;

				type FolderTreeFolderNode = Readonly<{
					sid: string;
					name: string;
					parent?: Readonly<{ sid: string }>;
					children: readonly FolderTreeFolderNode[];
					natures: readonly FolderTreeNatureNode[];
				}>;

				const buildFolderTreeDocumentNode = (
					documentId: string,
				): FolderTreeDocumentNode | undefined => {
					const document = repositories.document.getById(documentId);
					if (!document) {
						documentNodeCache.delete(documentId);
						return undefined;
					}

					const statusNumber = document.state.status.number;
					const statusesFilter =
						stores.appStore.state.filters?.statuses ?? [];
					if (
						statusesFilter.length > 0 &&
						!statusesFilter.includes(statusNumber)
					) {
						documentNodeCache.delete(documentId);
						return undefined;
					}

					const cached = documentNodeCache.get(documentId) as
						| FolderTreeDocumentNode
						| undefined;
					if (
						cached &&
						cached.code === document.state.code &&
						cached.name === document.state.name &&
						cached.status.number === document.state.status.number &&
						cached.status.label === (document.state.status.label ?? "")
					) {
						return cached;
					}

					const node: FolderTreeDocumentNode = {
						code: document.state.code,
						name: document.state.name,
						status: {
							number: document.state.status.number,
							label: document.state.status.label ?? "",
						},
					};

					documentNodeCache.set(documentId, node);
					return node;
				};

				const buildFolderTreeNatureNode = (
					natureId: string,
				): FolderTreeNatureNode | undefined => {
					const nature = repositories.nature.getById(natureId);
					if (!nature) {
						natureNodeCache.delete(natureId);
						return undefined;
					}

					if (nature.state.isForbidden) {
						natureNodeCache.delete(natureId);
						return undefined;
					}

					const documents = (nature.state.documents ?? [])
						.map(buildFolderTreeDocumentNode)
						.filter(
							(document): document is FolderTreeDocumentNode =>
								document !== undefined,
						);

					const mandatoryOnly =
						stores.appStore.state.filters?.mandatoryOnly ?? false;
					if (mandatoryOnly && nature.state.isMandatory !== true) {
						natureNodeCache.delete(natureId);
						return undefined;
					}

					const cached = natureNodeCache.get(natureId) as
						| FolderTreeNatureNode
						| undefined;
					if (cached && areShallowEqual(cached.documents, documents)) {
						return cached;
					}

					const node: FolderTreeNatureNode = {
						code: nature.state.code,
						mode: nature.state.mode,
						isMandatory: nature.state.isMandatory === true,
						isForbidden: false,
						label: {
							short: nature.state.label.short ?? nature.state.code,
							long: nature.state.label.long ?? nature.state.code,
						},
						documents: documents.length > 0 ? documents : [],
					};

					natureNodeCache.set(natureId, node);
					return node;
				};

				const buildFolderTreeFolderNode = (
					folderId: string,
				): FolderTreeFolderNode | undefined => {
					const folder = repositories.folder.getById(folderId);
					if (!folder) {
						folderNodeCache.delete(folderId);
						return undefined;
					}

					const children = (folder.state.children ?? [])
						.map(buildFolderTreeFolderNode)
						.filter(
							(child): child is FolderTreeFolderNode =>
								child !== undefined,
						);

					const natures = (folder.state.natures ?? [])
						.map(buildFolderTreeNatureNode)
						.filter(
							(nature): nature is FolderTreeNatureNode =>
								nature !== undefined,
						);

					const cached = folderNodeCache.get(folderId) as
						| FolderTreeFolderNode
						| undefined;
					if (
						cached &&
						areShallowEqual(cached.children, children) &&
						areShallowEqual(cached.natures, natures)
					) {
						return cached;
					}

					const parentFolder = folder.state.parent
						? repositories.folder.getById(folder.state.parent)
						: undefined;

					const node: FolderTreeFolderNode = {
						sid: folder.state.sid,
						name: folder.state.name,
						...(parentFolder
							? { parent: { sid: parentFolder.state.sid } }
							: {}),
						children,
						natures,
					};

					folderNodeCache.set(folderId, node);
					return node;
				};

				stores.appStore.patch({
					folderTreeStructure: buildFolderTreeFolderNode(root.meta.id),
				});
			},

			clearFolderTreeCache: () => {
				documentNodeCache.clear();
				natureNodeCache.clear();
				folderNodeCache.clear();
			},
		};
	})
	.refine(({ api, repositories, stores, controls }) => {
		let treeShellPromise: Promise<string | undefined> | null = null;

		const naturesPayloadLoading = new Map<
			string,
			Promise<Record<string, unknown> | undefined>
		>();
		const natureMasksPayloadLoading = new Map<
			string,
			Promise<Record<string, unknown> | undefined>
		>();
		const folderHydrationLoading = new Map<string, Promise<boolean>>();

		const resolveFolderRef = (
			input: string | FolderRef,
		): FolderRef | undefined => {
			if (typeof input !== "string") {
				return input;
			}

			const folder = controls.getFolderBySid(input);
			if (!folder) {
				return undefined;
			}

			return {
				name: folder.state.name,
				sid: folder.state.sid,
			};
		};

		const ensureTreeShellLoaded = async () => {
			const root = repositories.folder
				.read()
				.find((folder) => folder.state.parent === undefined);

			if (root) {
				if (!stores.appStore.state.folderTreeStructure) {
					controls.rebuildFolderTreeStructure();
				}

				if (!stores.appStore.state.expandedFolderSids.length) {
					controls.setExpandedFolderSids([root.state.sid]);
				}

				return root.state.sid;
			}

			if (treeShellPromise) {
				return treeShellPromise;
			}

			treeShellPromise = (async () => {
				pushFolderFlowDebug("xtree.start");

				const response = await api.ermewa.get.folderTree();
				if (!response.ok || !response.value.data) {
					pushFolderFlowDebug("xtree.miss", {
						ok: response.ok,
					});
					return undefined;
				}

				console.log(response.value.raw);

				stores.appStore.patch({
					xtreeRaw: asRecord(response.value.raw),
				});

				type ApiFolder = {
					sid: string;
					name: string;
					type: string;
					status: string;
					level: string;
					children: ApiFolder[];
				};

				type FolderInput = {
					sid: string;
					name: string;
					type: string;
					state: string;
					level: string;
					parent?: string;
					children: string[];
					natures: string[];
				};

				type FolderSeed = {
					sid: string;
					parentSid?: string;
					childrenSids: string[];
					input: FolderInput;
				};

				const collectFolders = (
					node: ApiFolder,
					parentSid?: string,
					acc: FolderSeed[] = [],
				): FolderSeed[] => {
					const childrenSids =
						node.children?.map((child) => child.sid) ?? [];

					acc.push({
						sid: node.sid,
						parentSid,
						childrenSids,
						input: {
							sid: node.sid,
							name: node.name,
							type: node.type,
							state: node.status,
							level: node.level,
							parent: undefined,
							children: [],
							natures: [],
						},
					});

					for (const child of node.children ?? []) {
						collectFolders(child, node.sid, acc);
					}

					return acc;
				};

				const seeds = collectFolders(response.value.data);
				const inserted = repositories.folder.insert(
					...seeds.map((seed) => seed.input),
				);

				const sidToId = new Map(
					inserted.map((folder) => [folder.state.sid, folder.meta.id]),
				);
				const seedBySid = new Map(
					seeds.map((seed) => [seed.sid, seed]),
				);

				for (const folder of inserted) {
					const seed = seedBySid.get(folder.state.sid);

					const parentId = seed?.parentSid
						? sidToId.get(seed.parentSid)
						: undefined;

					const childIds =
						seed?.childrenSids
							.map((sid) => sidToId.get(sid))
							.filter((id): id is string => id !== undefined) ?? [];

					folder.patch({
						parent: parentId,
						children: childIds,
					});
				}

				controls.rebuildFolderTreeStructure();

				if (!stores.appStore.state.expandedFolderSids.length) {
					controls.setExpandedFolderSids([response.value.data.sid]);
				}

				pushFolderFlowDebug("xtree.done", {
					rootSid: response.value.data.sid,
				});

				return response.value.data.sid;
			})();

			try {
				return await treeShellPromise;
			} catch (error) {
				pushFolderFlowDebug("xtree.error", toDebugError(error));
				throw error;
			} finally {
				treeShellPromise = null;
			}
		};

		const fetchNaturesPayload = async (
			folderRef: FolderRef,
		): Promise<Record<string, unknown> | undefined> => {
			const running = naturesPayloadLoading.get(folderRef.sid);
			if (running) {
				return running;
			}

			const job = (async () => {
				pushFolderFlowDebug("xnat.start", folderRef);
				const response = await api.ermewa.get.natures({
					params: { object: folderRef.name },
				});

				if (!response.ok || !response.value.data) {
					pushFolderFlowDebug("xnat.miss", {
						folderSid: folderRef.sid,
						ok: response.ok,
					});
					return undefined;
				}

				pushFolderFlowDebug("xnat.done", {
					folderSid: folderRef.sid,
				});
				return response.value.data as Record<string, unknown>;
			})();

			naturesPayloadLoading.set(folderRef.sid, job);
			try {
				return await job;
			} catch (error) {
				pushFolderFlowDebug("xnat.error", {
					folderSid: folderRef.sid,
					...toDebugError(error),
				});
				throw error;
			} finally {
				if (naturesPayloadLoading.get(folderRef.sid) === job) {
					naturesPayloadLoading.delete(folderRef.sid);
				}
			}
		};

		const fetchNatureMasksPayload = async (
			folderRef: FolderRef,
		): Promise<Record<string, unknown> | undefined> => {
			const running = natureMasksPayloadLoading.get(folderRef.sid);
			if (running) {
				return running;
			}

			const job = (async () => {
				pushFolderFlowDebug("xohn.start", folderRef);
				const response = await api.ermewa.get.naturesMasks({
					params: { object: folderRef.name, sid: folderRef.sid },
				});

				if (!response.ok || !response.value?.data) {
					pushFolderFlowDebug("xohn.miss", {
						folderSid: folderRef.sid,
						ok: response.ok,
					});
					return undefined;
				}

				pushFolderFlowDebug("xohn.done", {
					folderSid: folderRef.sid,
				});
				return response.value.data as Record<string, unknown>;
			})();

			natureMasksPayloadLoading.set(folderRef.sid, job);
			try {
				return await job;
			} catch (error) {
				pushFolderFlowDebug("xohn.error", {
					folderSid: folderRef.sid,
					...toDebugError(error),
				});
				throw error;
			} finally {
				if (natureMasksPayloadLoading.get(folderRef.sid) === job) {
					natureMasksPayloadLoading.delete(folderRef.sid);
				}
			}
		};

		const resolveNaturesEntry = (
			folderRef: FolderRef,
			data: Record<string, unknown>,
		): NaturesEntryPayload | undefined =>
			(data[folderRef.name] as NaturesEntryPayload | undefined) ??
			(Object.values(data).find(
				(value) =>
					typeof value === "object" &&
					value !== null &&
					"natures" in value,
			) as NaturesEntryPayload | undefined);

		const applyNaturesPayload = (
			folderSid: string,
			data: Record<string, unknown>,
		): boolean => {
			const folder = controls.getFolderBySid(folderSid);
			if (!folder) {
				pushFolderFlowDebug("xnat.apply.skip", {
					folderSid,
					reason: "folder-not-found",
				});
				return false;
			}

			const entry = resolveNaturesEntry(
				{ name: folder.state.name, sid: folder.state.sid },
				data,
			);

			if (!entry || !("natures" in entry) || !entry.natures) {
				pushFolderFlowDebug("xnat.apply.skip", {
					folderSid,
					reason: "missing-entry",
				});
				return false;
			}

			const folderId = folder.meta.id;
			repositories.nature
				.select((natures) =>
					natures.filter((nature) => nature.state.folder === folderId),
				)
				.delete();

			const natures = Object.values(
				entry.natures as Record<string, NaturePayload>,
			).filter(
				(nature): nature is NaturePayload & { code: string } =>
					typeof nature.code === "string" && nature.code.length > 0,
			);

			const inserted = repositories.nature.insert(
				// @ts-ignore <TOFIX: mono / multi ts problem>
				...natures.map((nature) => ({
					code: nature.code,
					label: {
						short: nature.show ?? nature.code,
						long: nature.description?.english ?? nature.code,
					},
					dueDate: nature.dueDate ?? 0,
					hasExpirationDate: nature.hasExpirationDate,
					flags: normalizeNatureFlags(nature.flags),
					maxSize: normalizeNatureMaxSize(nature.maxSize),
					extensions: normalizeNatureExtensions(nature.extensions),
					folder: folderId,
					mode: nature.mode === "multi" ? "multi" : "mono",
				})),
			);

			folder.patch({
				natures: inserted.map((nature) => nature.meta.id),
			});

			pushFolderFlowDebug("xnat.apply.done", {
				folderSid,
				natureCount: inserted.length,
			});

			return true;
		};

		const toRemoteBinaryDescriptor = (
			document: MaskDocumentPayload,
		): RemoteBinaryDescriptor | undefined => {
			const documentCode = document.documentCode;
			const url = document.url;
			const extension = normalizeBinaryExtension(document.file?.type);

			if (!documentCode || !url || extension === "unknown") {
				return undefined;
			}

			return {
				documentCode,
				url,
				detailedUrl:
					document.file?.detailedUrl ?? document.file?.shortUrl ?? "",
				shortUrl: document.file?.shortUrl ?? url,
				extension,
				language: document.file?.lang ?? "",
			};
		};

		const extractDocumentDescriptorFromMasksPayload = (
			data: Record<string, unknown> | undefined,
			documentCode: string,
		): RemoteBinaryDescriptor | undefined => {
			if (!data) return undefined;

			for (const mask of Object.values(data) as MaskPayload[]) {
				const documents = Array.isArray(mask.documents)
					? mask.documents
					: [];
				const document = documents.find(
					(entry) => entry.documentCode === documentCode,
				);
				if (document) {
					return toRemoteBinaryDescriptor(document);
				}
			}

			return undefined;
		};

		const applyNatureMasksPayload = async (
			folderSid: string,
			data: Record<string, unknown>,
		): Promise<boolean> => {
			const folder = controls.getFolderBySid(folderSid);
			if (!folder) {
				pushFolderFlowDebug("xohn.apply.skip", {
					folderSid,
					reason: "folder-not-found",
				});
				return false;
			}

			const folderId = folder.meta.id;
			const masks = Object.values(data) as MaskPayload[];

			await yieldToBrowser();

			for (const [index, mask] of masks.entries()) {
				const nature = repositories.nature
					.read()
					.find(
						(entry) =>
							entry.state.code === mask.code &&
							entry.state.folder === folderId,
					);

				if (!nature) {
					continue;
				}

				repositories.document
					.select((documents) =>
						documents.filter(
							(document) => document.state.nature === nature.meta.id,
						),
					)
					.delete();

				const documentInputs = (
					Array.isArray(mask.documents) ? mask.documents : []
				)
					.filter(
						(
							document,
						): document is MaskDocumentPayload & {
							documentCode: string;
						} =>
							typeof document.documentCode === "string" &&
							document.documentCode.length > 0,
					)
					.map((document) => {
						const name =
							document.name?.baseName ?? document.documentCode;
						const fileType = normalizeBinaryExtension(
							document.file?.type,
						);

						return {
							code: document.documentCode,
							isLocal: normalizeDocumentIsLocal(document.isLocal),
							documentDate: document.documentDate || "",
							expirationDate: document.documentExpires || undefined,
							lastUpdated: document.lastTimeUpdated || "",
							fileExtension: fileType,
							fullUrl: document.file?.detailedUrl || "",
							name,
							language: document.file?.lang ?? "",
							shortUrl: document.file?.shortUrl || "",
							url: document.url ?? "",
							status: {
								number: normalizeDocumentStatusNumber(document.state),
								label: document.stateDescription?.english ?? "",
							},
							memo: document.memo,
							nature: nature.meta.id,
						};
					});

				const insertedDocuments =
					documentInputs.length > 0
						? repositories.document.insert(...documentInputs)
						: [];

				const isForbidden = mask.headers?.type === "F";
				const isMandatory = mask.headers?.type === "M";

				nature.patch({
					isForbidden,
					isMandatory,
					documents: insertedDocuments.map(
						(document) => document.meta.id,
					),
				});

				if ((index + 1) % 2 === 0) {
					await yieldToBrowser();
				}
			}

			pushFolderFlowDebug("xohn.apply.done", {
				folderSid,
				maskCount: masks.length,
			});

			return true;
		};

		const loadNatures = async (folderInput: string | FolderRef) => {
			const folderRef = resolveFolderRef(folderInput);
			if (!folderRef) return false;

			await ensureTreeShellLoaded();
			const payload = await fetchNaturesPayload(folderRef);
			if (!payload) return false;
			return applyNaturesPayload(folderRef.sid, payload);
		};

		const loadNatureMasks = async (folderInput: string | FolderRef) => {
			const folderRef = resolveFolderRef(folderInput);
			if (!folderRef) return false;

			await ensureTreeShellLoaded();
			const payload = await fetchNatureMasksPayload(folderRef);
			if (!payload) return false;
			return await applyNatureMasksPayload(folderRef.sid, payload);
		};

		const loadFolderContent = async (
			folderInput: string | FolderRef,
		): Promise<boolean> => {
			const folderRef = resolveFolderRef(folderInput);
			if (!folderRef) return false;

			const treePromise = ensureTreeShellLoaded();
			const naturesPromise = fetchNaturesPayload(folderRef);
			const masksPromise = fetchNatureMasksPayload(folderRef);

			await treePromise;

			const naturesPayload = await naturesPromise;
			if (!naturesPayload) {
				return false;
			}

			const okNatures = applyNaturesPayload(
				folderRef.sid,
				naturesPayload,
			);
			if (!okNatures) {
				return false;
			}

			const masksPayload = await masksPromise;
			if (!masksPayload) {
				return false;
			}

			return await applyNatureMasksPayload(folderRef.sid, masksPayload);
		};

		const loadFolder = async (
			folderInput: string | FolderRef,
			opts?: { force?: boolean; rebuildTree?: boolean },
		): Promise<boolean> => {
			const folderRef = resolveFolderRef(folderInput);
			if (!folderRef) return false;

			if (!opts?.force && controls.isFolderLoaded(folderRef.sid)) {
				return true;
			}

			const running = folderHydrationLoading.get(folderRef.sid);
			if (running) {
				return running;
			}

			const job = (async () => {
				controls.markFolderLoading(folderRef.sid);

				try {
					const ok = await loadFolderContent(folderRef);
					if (ok) {
						controls.markFolderLoaded(folderRef.sid);
						if (opts?.rebuildTree !== false) {
							controls.rebuildFolderTreeStructure();
						}
					}
					return ok;
				} finally {
					controls.unmarkFolderLoading(folderRef.sid);
				}
			})();

			folderHydrationLoading.set(folderRef.sid, job);
			try {
				return await job;
			} finally {
				if (folderHydrationLoading.get(folderRef.sid) === job) {
					folderHydrationLoading.delete(folderRef.sid);
				}
			}
		};

		const hydrateFolderContext = async (
			folderInput: string | FolderRef,
			opts?: { force?: boolean },
		): Promise<boolean> => {
			const folderRef = resolveFolderRef(folderInput);
			if (!folderRef) return false;

			const treePromise = ensureTreeShellLoaded().then(() => {
				controls.expandPathToFolder(folderRef.sid);
			});

			const ok = await loadFolder(folderRef, {
				force: opts?.force,
				rebuildTree: true,
			});

			await treePromise;
			return ok;
		};

		const preloadFolderDocumentDescriptor = async (
			folderInput: string | FolderRef,
			documentCode: string,
		): Promise<RemoteBinaryDescriptor | undefined> => {
			const folderRef = resolveFolderRef(folderInput);
			if (!folderRef || !documentCode) {
				return undefined;
			}

			const payload = await fetchNatureMasksPayload(folderRef);
			const descriptor = extractDocumentDescriptorFromMasksPayload(
				payload,
				documentCode,
			);

			pushFolderFlowDebug("xohn.target-descriptor", {
				folderSid: folderRef.sid,
				documentCode,
				hasDescriptor: Boolean(descriptor),
			});

			return descriptor;
		};

		const openCreateDocumentDialogFromLocation = async () => {
			const request = readCreateDocumentRequestFromLocation();
			if (!request) {
				return false;
			}

			const hydrated = await hydrateFolderContext(request.folderSid);
			if (!hydrated) {
				return false;
			}

			const nature = controls.getNatureByFolderAndCode(
				request.folderSid,
				request.natureCode,
			);
			const folder = controls.getFolderBySid(request.folderSid);

			if (!nature || !folder) {
				return false;
			}

			const existingDocumentId = nature.state.documents?.[0];
			const existingDocument = existingDocumentId
				? repositories.document.getById(existingDocumentId)
				: undefined;

			if (nature.state.mode === "mono" && existingDocument) {
				window.alert(
					t("alertMonoDocumentRedirect", {
						nature: nature.state.code,
					}),
				);

				redirectToDocumentLocation({
					documentCode: existingDocument.state.code,
					natureCode: nature.state.code,
					folder: {
						name: folder.state.name,
						sid: folder.state.sid,
					},
				});

				return false;
			}

			return controls.openCreateDocumentDialog(request);
		};

		const init = async () => {
			const targetFolder = readTargetFolderFromLocation();
			const requestedNavigation = readNavigationFromLocation();

			// PARALLÈLISATION : XTREE + XPRM + chargement dossier cible
			const treePromise = ensureTreeShellLoaded();

			const naturesPromise = targetFolder
				? (async () => {
						const payload = await fetchNaturesPayload(targetFolder);
						return payload
							? applyNaturesPayload(targetFolder.sid, payload)
							: false;
					})()
				: Promise.resolve(false);

			const masksPromise = targetFolder
				? (async () => {
						const payload = await fetchNatureMasksPayload(targetFolder);
						return payload
							? await applyNatureMasksPayload(targetFolder.sid, payload)
							: false;
					})()
				: Promise.resolve(false);

			await Promise.all([treePromise, naturesPromise, masksPromise]);

			controls.rebuildFolderTreeStructure();

			if (targetFolder) {
				controls.expandPathToFolder(targetFolder.sid);
			}

			if (
				requestedNavigation &&
				!stores.appStore.state.currentNavigation
			) {
				controls.selectDocument(requestedNavigation, {
					syncUrl: false,
				});
			}

			if (targetFolder) {
				controls.markFolderLoaded(targetFolder.sid);
				const ancestorSids =
					stores.appStore.state.expandedFolderSids.filter(
						(sid) => !controls.isFolderLoaded(sid),
					);
				if (ancestorSids.length > 0) {
					await Promise.all(
						ancestorSids.map((sid) =>
							loadFolder(sid, { rebuildTree: false }),
						),
					);
					controls.clearFolderTreeCache();
					controls.rebuildFolderTreeStructure();
				}
			}
		};

		return {
			ensureTreeShellLoaded,
			ensureTreeLoaded: ensureTreeShellLoaded,
			loadNatures,
			loadNatureMasks,
			loadFolderContent,
			loadFolder,
			hydrateFolderContext,
			preloadFolderDocumentDescriptor,
			openCreateDocumentDialogFromLocation,
			init,
		};
	})
	.refine(({ api, repositories, stores, controls }) => {
		type DocumentImportChoice = "native" | "pdf";

		const resolveMimeTypeFromExtension = (
			extension: BinaryExtension,
		): string => {
			switch (extension) {
				case "pdf":
					return "application/pdf";
				case "jpg":
				case "jpeg":
					return "image/jpeg";
				case "png":
					return "image/png";
				case "svg":
					return "image/svg+xml";
				case "mp4":
					return "video/mp4";
				case "mpeg":
					return "video/mpeg";
				case "xml":
					return "application/xml";
				case "json":
					return "application/json";
				case "txt":
					return "text/plain";
				case "msg":
					return "application/vnd.ms-outlook";
				default:
					return "application/octet-stream";
			}
		};

		const ensureFileNameHasExtension = (
			name: string | undefined,
			extension: BinaryExtension,
		): string => {
			const baseName = name?.trim() || "document";
			if (extension === "unknown") {
				return baseName;
			}

			const normalizedBaseName = baseName.toLowerCase();
			if (normalizedBaseName.endsWith(`.${extension}`)) {
				return baseName;
			}

			return `${baseName}.${extension}`;
		};

		const fetchSourceDocumentBlob = async (documentCode: string) => {
			const sourceDocument = repositories.document
				.read()
				.find((document) => document.state.code === documentCode);

			if (!sourceDocument || sourceDocument.state.isLocal === true) {
				return undefined;
			}

			const extension = normalizeBinaryExtension(
				sourceDocument.state.fileExtension,
			);
			if (extension === "unknown" || !sourceDocument.state.url) {
				return undefined;
			}

			const response = await api.ermewa.post.file({
				params: {
					documentCode: sourceDocument.state.code,
					extension,
				},
				body: {
					documentCode: sourceDocument.state.code,
					url: sourceDocument.state.url,
					detailedUrl:
						sourceDocument.state.fullUrl ||
						sourceDocument.state.shortUrl ||
						sourceDocument.state.url,
					extension,
				},
			});

			if (!response.ok || !(response.value.data instanceof Blob)) {
				return undefined;
			}

			return {
				blob: response.value.data,
				extension,
				fileName: ensureFileNameHasExtension(
					sourceDocument.state.name || sourceDocument.state.code,
					extension,
				),
			};
		};

		const createLocalDocumentFromFiles = async (
			args: {
				folderSid: string;
				natureCode: string;
				files: readonly File[];
			},
			options?: {
				preferredChoice?: DocumentImportChoice;
			},
		): Promise<boolean> => {
			const folder = controls.getFolderBySid(args.folderSid);
			if (!folder) return false;

			const nature = repositories.nature
				.read()
				.find(
					(entry) =>
						entry.state.folder === folder.meta.id &&
						entry.state.code === args.natureCode,
				);

			if (!nature) return false;

			const files = normalizeSelectedFiles(args.files);
			if (!files.length) {
				return false;
			}

			const appProfile = stores.appStore.state.appProfile as
				| {
						profile?: {
							parameters?: {
								enableControl?: { parameter?: unknown };
								defaultUploadStatus?: { parameter?: unknown };
								uncontrolledDocumentStatus?: { parameter?: unknown };
							};
						};
				  }
				| undefined;

			const enableControl =
				toBoolean(
					appProfile?.profile?.parameters?.enableControl?.parameter,
				) !== false;

			const natureFlags = nature.state.flags as
				| NormalizedNatureFlags
				| undefined;

			const isControllable =
				enableControl && natureFlags?.controllable !== false;

			const defaultStatusNumber = isControllable
				? (toPositiveInt(
						appProfile?.profile?.parameters?.defaultUploadStatus
							?.parameter,
					) ?? 1)
				: (toPositiveInt(
						appProfile?.profile?.parameters?.uncontrolledDocumentStatus
							?.parameter,
					) ?? 1);

			const defaultStatus = {
				number: defaultStatusNumber,
				label:
					defaultStatusNumber === 1
						? "Pending"
						: defaultStatusNumber === 2
							? "Validated"
							: defaultStatusNumber === 3
								? "Rejected"
								: defaultStatusNumber === 4
									? "Removed"
									: "N/A",
			};

			const buildDecision = (preferredChoice?: DocumentImportChoice) =>
				resolveDocumentImportDecision({
					files,
					natureExtensions: nature.state.extensions,
					preferredChoice,
				});

			let decision = buildDecision(options?.preferredChoice);

			if (decision.kind === "ask-user") {
				decision = buildDecision(
					options?.preferredChoice ??
						askUserImportChoice(decision.file),
				);
			}

			if (decision.kind === "reject") {
				pushFolderFlowDebug("xfile.create-local.reject", {
					folderSid: args.folderSid,
					natureCode: args.natureCode,
					fileNames: files.map((file) => file.name),
					reason: decision.reason,
					allowedExtensions: decision.policy.replace.extensions,
				});
				window.alert(decision.reason);
				return false;
			}

			const code = `local-${crypto.randomUUID()}`;
			const now = new Date().toISOString().slice(0, 10);

			let objectUrl = "";
			let base64 = "";
			let fileExtension: BinaryExtension = "unknown";
			let fileName = "";
			let fileSize = 0;
			let fileType = "application/octet-stream";

			if (decision.kind === "pdf") {
				const { convertFilesToPdfArtifact } = await import(
					"@src/infrastructure/library/pdf/convert-files-to-pdf"
				);
				const converted = await convertFilesToPdfArtifact(
					decision.files,
				);

				objectUrl = URL.createObjectURL(converted.blob);
				base64 = converted.base64;
				fileExtension = "pdf";
				fileName = converted.fileName;
				fileSize = converted.blob.size;
				fileType = converted.blob.type || "application/pdf";
			} else {
				objectUrl = URL.createObjectURL(decision.file);
				base64 = await fileToBase64(decision.file);
				fileExtension = decision.extension;
				fileName = decision.file.name;
				fileSize = decision.file.size;
				fileType = decision.file.type || "application/octet-stream";
			}

			const [document] = repositories.document.insert({
				code,
				isLocal: true,
				name: fileName,
				status: defaultStatus,
				documentDate: now,
				expirationDate: undefined,
				lastUpdated: now,
				url: objectUrl,
				fullUrl: objectUrl,
				shortUrl: objectUrl,
				language: "",
				fileExtension,
				memo: undefined,
				nature: nature.meta.id,
			});

			nature.patch({
				documents: [
					...(nature.state.documents ?? []),
					document.meta.id,
				],
			});

			const editorKey = `new:${document.state.code}`;

			stores.documentStore.patch({
				editors: {
					[editorKey]: {
						documentCode: document.state.code,
						mode: "new",
						dirty: false,
						saving: false,
						binaryStatus: "ready",
						draft: {
							name: document.state.name,
							documentDate: document.state.documentDate,
							expirationDate: document.state.expirationDate,
							statusNumber: document.state.status.number,
							fileType: document.state.fileExtension,
							binary: {
								url: objectUrl,
								name: fileName,
								size: fileSize,
								type: fileType,
								base64,
							},
						},
						actions: [
							{
								id: "upload",
								label: "Upload",
								disabled: false,
								hidden: false,
							},
						],
					},
				},
				selectedEditorKey: editorKey,
			});

			controls.rebuildFolderTreeStructure();
			controls.expandPathToFolder(folder.state.sid);

			const shouldSyncUrlToLocalDocument =
				isCreateDocumentRequestForTarget({
					folderSid: folder.state.sid,
					natureCode: nature.state.code,
				});

			controls.selectDocument(
				{
					documentCode: document.state.code,
					natureCode: nature.state.code,
					folder: {
						name: folder.state.name,
						sid: folder.state.sid,
					},
				},
				{ syncUrl: shouldSyncUrlToLocalDocument },
			);

			controls.closeCreateDocumentDialog();
			return true;
		};

		const duplicateExistingDocument = async (args: {
			folderSid: string;
			natureCode: string;
			sourceDocumentCode: string;
		}): Promise<boolean> => {
			const sourceBinary = await fetchSourceDocumentBlob(
				args.sourceDocumentCode,
			);

			if (!sourceBinary) {
				pushFolderFlowDebug("xfile.duplicate.miss", {
					folderSid: args.folderSid,
					natureCode: args.natureCode,
					sourceDocumentCode: args.sourceDocumentCode,
				});
				window.alert(t("alertDuplicateFailed"));
				return false;
			}

			const file = new File(
				[sourceBinary.blob],
				sourceBinary.fileName,
				{
					type:
						sourceBinary.blob.type ||
						resolveMimeTypeFromExtension(sourceBinary.extension),
				},
			);

			return createLocalDocumentFromFiles(
				{
					folderSid: args.folderSid,
					natureCode: args.natureCode,
					files: [file],
				},
				{ preferredChoice: "native" },
			);
		};

		return {
			createLocalDocumentFromFiles,
			duplicateExistingDocument,

			createLocalDocumentFromFile: async (args: {
				folderSid: string;
				natureCode: string;
				file: File;
			}) =>
				createLocalDocumentFromFiles({
					folderSid: args.folderSid,
					natureCode: args.natureCode,
					files: [args.file],
				}),
		};
	})
	.refine(({ stores }) => ({
		setSidebarFilters: (patch: {
			mandatoryOnly?: boolean;
			statuses?: number[];
		}) => {
			stores.appStore.patch({
				filters: (current) => ({
					mandatoryOnly: current?.mandatoryOnly ?? false,
					statuses: current?.statuses ?? [],
					...current,
					...patch,
				}),
			});
		},
	}))
	.build();
