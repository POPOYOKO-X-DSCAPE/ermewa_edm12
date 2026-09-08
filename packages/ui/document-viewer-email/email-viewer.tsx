import { Heading, HeadingLevel } from "@ariakit/react";
import { css } from "@styles";
import classNames from "classnames";
// @ts-ignore
import MsgReader from "msgreader";
import { useEffect, useState } from "react";
import { Stack } from "../abstract/stack/stack";
import { List } from "../components/list";
import { EmailAttachments } from "./email-attachments";
import { EmailBody } from "./email-body";
import {
	type EmailViewerStrings,
	resolveEmailViewerStrings,
} from "./email-strings";

type Recipient = { email: string };

type EmailAttachment = {
	name: string;
	extension: string;
	content: ArrayBuffer | Uint8Array;
	fileName: string;
	innerMsgContent?: unknown;
};

type EmailData = {
	subject: string;
	senderName: string;
	recipients: Recipient[];
	body: string | null;
	attachments?: EmailAttachment[];
};

type EmailViewerProps = {
	url: string | null;
	strings?: Partial<EmailViewerStrings>;
};

const msgViewer = css({
	gap: "s.margin.l",
});

const styles = {
	header: css({
		padding: "s.padding.m",
		gap: "s.padding.s",
	}),
	headerItem: css({
		gap: "s.padding.s",
	}),
	error: css({
		color: "s.danger",
	}),
};

export const EmailViewer = ({ url, strings }: EmailViewerProps) => {
	const resolvedStrings = resolveEmailViewerStrings(strings);
	const [emailData, setEmailData] = useState<EmailData | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!url) {
			setEmailData(null);
			setError(null);
			return;
		}

		const fetchMsg = async () => {
			try {
				const response = await fetch(url);
				if (!response.ok) {
					throw new Error(
						`Failed to fetch .msg file: ${response.status}`,
					);
				}

				const arrayBuffer = await response.arrayBuffer();
				const reader = new MsgReader(arrayBuffer);

				const fileData: EmailData = reader.getFileData();

				const enrichedAttachments =
					fileData.attachments?.map((_, index) => {
						const real = reader.getAttachment(index);
						return {
							...real,
							extension:
								real.fileName.split(".").pop()?.toLowerCase() || "",
							fileName: real.fileName,
						};
					}) || [];

				setEmailData({
					...fileData,
					attachments: enrichedAttachments,
				});

				setError(null);
			} catch (err) {
				console.error(err);
				setEmailData(null);
				setError(resolvedStrings.failedToLoad);
			}
		};

		fetchMsg();
	}, [resolvedStrings.failedToLoad, url]);

	return (
		<Stack className={classNames(msgViewer)} grow>
			<HeadingLevel>
				{error && <p className={styles.error}>{error}</p>}
				{!error && emailData ? (
					<Stack className={styles.header} grow>
						<Heading>{emailData.subject}</Heading>
						<HeadingLevel>
							<Stack direction="row" className={styles.headerItem}>
								<Heading>{resolvedStrings.viewerFrom}</Heading>
								{emailData.senderName}
							</Stack>
							<Stack direction="row" className={styles.headerItem}>
								<Heading>{resolvedStrings.viewerTo}</Heading>{" "}
								<List
									items={(emailData.recipients || []).map((r, i) => (
										<span key={r.email}>{r.email}</span>
									))}
								/>
							</Stack>
						</HeadingLevel>
						<Stack direction="row">
							{emailData.attachments && (
								<EmailAttachments attachments={emailData.attachments} />
							)}
						</Stack>
						{emailData.body && <EmailBody body={emailData.body} />}
					</Stack>
				) : (
					!error && <p>No .msg file URL provided or unable to parse.</p>
				)}
			</HeadingLevel>
		</Stack>
	);
};
