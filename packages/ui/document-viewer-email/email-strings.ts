export type EmailViewerStrings = Readonly<{
	emailTitle: string;
	rejectTitle: string;
	rejectSubmit: string;
	from: string;
	to: string;
	cc: string;
	bcc: string;
	subject: string;
	message: string;
	send: string;
	dismiss: string;
	cancel: string;
	rejectionReason: string;
	viewerFrom: string;
	viewerTo: string;
	failedToLoad: string;
}>;

export const DEFAULT_EMAIL_VIEWER_STRINGS: EmailViewerStrings = {
	emailTitle: "Send document by email",
	rejectTitle: "Reject document and send email",
	rejectSubmit: "Reject",
	from: "From *",
	to: "To *",
	cc: "CC",
	bcc: "BCC",
	subject: "Subject *",
	message: "Message",
	send: "Send",
	dismiss: "Dismiss",
	cancel: "Cancel",
	rejectionReason: "Rejection reason",
	viewerFrom: "From:",
	viewerTo: "To:",
	failedToLoad: "Failed to load .msg file.",
};

export const resolveEmailViewerStrings = (
	strings?: Partial<EmailViewerStrings>,
): EmailViewerStrings => ({
	...DEFAULT_EMAIL_VIEWER_STRINGS,
	...strings,
});
