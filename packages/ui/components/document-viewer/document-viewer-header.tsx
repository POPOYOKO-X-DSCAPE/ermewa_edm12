import { Heading, HeadingLevel } from "@ariakit/react";
import { Button, Stack } from "@packages/ui";
import { RiArrowDownSLine, RiEdit2Line } from "@remixicon/react";
import classNames from "classnames";
import { memo, useRef, useState } from "react";
import { MetaEditDialog } from "./dialogs/meta-edit";
import { StatusDot } from "./status-dot";
import { styles } from "./styles";
import type {
	DocumentViewerChromeProps,
	DocumentViewerMetaDraft,
	ResolvedAction,
} from "./types";
import {
	isPrimaryActionId,
	isStatusActionId,
	normalizeMetaDate,
	normalizeMetaName,
} from "./utils";

export const DocumentViewerHeader = memo(
	({
		name,
		date,
		expires,
		status,
		showExpiresField,
		actions,
		type,
		readonly,
		onReplaceFiles,
		replaceFileAccept,
		showReplaceFile,
		allowMultipleReplaceFiles,
		onMetaSubmit,
		metaExtra,
		interactionDisabled = false,
		strings,
	}: DocumentViewerChromeProps) => {
		const [isMetaDialogOpen, setIsMetaDialogOpen] = useState(false);
		const replaceInputRef = useRef<HTMLInputElement | null>(null);

		const initialDraft: DocumentViewerMetaDraft = {
			name: normalizeMetaName(name),
			date: normalizeMetaDate(date),
			expires: normalizeMetaDate(expires),
		};

		const hasDate = Boolean(date);
		const hasExpires = Boolean(expires);

		const visibleActions = (actions ?? []).filter(
			({ hidden }) => !hidden,
		);

		const resolvedActions: readonly ResolvedAction[] =
			visibleActions.map((action) => ({
				id: action.id,
				label: action.label,
				onClick: action.onClick,
				disabled: Boolean(action.disabled),
			}));

		const statusActions = resolvedActions.filter(({ id }) =>
			isStatusActionId(id),
		);
		const primaryActions = resolvedActions.filter(({ id }) =>
			isPrimaryActionId(id),
		);
		const fileActions = resolvedActions.filter(
			({ id }) => !isStatusActionId(id) && !isPrimaryActionId(id),
		);

		const statusMenuItems = statusActions.map((action) => ({
			label: action.label,
			callback: action.onClick,
			disabled: action.disabled,
		}));
		const fileMenuItems = fileActions.map((action) => ({
			label: action.label,
			callback: action.onClick,
			disabled: action.disabled,
		}));

		return (
			<Stack
				className={classNames(styles.header)}
				direction="row"
				alignItems="center"
			>
				<HeadingLevel>
					<Stack
						direction="row"
						alignItems="center"
						className={classNames(styles.headingGroup)}
						grow
					>
						<Stack>
							<Heading>{name}</Heading>
							<Stack direction="row" className={styles.meta}>
								{status !== undefined ? (
									<Stack
										direction="row"
										className={styles.meta}
										alignItems="center"
									>
										<StatusDot statusType={status} />
									</Stack>
								) : null}
								{hasDate ? (
									<span>
										{strings.date}: {date}
									</span>
								) : null}
								{hasDate && hasExpires ? <span>|</span> : null}
								{hasExpires ? (
									<span>
										{strings.expires}: {expires}
									</span>
								) : null}
							</Stack>
						</Stack>

						{!readonly && onMetaSubmit ? (
							<Button
								level="secondary"
								onClick={() => setIsMetaDialogOpen(true)}
								disabled={interactionDisabled}
							>
								<RiEdit2Line />
								{strings.editMeta}
							</Button>
						) : null}

						{metaExtra}

						{type !== "pdf" &&
						showReplaceFile &&
						onReplaceFiles &&
						replaceFileAccept ? (
							<>
								<input
									ref={replaceInputRef}
									type="file"
									accept={replaceFileAccept || undefined}
									multiple={allowMultipleReplaceFiles}
									style={{ display: "none" }}
									onChange={(event) => {
										const input = event.currentTarget;
										const files = Array.from(input.files ?? []);

										try {
											if (!files.length) return;
											void onReplaceFiles(files);
										} finally {
											input.value = "";
										}
									}}
								/>

								<Button
									level="secondary"
									onClick={() => replaceInputRef.current?.click()}
									disabled={interactionDisabled}
								>
									{strings.replaceFile}
								</Button>
							</>
						) : null}
					</Stack>
				</HeadingLevel>
				{resolvedActions.length > 0 ? (
					<Stack
						direction="row"
						className={classNames(styles.action)}
						justifyContent="end"
						alignItems="center"
					>
						{statusMenuItems.length > 0 ? (
							<Button.Menu
								items={statusMenuItems}
								placement="bottom-end"
							>
								<Stack className={styles.unwrappedWords}>
									{strings.changeStatus}
								</Stack>
								<RiArrowDownSLine />
							</Button.Menu>
						) : null}

						{fileActions.length === 1 ? (
							<Button
								key={fileActions[0]?.id}
								onClick={fileActions[0]?.onClick}
								level="secondary"
								disabled={fileActions[0]?.disabled}
							>
								{fileActions[0]?.label}
							</Button>
						) : fileMenuItems.length > 1 ? (
							<Button.Menu items={fileMenuItems} placement="bottom-end">
								{strings.file} <RiArrowDownSLine />
							</Button.Menu>
						) : null}

						{primaryActions.map(({ label, onClick, id, disabled }) => (
							<Button
								key={id}
								onClick={onClick}
								level="secondary"
								disabled={disabled}
							>
								{label}
							</Button>
						))}
					</Stack>
				) : null}
				<MetaEditDialog
					isOpen={isMetaDialogOpen}
					onClose={() => setIsMetaDialogOpen(false)}
					initialDraft={initialDraft}
					onSubmit={onMetaSubmit}
					showExpiresField={showExpiresField}
					strings={strings}
				/>
			</Stack>
		);
	},
);
