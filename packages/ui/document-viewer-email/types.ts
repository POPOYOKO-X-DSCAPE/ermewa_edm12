import type { ReactNode } from "react";
import type { Action } from "../components/document-viewer/types";
import type { EmailViewerStrings } from "./email-strings";

export type EmailDraft = Readonly<{
	from: string;
	to: string;
	cc: string;
	bcc: string;
	subject: string;
	text: string;
}>;

export type EmailSubmitCallback = (
	draft: EmailDraft,
) => void | Promise<void>;

export interface UseEmailActionsOptions {
	onEmailSubmit?: EmailSubmitCallback;
	onRejectEmailSubmit?: EmailSubmitCallback;
	rejectEmailInitialDraft?: EmailDraft;
	/** Document name, used to seed the email subject default. */
	documentName?: string;
	/** Current document status number; the reject-motif button shows at 3. */
	status?: number;
	/** Rejection memo, shown through the reject-motif button. */
	memo?: string;
	/** Localized UI strings (fallback: English defaults). */
	strings?: Partial<EmailViewerStrings>;
}

export interface UseEmailActionsResult {
	/**
	 * Merges the email/reject dialog machinery into a base action list,
	 * preserving each action's id, label, visibility and base disabled state.
	 * Actions with id "email" / "reject" get their dialog open-state, modal
	 * and submitting-disabled behavior.
	 */
	apply: (actions: readonly Action[]) => Action[];
	/**
	 * The "reason for rejection" button, or null when not applicable
	 * (status === 3 with a memo). Render in the header meta area.
	 */
	rejectContext: ReactNode | null;
}
