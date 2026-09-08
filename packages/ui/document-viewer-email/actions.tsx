import { RiEyeLine } from "@remixicon/react";
import { useMemo, useState } from "react";
import { Button } from "../components/button/button";
import type { Action } from "../components/document-viewer/types";
import { MailEditDialog } from "./components/mail-edit";
import { RejectContextDialog } from "./components/reject-context";
import {
	type EmailViewerStrings,
	resolveEmailViewerStrings,
} from "./email-strings";
import type {
	UseEmailActionsOptions,
	UseEmailActionsResult,
} from "./types";
import { normalizeMetaName, normalizeOptionalMemo } from "./utils";

export const useEmailActions = ({
	onEmailSubmit,
	onRejectEmailSubmit,
	rejectEmailInitialDraft,
	documentName,
	status,
	memo,
	strings,
}: UseEmailActionsOptions): UseEmailActionsResult => {
	const emailStrings = resolveEmailViewerStrings(strings);
	const [isEmailOpen, setIsEmailOpen] = useState(false);
	const [isRejectOpen, setIsRejectOpen] = useState(false);
	const [isMemoOpen, setIsMemoOpen] = useState(false);
	const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);
	const [isRejectSubmitting, setIsRejectSubmitting] = useState(false);

	const initialEmailDraft = useMemo(
		() => ({
			from: "",
			to: "",
			cc: "",
			bcc: "",
			subject: normalizeMetaName(documentName),
			text: "",
		}),
		[documentName],
	);

	const initialRejectDraft =
		rejectEmailInitialDraft ?? initialEmailDraft;
	const resolvedMemo = normalizeOptionalMemo(memo);

	const submitEmail = async (
		draft: Parameters<
			NonNullable<UseEmailActionsOptions["onEmailSubmit"]>
		>[0],
	) => {
		setIsEmailSubmitting(true);
		try {
			await onEmailSubmit?.(draft);
		} finally {
			setIsEmailSubmitting(false);
		}
	};

	const submitReject = async (
		draft: Parameters<
			NonNullable<UseEmailActionsOptions["onRejectEmailSubmit"]>
		>[0],
	) => {
		setIsRejectSubmitting(true);
		try {
			await onRejectEmailSubmit?.(draft);
		} finally {
			setIsRejectSubmitting(false);
		}
	};

	const apply = (actions: readonly Action[]): Action[] => {
		const hasEmailSubmit = Boolean(onEmailSubmit);
		const hasRejectSubmit = Boolean(onRejectEmailSubmit);

		return actions.map((action): Action => {
			if (action.id === "email" && hasEmailSubmit) {
				return {
					...action,
					disabled: action.disabled || isEmailSubmitting,
					onClick: () => setIsEmailOpen(true),
					renderModal: () => (
						<MailEditDialog
							isOpen={isEmailOpen}
							onClose={() => setIsEmailOpen(false)}
							title={emailStrings.emailTitle}
							submitLabel={emailStrings.send}
							initialDraft={initialEmailDraft}
							onSubmit={submitEmail}
							strings={emailStrings}
						/>
					),
				};
			}

			if (action.id === "reject" && hasRejectSubmit) {
				return {
					...action,
					disabled: action.disabled || isRejectSubmitting,
					onClick: () => setIsRejectOpen(true),
					renderModal: () => (
						<MailEditDialog
							isOpen={isRejectOpen}
							onClose={() => setIsRejectOpen(false)}
							title={emailStrings.rejectTitle}
							submitLabel={emailStrings.rejectSubmit}
							textLabel={emailStrings.message}
							requireText
							messageInput="textarea"
							initialDraft={initialRejectDraft}
							onSubmit={submitReject}
							strings={emailStrings}
						/>
					),
				};
			}

			return action;
		});
	};

	const rejectContext =
		resolvedMemo && status === 3 ? (
			<>
				<Button level="secondary" onClick={() => setIsMemoOpen(true)}>
					<RiEyeLine />
					{emailStrings.rejectionReason}
				</Button>
				<RejectContextDialog
					isOpen={isMemoOpen}
					onClose={() => setIsMemoOpen(false)}
					content={resolvedMemo}
					strings={emailStrings}
				/>
			</>
		) : null;

	return { apply, rejectContext };
};
