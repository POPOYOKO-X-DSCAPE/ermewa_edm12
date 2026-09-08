import { Heading, HeadingLevel } from "@ariakit/react";
import classNames from "classnames";
import { useEffect, useId, useState } from "react";
import { Button } from "../../button/button";
import { Dialog } from "../../dialog/dialog";
import { styles } from "../styles";
import type { DocumentViewerMetaDraft, DocumentViewerStrings } from "../types";
import { resolveDocumentViewerStrings } from "../types";
import {
	getTodayIsoDate,
	getTomorrowIsoDate,
	isDocumentDateAllowed,
	isExpirationDateAllowed,
	normalizeMetaDate,
	normalizeMetaName,
} from "../utils";

export const MetaEditDialog = ({
	isOpen,
	onClose,
	initialDraft,
	onSubmit,
	showExpiresField = true,
	strings,
}: {
	isOpen: boolean;
	onClose: () => void;
	initialDraft: DocumentViewerMetaDraft;
	onSubmit?: (draft: DocumentViewerMetaDraft) => void | Promise<void>;
	showExpiresField?: boolean;
	strings?: Partial<DocumentViewerStrings>;
}) => {
	const resolvedStrings = resolveDocumentViewerStrings(strings);
	const [name, setName] = useState(initialDraft.name);
	const [date, setDate] = useState(initialDraft.date);
	const [expires, setExpires] = useState(initialDraft.expires);
	const [submitting, setSubmitting] = useState(false);
	const nameInputId = useId();
	const dateInputId = useId();
	const expiresInputId = useId();
	const todayIso = getTodayIsoDate();
	const tomorrowIso = getTomorrowIsoDate();

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		setName(initialDraft.name);
		setDate(initialDraft.date);
		setExpires(initialDraft.expires);
	}, [
		initialDraft.date,
		initialDraft.expires,
		initialDraft.name,
		isOpen,
	]);

	const normalizedDraft: DocumentViewerMetaDraft = {
		name: normalizeMetaName(name),
		date: normalizeMetaDate(date),
		expires: showExpiresField ? normalizeMetaDate(expires) : "",
	};

	const canSubmit =
		normalizedDraft.name.length > 0 &&
		normalizedDraft.date.length > 0 &&
		isDocumentDateAllowed(normalizedDraft.date) &&
		(!showExpiresField ||
			normalizedDraft.expires.length === 0 ||
			isExpirationDateAllowed(normalizedDraft.expires)) &&
		!submitting;

	const handleSubmit = async () => {
		if (!canSubmit) {
			return;
		}

		setSubmitting(true);

		try {
			await onSubmit?.(normalizedDraft);
			onClose();
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Dialog
			isOpen={isOpen}
			closeButtonContent={null}
			onClose={() => {
				if (!submitting) {
					onClose();
				}
			}}
		>
			<div className={classNames(styles.metaDialogBody)}>
				<HeadingLevel>
					<Heading>{resolvedStrings.editMetadata}</Heading>
				</HeadingLevel>

				<label
					className={classNames(styles.metaField)}
					htmlFor={nameInputId}
				>
					<span>{resolvedStrings.metaName}</span>
					<input
						id={nameInputId}
						value={name}
						onChange={(event) => setName(event.currentTarget.value)}
						disabled={submitting}
					/>
				</label>

				<label
					className={classNames(styles.metaField)}
					htmlFor={dateInputId}
				>
					<span>{resolvedStrings.metaDate}</span>
					<input
						id={dateInputId}
						type="date"
						value={normalizeMetaDate(date)}
						max={todayIso}
						onChange={(event) => {
							const nextValue = event.currentTarget.value;

							if (nextValue && nextValue > todayIso) {
								return;
							}

							setDate(nextValue);
						}}
						disabled={submitting}
						required
					/>
				</label>

				{showExpiresField ? (
					<label
						className={classNames(styles.metaField)}
						htmlFor={expiresInputId}
					>
						<span>{resolvedStrings.metaExpires}</span>
						<input
							id={expiresInputId}
							type="date"
							value={normalizeMetaDate(expires)}
							min={tomorrowIso}
							onChange={(event) => {
								const nextValue = event.currentTarget.value;

								if (nextValue && nextValue < tomorrowIso) {
									return;
								}

								setExpires(nextValue);
							}}
							disabled={submitting}
						/>
					</label>
				) : null}

				<div className={classNames(styles.metaActions)}>
					<Button
						level="secondary"
						onClick={() => {
							if (!submitting) {
								onClose();
							}
						}}
						disabled={submitting}
					>
						{resolvedStrings.cancel}
					</Button>
					<Button
						onClick={() => {
							void handleSubmit();
						}}
						disabled={!canSubmit}
					>
						{resolvedStrings.apply}
					</Button>
				</div>
			</div>
		</Dialog>
	);
};
