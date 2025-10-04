import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

import helpers from "@/infra-structures/helpers";
import { converters, merge } from "@/infra-structures/libraries/pdf";

import { loadFilePages } from "@/domain/parts/pdf-loading-utilities";
import { repositories } from "@/domain/repositories";
import useCases from "@/domain/use-cases";

import { useAppContext } from "../contexts/app-context";
import { usePersisterContext } from "../contexts/persister-context";

import type { DocumentViewerProps } from "../components/document-viewer";

import useDocument from "./use-document";
import type { MoveOptions } from "./use-drop-zone";
import useEmailSenderModal from "./use-email-sender-modal";
import useRepository from "./use-repository";

import { Icon } from "@/presentation/components/icon";

const useViewerProps = (): DocumentViewerProps => {
	const {
		localMemory,
		setLocalMemory,
		appProfile: {
			user: { email: userEmail },
		},
		navigationState: { document: documentCode },
		currentNode: { nature, document: selectedDocument },
	} = useAppContext();
	const {
		isMergeEnabled,
		isUploadEnabled,
		extensions,
		extensionsAllowedOnDrop,
		extensionsMap,
		// isSupervisor,
		currentFiles,
		documentRights,
		fileActions,
		status,
		isActionAllowed,
		copyDocument,
		cancel,
		uploadDocument,
		deleteDocument,
		downloadDocument,
		updateFile,
	} = useDocument();
	const { openModal } = useEmailSenderModal();

	const { updateStatus, setIsLoading, savable, save } = usePersisterContext();

	const [focus, setFocus] = useState<[number, number]>([0, 1]);

	const [draggedItem, setDraggedItem] = useState<{
		documentCode: string;
		index: number;
		extension: string;
		pageNumber?: number;
		repository: "pages" | "files";
		id: string;
	}>();

	const fileEntities = useRepository(repositories.files);
	const pageEntities = useRepository(repositories.pages);

	const initialFileRef = useRef<File | null>(null);
	useEffect(() => {
		if (!initialFileRef.current) {
			initialFileRef.current =
				fileEntities.find(
					({ state: { isLocal, documentCode } }) =>
						isLocal === false &&
						documentCode === selectedDocument?.documentCode,
				)?.state.instance || null;
		}
	}, [fileEntities, selectedDocument]);

	const pageConfigList = useMemo(() => {
		let globalPageNumber = 1;

		return fileEntities
			.filter(
				(entity) =>
					entity.state.documentCode === selectedDocument?.documentCode,
			)
			.map(
				(
					{
						meta: { id: fileId },
						state: { instance, /* index: groupIndex ,*/ pageCount },
					},
					groupIndex,
				) => {
					const extension = instance.name.split(".").reverse()[0] || "";
					const msgFile = extension === "msg" ? instance : null;

					if (instance.type === "application/pdf") {
						const pages = pageEntities.filter(
							({ state }) => state.fileId === fileId,
						);

						if (pages.length === 0) {
							return [];
						}

						return pages.map(
							({ state: { imageInstance }, meta: { id: pageId } }) => {
								const pageNumber = globalPageNumber++;

								return {
									fileId,
									pageId: pageId ?? "",
									imageSrc: URL.createObjectURL(imageInstance),
									alt: instance.name,
									style: {
										objectFit: "contain",
										width: "100%",
										height: "auto",
									},
									pageNumber,
									pageCount,
									extension,
									msgFile,
									groupIndex,
								};
							},
						);
					}

					// const page = pageEntities.filter(
					//   ({ state }) => state.fileId === fileId
					// )[0];

					return [
						{
							fileId,
							pageId: `placeholder-${fileId}`,
							imageSrc: URL.createObjectURL(instance),
							alt: instance.name,
							style: {
								objectFit: "contain",
								width: "100%",
								height: "auto",
							},
							pageNumber: globalPageNumber++,
							pageCount: 1,
							extension,
							msgFile,
							groupIndex,
						},
					];
				},
			);
	}, [selectedDocument, fileEntities, pageEntities]);

	async function processInstances(
		instances: Array<File>,
		repositoryOnMove?: "files" | "pages",
	) {
		return Promise.all(
			instances.map(async (rawInstance: File) => {
				const nameParts = rawInstance.name.split(".");

				const extension = nameParts.pop()?.toLowerCase();
				const baseName = nameParts.join(".");
				const fullName = `${baseName}.${extension}`;
				const instance = new File([rawInstance], fullName, {
					type: rawInstance.type,
				});

				switch (true) {
					case repositoryOnMove !== undefined:
						switch (repositoryOnMove) {
							case "files":
								if (extensions?.split(",").includes("pdf") && isMergeEnabled) {
									return await merge(instances, instances[0].name);
								}
								return instance;
							case "pages":
								return await merge(instances, instances[0].name);
							default:
								return instance;
						}
					case instance.type.startsWith("image/"):
						console.log("in");

						return await converters.fromImage(instance);

					default:
						return instance;
				}
			}),
		);
	}

	const moveProcess = useCallback(
		async (repositoryName: "files" | "pages") => {
			let instances: File[] = [];
			if (repositoryName === "files") {
				instances = repositories.files.entities
					.filter(
						({ state: { documentCode } }) =>
							documentCode === selectedDocument?.documentCode,
					)
					.map(({ state: { instance } }) => instance);
			} else {
				instances = repositories.pages.entities
					.filter(({ state: { fileId } }) =>
						currentFiles.map(({ id }) => id).includes(fileId),
					)
					.map(({ state: { pdfInstance } }) => pdfInstance);
			}

			if (instances.length === 1) {
				const toPatch = repositories.files.entities.find(
					({ state: { documentCode } }) => documentCode,
				);

				toPatch?.patch({ instance: instances[0] });
				await updateFile(instances[0]);
			} else if (instances.length > 0) {
				const toPatch = repositories.files.entities.find(
					({ state: { documentCode } }) => documentCode,
				);

				const mergedFile = await merge(instances, instances[0].name);

				if (toPatch) {
					repositories.files.update(toPatch?.meta.id, { instance: mergedFile });
				}
				await updateFile(mergedFile);
			}
		},
		[selectedDocument, currentFiles, updateFile],
	);

	const actions = useMemo(() => {
		if (!nature?.config) return [];

		const isLocal = selectedDocument?.isLocal;
		const {
			canValidate,
			modeEdit,
			canReject,
			canUpload,
			canDelete,
			canSuppress,
		} = documentRights;
		const { canCopy, canDownload, canMail } = fileActions;

		const { isControllable, isEditable } = nature.config;

		return [
			{
				slot: "document",
				label: `${isMergeEnabled ? "merge & " : ""} upload`,
				handler: async () => {
					setIsLoading(true);
					try {
						await uploadDocument();
					} catch (error) {
						console.error(error);
					} finally {
						setIsLoading(false);
					}
				},
				predicate: isActionAllowed(
					canUpload && (isUploadEnabled || isMergeEnabled) && !!isLocal,
				),
				Icon: <Icon.Export size="small" />,
			},
			{
				slot: "document",
				label: `${isMergeEnabled ? "merge & " : ""} save`,
				handler: async () => {
					setIsLoading(true);
					try {
						await save();
						const files = fileEntities.filter(
							({ state: { documentCode } }) =>
								documentCode === selectedDocument?.documentCode,
						);
						const [container, ...otherFiles] = files;
						for (const otherFile of otherFiles) {
							const pages = pageEntities.filter(
								({ state: { fileId } }) => fileId === otherFile.meta.id,
							);
							for (const page of pages) {
								page.patch({ fileId: container.meta.id });
							}
							container.patch({
								pageCount: container.state.pageCount + pages.length,
							});
							repositories.files.delete(otherFile.meta.id);
						}
					} catch (error) {
						console.error(error);
					} finally {
						setIsLoading(false);
					}
				},
				predicate: isActionAllowed((savable || isMergeEnabled) && !isLocal),
				Icon: <Icon.Import size="small" />,
			},
			{
				slot: "floating",
				label: "delete",
				handler: deleteDocument,
				predicate: isActionAllowed(canSuppress && !isLocal),
				Icon: <Icon.Delete size="small" />,
			},
			{
				slot: "floating",
				label: "copy",
				handler: copyDocument,
				predicate: canCopy,
				disabled:
					(!isMergeEnabled && currentFiles.length !== 1) ||
					localMemory.copiedFileId === selectedDocument?.documentCode,
				Icon: <Icon.CopyFile size="small" />,
			},
			{
				slot: "floating",
				label: "download",
				handler: downloadDocument,
				predicate: canDownload,
				Icon: <Icon.Download size="small" />,
			},
			{
				slot: "floating",
				label: "mail",
				handler: async () => {
					const file = repositories.files.entities.find(
						({ state: { documentCode } }) =>
							documentCode === selectedDocument?.documentCode,
					);

					if (!file || !selectedDocument) {
						console.error("email-sender: document code undefined or invalid.");
						return;
					}
					const name = selectedDocument.name.baseName;
					const extension = selectedDocument.file.type;

					const {
						state: { instance },
					} = file;

					const content = await helpers.createBase64.fromFile(instance);

					openModal(
						{
							from: `${userEmail}`,
							to: "",
							subject: "",
							text: "",
							attachments: [
								{
									encoding: "base64",
									filename: `${name}.${extension}`,
									content,
								},
							],
						},
						async (email) => {
							await useCases.sendMail(email);
						},
					);
				},
				predicate: canMail,
				disabled: false,
				Icon: <Icon.Mail size="small" />,
			},
			{
				slot: "document",
				handler: () => {
					cancel();
				},
				label: "cancel",
				predicate: !!isLocal,
				Icon: <Icon.Close size="small" />,
			},
			{
				slot: "document",
				label: "pending",
				handler() {
					updateStatus("pending");
				},
				predicate: isActionAllowed(
					modeEdit &&
						isControllable &&
						!["pending", "N/A"].includes(status.label) &&
						!isLocal,
				),
			},
			{
				slot: "document",
				label: "remove",
				handler() {
					updateStatus("removed");
				},
				predicate: isActionAllowed(
					canSuppress && !["removed"].includes(status.label) && !isLocal,
				),
			},
			{
				slot: "document",
				label: "restore",
				handler() {
					updateStatus("N/A");
				},
				predicate: isActionAllowed(
					!isControllable && status.label === "removed",
				),
			},
			{
				slot: "document",
				label: "approve",
				handler: () => {
					updateStatus("accepted", " ");
				},
				predicate: isActionAllowed(
					modeEdit &&
						!isLocal &&
						isControllable &&
						canValidate &&
						!["accepted", "N/A"].includes(status.label),
				),
			},
			{
				slot: "document",
				label: "reject",
				handler: async () => {
					const file = repositories.files.entities.find(
						({ state: { documentCode } }) =>
							documentCode === selectedDocument?.documentCode,
					);

					if (!file || !selectedDocument) {
						console.error(
							"reject document: document code undefined or invalid.",
						);
						return;
					}
					const name = selectedDocument.name.baseName;
					const extension = selectedDocument.file.type;

					const {
						state: { instance },
					} = file;

					const [content, preload] = await Promise.all([
						helpers.createBase64.fromFile(instance),
						useCases.fetchRejectEmailInfo(selectedDocument?.documentCode),
					]);

					const emailBody = {
						from: userEmail,
						to: preload.to.join(","),
						subject:
							preload.subject ||
							`rejet document ${selectedDocument?.documentCode}`,
						text: preload.text || "",
						attachments: [
							{
								encoding: "base64",
								filename: `${name}.${extension}`,
								content,
							},
						],
					};

					openModal(
						emailBody,
						async (email) => {
							if (email.text?.trim()) {
								try {
									await updateStatus("rejected", email.text);
									await useCases.sendMail(email);
								} catch (error) {
									console.error(
										`error while trying to reject a document: ${error}`,
									);
								}
							} else {
								alert("Le motif de rejet est obligatoire.");
							}
						},
						{
							title: "Notification du rejet.",
						},
					);
				},
				predicate: isActionAllowed(
					modeEdit &&
						!isLocal &&
						isControllable &&
						canReject &&
						!["rejected", "N/A"].includes(status.label),
				),
			},
			{
				slot: "document",
				handler: () => {
					console.log(isEditable && canDelete && status.label !== "removed");
					// supression physique
				},
				label: "destroy",
				predicate: isActionAllowed(
					modeEdit && canDelete && status.label !== "removed",
				),
				Icon: <Icon.DestroyFile size="small" />,
			},
			{
				slot: "document",
				handler: () => {
					console.log(isEditable && canSuppress && status.label !== "removed");

					updateStatus("removed");
				},
				label: "delete",
				predicate: isActionAllowed(canDelete && status.label !== "removed"),
				Icon: <Icon.Delete size="small" />,
			},
			/* {
        slot: "selection",
        handler: (fileIndex) => {
          if (fileIndex !== undefined) {
            const toSplit = pageConfigList[fileIndex];
            if (Array.isArray(toSplit)) {
              setPageConfigList(
                replaceWithFlattened(pageConfigList, fileIndex)
              );
              // const { id, documentCode } = currentFiles[fileIndex];
              // useCases.splitPdf(id, documentCode);
            }
          }
        },
        label: "split file",
        predicate: true,
      }, */
			{
				slot: "selection",
				handler: async (option) => {
					if (option?.pageId) {
						setLocalMemory("copiedFileId", option.pageId);

						const instance = repositories.pages.entities.find(
							({ meta: { id } }) => id === option.pageId,
						)?.state.imageInstance;
						if (instance) {
							setLocalMemory("clipboard", instance);
						}
					} else if (option?.fileId !== undefined) {
						const instance = currentFiles.find(
							(file) => file.id === option.fileId,
						)?.instance;
						setLocalMemory("copiedFileId", option.fileId);
						if (instance) {
							setLocalMemory("clipboard", instance);
						}
					}
				},
				label: "copy",
				predicate: true,
				Icon: <Icon.CopyFile size="small" />,
			},
			{
				slot: "selection",
				handler(option) {
					if (option?.fileId) {
						repositories.files.delete(option.fileId);
						moveProcess("files");
					} else if (option?.pageId) {
						repositories.pages.delete(option.pageId);
						moveProcess("pages");
					}
				},
				label: "delete",
				predicate: isActionAllowed(canDelete),
				Icon: <Icon.Delete size="small" />,
			},
		] satisfies DocumentViewerProps["actions"];
	}, [
		nature,
		selectedDocument,
		status,
		documentRights,
		userEmail,
		fileActions,
		isActionAllowed,
		openModal,
		savable,
		save,
		copyDocument,
		updateStatus,
		cancel,
		downloadDocument,
		uploadDocument,
		deleteDocument,
		setIsLoading,
		moveProcess,
		localMemory,
		setLocalMemory,
		nature?.config,
		isMergeEnabled,
		isUploadEnabled,
		fileEntities,
		pageEntities,
		currentFiles,
	]);

	const onDrop = async (
		files: File[],
		dropOptions: {
			id: string;
			position: MoveOptions;
			patch?: Record<string, unknown>;
		},
	) => {
		if (!selectedDocument) {
			console.error("Cannot drop files, no document selected.");
			return;
		}

		const [imagesToResize, _rejectedFiles, compliantFiles] =
			helpers.sortFilesToProcessOrRejectBasedOnTypeAndSize(files);

		const resizedImages =
			imagesToResize?.length && imagesToResize.length > 0
				? await helpers.resizeImages(imagesToResize)
				: [];

		const items = [...resizedImages, ...Array.from(compliantFiles || [])];

		const processedItems = await processInstances(items);

		const { id, position } = dropOptions;
		const documentCode = selectedDocument?.documentCode;

		const targetEntityIndex = repositories.files.entities.findIndex(
			({ meta }) => meta.id === id,
		);

		if (targetEntityIndex === -1 && position !== "toLast") {
			console.error("Target entity not found.");
			return;
		}

		const index =
			position === "before"
				? targetEntityIndex
				: position === "toLast"
					? 0
					: targetEntityIndex + 1;

		const toCreate = processedItems
			.map((file) => ({
				documentCode,
				instance: file,
				isLocal: true,
				rotation: 0,
				index: targetEntityIndex,
				pageCount: 1,
			}))
			.filter((v) => v.documentCode !== undefined);

		const createdFiles =
			// @ts-ignore
			repositories.files.create(toCreate, index);

		for (const {
			id: fileId,
			documentCode: newDocumentCode,
			instance,
		} of createdFiles) {
			/* loadPDFPages */ loadFilePages(newDocumentCode, instance, fileId);
		}

		const currentFiles = repositories.files.entities
			.filter(
				({ meta: { id }, state: { documentCode } }) =>
					selectedDocument.documentCode === documentCode &&
					!createdFiles.map(({ id }) => id).includes(id),
			)
			.map(({ meta: { id }, state }) => ({ id, ...state }));
		const allFiles = [...currentFiles, ...createdFiles];

		// Mise à jour du fichier après l'ajout
		if (allFiles.length > 1) {
			// Vérification si des fichiers .msg sont présents
			if (allFiles.some(({ instance }) => instance.name.endsWith(".msg"))) {
				return;
			}

			try {
				const mergedFile = await merge(
					allFiles.map(({ instance }) => instance),
					selectedDocument.name.baseName,
				);

				const toUpdate = repositories.files.entities.find(
					({ state: { documentCode } }) =>
						documentCode === selectedDocument.documentCode,
				);

				if (toUpdate) {
					repositories.files.update(toUpdate.meta.id, { instance: mergedFile });
				}

				updateFile(mergedFile);
			} catch (error) {
				console.info(
					`document: ${selectedDocument.name.baseName}, not mergeable for the moment.`,
				);
			}
		} else if (allFiles.length === 1) {
			updateFile(allFiles[0].instance);
		}
	};

	return {
		extensionsMap,
		focus,
		setFocus,
		isReadOnly: !documentRights.modeEdit,
		actions,
		pageConfigList,
		onAdd() {
			if (!selectedDocument) {
				console.error("Cannot add files, no document selected.");
				return;
			}

			useCases.addFiles(
				selectedDocument.documentCode,
				async <T extends { fileId: string; instance: File }>(
					filePromises: Promise<T>[],
				) => {
					const results: T[] = [];
					for (const filePromise of filePromises) {
						const result = await filePromise;
						results.push(result);
					}
					const instancesFromEntities = fileEntities
						.filter(
							({ state: { documentCode } }) =>
								documentCode === selectedDocument.documentCode,
						)
						.map(({ state: { instance } }) => instance);

					const instancesFromResults = results.map(({ instance }) => {
						console.log(instance);

						if (instance.name.endsWith(".msg")) {
							const { name, lastModified } = instance;
							console.log("in");

							return new File([instance], name, {
								type: "msg",
								lastModified,
							});
						}

						return instance;
					});

					const currentInstances = [
						...instancesFromEntities,
						...instancesFromResults,
					];

					const processedInstances = await processInstances(currentInstances);

					const toUpdate = repositories.files.entities.find(
						({ state: { documentCode } }) =>
							documentCode === selectedDocument.documentCode,
					);

					if (processedInstances.length > 1) {
						if (
							processedInstances.some((instance) =>
								instance.name.endsWith(".msg"),
							)
						) {
							return;
						}

						try {
							const mergedFile = await merge(
								processedInstances,
								selectedDocument.name.baseName,
							);

							console.log(mergedFile);

							if (toUpdate) {
								repositories.files.update(toUpdate?.meta.id, {
									instance: mergedFile,
								});
							}

							updateFile(mergedFile);
						} catch (error) {
							console.info(
								`document: ${selectedDocument.name.baseName}, not mergeable for the moment.`,
							);
						}
					} else if (processedInstances.length === 1) {
						if (toUpdate) {
							repositories.files.update(toUpdate?.meta.id, {
								instance: processedInstances[0],
							});
						}
						updateFile(processedInstances[0]);
					}
				},
				extensionsAllowedOnDrop,
			);
		},
		onConvert: async (fileId: string) => {
			if (!selectedDocument) {
				console.error("Cannot convert file, no document selected.");
				return;
			}

			const file = repositories.files.entities.find(
				({ meta: { id } }) => fileId === id,
			);

			if (file) {
				await useCases.convertFileToPdf(file.meta.id);
				const instancesFromRepo = Object.values(
					repositories.files.read({ documentCode: file.state.documentCode }),
				).map((v) => v.state.instance);

				console.log(instancesFromRepo);

				const processedInstances = await processInstances(instancesFromRepo);

				const [toUpdate] = Object.values(
					repositories.files.read({
						documentCode: selectedDocument.documentCode,
					}),
				);

				if (processedInstances.length > 1) {
					if (
						processedInstances.some((instance) =>
							instance.name.endsWith(".msg"),
						)
					) {
						return;
					}

					try {
						const mergedFile = await merge(
							processedInstances,
							selectedDocument.name.baseName,
						);

						if (toUpdate) {
							repositories.files.update(toUpdate?.meta.id, {
								instance: mergedFile,
							});
						}

						updateFile(mergedFile);
					} catch (error) {
						console.info(
							`document: ${selectedDocument.name.baseName}, not mergeable for the moment.`,
						);
					}
				} else if (processedInstances.length === 1) {
					if (toUpdate) {
						repositories.files.update(toUpdate?.meta.id, {
							instance: processedInstances[0],
						});
					}
					updateFile(processedInstances[0]);
				}
			} else {
				console.error("No file to convert.");
			}
		},
		onPaste: () => {
			if (localMemory.clipboard) {
				const target = currentFiles[currentFiles.length - 1]?.id;
				onDrop([localMemory.clipboard], {
					id: target,
					position: target ? "after" : "toLast",
				});
			}
		},
		dragConfig: {
			handleDragStart: (payload) => {
				if (payload && selectedDocument?.documentCode) {
					const { index, itemNumber, extension } = payload;

					setDraggedItem({
						repository: payload.repository,
						id: payload.id,
						index,
						pageNumber: itemNumber,
						extension,
						documentCode: selectedDocument.documentCode,
					});
				}
			},
			handleDragEnd: () => {
				setDraggedItem(undefined);
			},
			dragged: draggedItem && {
				extension: draggedItem.extension,
				id: draggedItem.id,
				documentCode: draggedItem.documentCode,
			},
		},
		dropZoneConfig: {
			allowedExtensions: extensions?.split(",") || [],
			itemsSelector: ".aside-page",
			groupsSelector: ".page-container",
			ghostElementStyle: {
				opacity: 0.4,
				backgroundColor: "rgba(0, 0, 0, 0.1)",
			},
			insertIndicatorStyle: {
				borderTop: "2px solid blue",
				margin: "4px 0",
			},
			onMove: ({
				sourceId,
				targetId,
				patch,
				position = "after",
			}: {
				sourceId: string;
				targetId?: string;
				patch?: Record<string, unknown>;
				position?: "before" | "after" | "toLast";
			}) => {
				if (!draggedItem || !documentCode || !selectedDocument) return;

				const repository =
					draggedItem.repository === "files"
						? repositories.files
						: repositories.pages;

				const getTargetFileId = (id: string) => ({
					fileId: repositories.pages.state[id].state.fileId,
				});

				let toPatch: typeof patch = {
					documentCode: selectedDocument.documentCode,
				};

				const hasLevelChange = () => {
					const checkingRepositoryName = ["pages", "files"].find(
						(r) => r !== draggedItem.repository,
					);
					const checkingRepository =
						checkingRepositoryName === "files"
							? repositories.files
							: repositories.pages;
					return targetId && !!checkingRepository.state[targetId];
				};

				if (!hasLevelChange()) {
					console.log("same");
					toPatch = targetId
						? { ...toPatch, ...getTargetFileId(targetId) }
						: toPatch;
				} else {
					console.log("change");
					if (draggedItem.repository === "files") {
						if (targetId) {
							const targetFileId = repositories.pages.entities.find(
								(e) => e.meta.id === targetId,
							)?.state.fileId;

							if (targetFileId) {
								const toCreate = repositories.pages.entities
									.filter(({ state: { fileId } }) => draggedItem.id === fileId)
									.map(({ state }) => ({ ...state, fileId: targetFileId }));

								repositories.files.delete(draggedItem.id);
								moveProcess("files").then(() => {
									repositories.pages.create(toCreate);
									moveProcess("pages");
								});
							} else console.log("change-level: no targetFileId");
						} else console.log("change-level: no targetId.");
					}
				}

				if (repository && sourceId) {
					const moveAction = repository.move(sourceId);

					switch (position) {
						case "before":
							if (targetId) {
								moveAction.before(targetId, { patch: toPatch });
								moveProcess(draggedItem.repository);
							} else {
								console.warn(`"before" requires a targetId.`);
							}
							break;

						case "after":
							if (targetId) {
								moveAction.after(targetId, { patch: toPatch });
								moveProcess(draggedItem.repository);
							} else {
								console.warn(`"after" requires a targetId.`);
							}
							break;

						case "toLast":
							moveAction.toLast({ patch: toPatch });
							moveProcess(draggedItem.repository);
							break;

						default:
							console.error(`Unknown position "${position}".`);
					}
				}
			},
			onDrop,
		},
		onMerge: isMergeEnabled
			? () => {
					if (currentFiles.length > 1) {
						useCases.mergeFilesToPdf(
							currentFiles[0].documentCode,
							`${currentFiles[0].documentCode}.pdf`,
						);
					}
				}
			: undefined,
	};
};

export default useViewerProps;
