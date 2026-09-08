import { Heading, HeadingLevel } from "@ariakit/react";
import classNames from "classnames";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Button } from "../../components/button/button";
import { Dialog } from "../../components/dialog/dialog";
import {
	type EmailViewerStrings,
	resolveEmailViewerStrings,
} from "../email-strings";
import { styles } from "../styles";
import type { EmailDraft } from "../types";
import { normalizeEmailValue } from "../utils";

export const MailEditDialog = ({
	isOpen,
	onClose,
	title,
	submitLabel,
	textLabel,
	requireText = false,
	messageInput = "textarea",
	initialDraft,
	onSubmit,
	strings,
}: {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	submitLabel: string;
	textLabel?: string;
	requireText?: boolean;
	messageInput?: "textarea" | "input";
	initialDraft: EmailDraft;
	onSubmit?: (draft: EmailDraft) => void | Promise<void>;
	strings?: Partial<EmailViewerStrings>;
}) => {
	const resolvedStrings = resolveEmailViewerStrings(strings);
	const resolvedTextLabel = textLabel ?? resolvedStrings.message;

	const [from, setFrom] = useState(initialDraft.from);
	const [to, setTo] = useState(initialDraft.to);
	const [cc, setCc] = useState(initialDraft.cc);
	const [bcc, setBcc] = useState(initialDraft.bcc);
	const [subject, setSubject] = useState(initialDraft.subject);
	const [text, setText] = useState(initialDraft.text);
	const [submitting, setSubmitting] = useState(false);
	const [hasInteracted, setHasInteracted] = useState(false);
	const wasOpenRef = useRef(false);
	const fromInputId = useId();
	const toInputId = useId();
	const ccInputId = useId();
	const bccInputId = useId();
	const subjectInputId = useId();
	const textInputId = useId();

	const seedDraft = useCallback(() => {
		setFrom(initialDraft.from);
		setTo(initialDraft.to);
		setCc(initialDraft.cc);
		setBcc(initialDraft.bcc);
		setSubject(initialDraft.subject);
		setText(initialDraft.text);
	}, [initialDraft]);

	useEffect(() => {
		if (isOpen && !wasOpenRef.current) {
			setHasInteracted(false);
			seedDraft();
		}

		wasOpenRef.current = isOpen;
	}, [seedDraft, isOpen]);

	useEffect(() => {
		if (!isOpen || hasInteracted) {
			return;
		}

		seedDraft();
	}, [hasInteracted, seedDraft, isOpen]);

	const normalizedDraft: EmailDraft = {
		from: normalizeEmailValue(from),
		to: normalizeEmailValue(to),
		cc: normalizeEmailValue(cc),
		bcc: normalizeEmailValue(bcc),
		subject: normalizeEmailValue(subject),
		text: text.trim(),
	};

	const canSubmit =
		normalizedDraft.from.length > 0 &&
		normalizedDraft.to.length > 0 &&
		normalizedDraft.subject.length > 0 &&
		(!requireText || normalizedDraft.text.length > 0) &&
		!submitting;

	const handleSubmit = async () => {
		if (!canSubmit) {
			return;
		}

		setSubmitting(true);

		try {
			onClose();
			await onSubmit?.(normalizedDraft);
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
					<Heading>{title}</Heading>
				</HeadingLevel>

				<label
					className={classNames(styles.metaField)}
					htmlFor={fromInputId}
				>
					<span>{resolvedStrings.from}</span>
					<input
						id={fromInputId}
						value={from}
						onChange={(event) => {
							setHasInteracted(true);
							setFrom(event.currentTarget.value);
						}}
						disabled={submitting}
					/>
				</label>

				<label
					className={classNames(styles.metaField)}
					htmlFor={toInputId}
				>
					<span>{resolvedStrings.to}</span>
					<input
						id={toInputId}
						value={to}
						onChange={(event) => {
							setHasInteracted(true);
							setTo(event.currentTarget.value);
						}}
						disabled={submitting}
					/>
				</label>

				<label
					className={classNames(styles.metaField)}
					htmlFor={ccInputId}
				>
					<span>{resolvedStrings.cc}</span>
					<input
						id={ccInputId}
						value={cc}
						onChange={(event) => {
							setHasInteracted(true);
							setCc(event.currentTarget.value);
						}}
						disabled={submitting}
					/>
				</label>

				<label
					className={classNames(styles.metaField)}
					htmlFor={bccInputId}
				>
					<span>{resolvedStrings.bcc}</span>
					<input
						id={bccInputId}
						value={bcc}
						onChange={(event) => {
							setHasInteracted(true);
							setBcc(event.currentTarget.value);
						}}
						disabled={submitting}
					/>
				</label>

				<label
					className={classNames(styles.metaField)}
					htmlFor={subjectInputId}
				>
					<span>{resolvedStrings.subject}</span>
					<input
						id={subjectInputId}
						value={subject}
						onChange={(event) => {
							setHasInteracted(true);
							setSubject(event.currentTarget.value);
						}}
						disabled={submitting}
					/>
				</label>

				<label
					className={classNames(styles.metaField)}
					htmlFor={textInputId}
				>
					<span>{resolvedTextLabel}</span>
					{messageInput === "textarea" ? (
						<textarea
							id={textInputId}
							value={text}
							onChange={(event) => {
								setHasInteracted(true);
								setText(event.currentTarget.value);
							}}
							disabled={submitting}
							rows={8}
						/>
					) : (
						<input
							id={textInputId}
							value={text}
							onChange={(event) => {
								setHasInteracted(true);
								setText(event.currentTarget.value);
							}}
							disabled={submitting}
							maxLength={255}
						/>
					)}
				</label>

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
						{submitLabel}
					</Button>
				</div>
			</div>
		</Dialog>
	);
};
