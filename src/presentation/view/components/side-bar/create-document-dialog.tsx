import {
	Combobox,
	ComboboxItem,
	ComboboxLabel,
	ComboboxPopover,
	ComboboxProvider,
	Heading,
	HeadingLevel,
} from "@ariakit/react";
import { Button, Ellipsis, Stack } from "@packages/ui";
import { Scrollable } from "@packages/ui/abstract/scrollable/scrollable";
import { Dialog } from "@packages/ui/components/dialog/dialog";
import {
	RiCloseLine,
	RiFile2Line,
	RiFileZipLine,
	RiFolder2Line,
} from "@remixicon/react";
import { createComponent } from "@src/core/component.builder";
import type { DuplicableDocumentOption } from "@src/presentation/contracts/side-bar.interface";
import { matchSorter } from "match-sorter";
import {
	startTransition,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import { css } from "../../../../../../../styled-system/css";

const Styles = {
	icon: css({
		display: "flex",
		flexShrink: 0,
	}),
	content: css({
		gap: "s.padding.m",
		minWidth: "320px",
	}),
	options: css({
		gap: "s.padding.s",
	}),
	option: css({
		gap: "s.padding.m",
		padding: "s.padding.m",
		borderColor: "s.fg.default.initial",
		borderWidth: "1px",
		borderStyle: "solid",
	}),
	separator: css({
		height: "100%",
		width: "1px",
		backgroundColor: "s.fg.default.initial",
	}),
	fromComputer: css({
		minHeight: "100px",
	}),
	docCard: css({
		padding: "s.padding.m",
		gap: "s.padding.m",
		borderColor: "s.fg.default.initial",
		borderWidth: "1px",
		borderStyle: "solid",
	}),
	buttons: css({
		gap: "s.padding.s",
	}),
	combobox: css({
		padding: "s.padding.xs",
		borderColor: "s.fg.elevated.initial",
		borderWidth: "1px",
		borderStyle: "solid",
		borderRadius: "s.radius.xl",
	}),
	popover: css({
		backgroundColor: "s.bg.elevated.initial",
		borderColor: "s.fg.elevated.initial",
		borderWidth: "1px",
		borderStyle: "solid",
		borderRadius: "s.radius.m",
		zIndex: 4,
	}),
	popoverContent: css({
		maxHeight: "33vh",
	}),
	popoverOptionElement: css({
		gap: "s.padding.xxs",
		width: "80%",
	}),
	popoverOptionElementMeta: css({
		width: "20%",
	}),
	comboItem: css({
		cursor: "pointer",
		padding: "s.padding.xs",
		backgroundColor: "s.bg.elevated.initial",
		zIndex: 1,
		_hover: {
			backgroundColor: "s.bg.elevated.hover",
		},
	}),
	comboItemContent: css({
		width: "100%",
		gap: "s.padding.m",
	}),
	comboboxItemFolders: css({
		fontSize: "smaller",
	}),
	noResults: css({
		padding: "s.padding.xs",
		color: "orangeRed",
		backgroundColor: "s.bg.elevated.initial",
		_hover: {
			backgroundColor: "s.bg.elevated.hover",
		},
	}),
};

export const CreateDocumentDialog = createComponent(
	({
		controllers: {
			folderTreeController: {
				closeCreateDocumentDialog,
				createLocalDocumentFromFiles,
				duplicateExistingDocument,
			},
		},
		models: {
			folderTreeModel: { createDocumentDialog },
			i18nModel: { i18n },
		},
	}) => {
		const dialog = createDocumentDialog;
		const target = dialog.target;
		const filePicker = dialog.filePicker;
		const duplicableDocuments = (dialog.duplicableDocuments ??
			[]) as readonly DuplicableDocumentOption[];

		const [searchValue, setSearchValue] = useState("");
		const [selectedFiles, setSelectedFiles] = useState<readonly File[]>(
			[],
		);
		const [
			selectedExistingDocumentCode,
			setSelectedExistingDocumentCode,
		] = useState<string | undefined>(undefined);

		const resetScopeKey = `${dialog.isOpen ? "open" : "closed"}:${target?.folderSid ?? ""}:${target?.natureCode ?? ""}`;

		useEffect(() => {
			void resetScopeKey;

			setSearchValue("");
			setSelectedFiles([]);
			setSelectedExistingDocumentCode(undefined);
		}, [resetScopeKey]);

		const selectedExistingDocument = useMemo(
			() =>
				duplicableDocuments.find(
					(option) =>
						option.documentCode === selectedExistingDocumentCode,
				),
			[selectedExistingDocumentCode, duplicableDocuments],
		);

		const matches = useMemo(
			() =>
				matchSorter(duplicableDocuments, searchValue, {
					keys: [
						"label",
						"documentCode",
						"documentName",
						"folderName",
						"natureCode",
					],
				}),
			[duplicableDocuments, searchValue],
		);

		const selectedLabel =
			selectedExistingDocument?.label.document ??
			(selectedFiles.length
				? selectedFiles.length === 1
					? selectedFiles[0]?.name
					: i18n.t("createDocumentFilesSelected", {
							count: selectedFiles.length,
					  })
				: undefined);

		const handleClose = useCallback(() => {
			closeCreateDocumentDialog();
		}, [closeCreateDocumentDialog]);

		const handleClearSelection = useCallback(() => {
			setSearchValue("");
			setSelectedFiles([]);
			setSelectedExistingDocumentCode(undefined);
		}, []);

		const handleSetCurrentExistingDocument = useCallback(
			(option: DuplicableDocumentOption) => {
				setSearchValue(option.label.document);
				setSelectedFiles([]);
				setSelectedExistingDocumentCode(option.documentCode);
			},
			[],
		);

		const handleChooseFiles = useCallback(() => {
			if (!filePicker?.replace.allowed) {
				return;
			}

			const picker = document.createElement("input");
			picker.type = "file";
			picker.accept = filePicker.replace.accept;
			picker.multiple = filePicker.replace.multiple;

			picker.onchange = () => {
				const files = Array.from(picker.files ?? []);
				if (!files.length) {
					return;
				}

				setSearchValue("");
				setSelectedExistingDocumentCode(undefined);
				setSelectedFiles(files);
			};

			picker.click();
		}, [filePicker]);

		const handleConfirm = useCallback(async () => {
			if (!target) {
				return;
			}

			if (selectedExistingDocumentCode) {
				const created = await duplicateExistingDocument({
					folderSid: target.folderSid,
					natureCode: target.natureCode,
					sourceDocumentCode: selectedExistingDocumentCode,
				});

				if (created) {
					handleClearSelection();
				}

				return;
			}

			if (!selectedFiles.length) {
				return;
			}

			const created = await createLocalDocumentFromFiles({
				folderSid: target.folderSid,
				natureCode: target.natureCode,
				files: selectedFiles,
			});

			if (created) {
				handleClearSelection();
			}
		}, [
			createLocalDocumentFromFiles,
			duplicateExistingDocument,
			handleClearSelection,
			selectedExistingDocumentCode,
			selectedFiles,
			target,
		]);

		const canConfirm = Boolean(
			selectedExistingDocumentCode || selectedFiles.length,
		);

		const noResultsMessage = !target
			? i18n.t("createDocumentNoResultNatureContext")
			: duplicableDocuments.length === 0
				? i18n.t("createDocumentNoCompatibleDocuments")
				: i18n.t("createDocumentNoResults");

		const ScrollablePopoverContent = () => {
			return (
				<Scrollable.Content>
					{matches.length ? (
						matches.map((option) => (
							<ComboboxItem
								key={option.id}
								value={option.label.document}
								className={Styles.comboItem}
								onClick={() => handleSetCurrentExistingDocument(option)}
							>
								<Stack
									direction="row"
									alignItems="center"
									grow
									className={Styles.comboItemContent}
								>
									<Stack
										direction="row"
										grow
										alignItems="center"
										className={Styles.popoverOptionElement}
									>
										<RiFile2Line size={16} className={Styles.icon} />
										<Ellipsis>{option.label.document}</Ellipsis>
									</Stack>
									<Stack
										className={Styles.popoverOptionElementMeta}
										grow
									>
										{option.label.folder && (
											<Stack
												direction="row"
												className={Styles.comboboxItemFolders}
												alignItems="center"
											>
												<RiFolder2Line
													size={12}
													className={Styles.icon}
												/>
												<Ellipsis>{option.label.folder}</Ellipsis>
											</Stack>
										)}
										{option.label.nature && (
											<Stack
												direction="row"
												className={Styles.comboboxItemFolders}
												alignItems="center"
											>
												<RiFileZipLine
													size={12}
													className={Styles.icon}
												/>
												<Ellipsis>{option.label.nature}</Ellipsis>
											</Stack>
										)}
									</Stack>
								</Stack>
							</ComboboxItem>
						))
					) : (
						<div className={Styles.noResults}>{noResultsMessage}</div>
					)}
				</Scrollable.Content>
			);
		};

		return (
			<Dialog
				closeButtonContent={"cancel"}
				onClose={handleClose}
				isOpen={dialog.isOpen}
			>
				<HeadingLevel>
					<Stack className={Styles.content}>
						<Heading>{i18n.t("createDocumentTitle")}</Heading>
						<Stack direction="column">
							{selectedLabel ? (
								<Stack
									direction="row"
									alignItems="center"
									className={Styles.docCard}
									grow
								>
									<Stack grow direction="row" alignItems="center">
										<RiFile2Line size={20} />
										<Ellipsis>{selectedLabel}</Ellipsis>
									</Stack>
									<Button
										level="secondary"
										onClick={handleClearSelection}
									>
										<Stack direction="row">
											<RiCloseLine />
										</Stack>
									</Button>
								</Stack>
							) : (
								<Stack className={Styles.options}>
									<Stack className={Styles.option}>
										<Heading>{i18n.t("createDocumentExisting")}</Heading>
										<ComboboxProvider
											value={searchValue}
											setValue={(value) => {
												startTransition(() => setSearchValue(value));
											}}
										>
											<Stack>
												<ComboboxLabel>{i18n.t("createDocumentDocumentName")}</ComboboxLabel>
												<Combobox
													placeholder={i18n.t("createDocumentDocumentNamePlaceholder")}
													className={Styles.combobox}
												/>
												<ComboboxPopover
													gutter={4}
													sameWidth
													className={Styles.popover}
												>
													<Stack className={Styles.popoverContent}>
														<Scrollable.Provider axis="y">
															<ScrollablePopoverContent />
														</Scrollable.Provider>
													</Stack>
												</ComboboxPopover>
											</Stack>
										</ComboboxProvider>
									</Stack>
								<Stack grow alignItems="center">
									{i18n.t("createDocumentOr")}
								</Stack>
									<Stack className={Styles.option}>
										<Heading>{i18n.t("createDocumentFromDisk")}</Heading>
										<Stack
											className={Styles.fromComputer}
											alignItems="center"
											justifyContent="center"
										>
											<Button
												onClick={handleChooseFiles}
												disabled={!filePicker?.replace.allowed}
											>
												{i18n.t("createDocumentChooseFile")}
											</Button>
										</Stack>
									</Stack>
								</Stack>
							)}
						</Stack>
						<Stack
							direction="row"
							justifyContent="end"
							alignItems="center"
							grow
							className={Styles.buttons}
						>
							<Button onClick={handleClose}>{i18n.t("viewerCancel")}</Button>
							<Button
								disabled={!canConfirm}
								onClick={handleConfirm}
							>
								{i18n.t("createDocumentConfirm")}
							</Button>
						</Stack>
					</Stack>
				</HeadingLevel>
			</Dialog>
		);
	},
);
