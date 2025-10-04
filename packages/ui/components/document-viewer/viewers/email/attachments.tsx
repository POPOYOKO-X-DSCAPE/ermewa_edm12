import { Stack } from "@packages/ui/abstract/stack";
import { RiAttachment2 } from "@remixicon/react";
import { css } from "@styles";
import { useMemo } from "react";

type Attachment = {
	name: string;
	extension: string;
	content: ArrayBuffer | Uint8Array;
	fileName: string;
	innerMsgContent?: unknown;
};

type Props = { attachments: Attachment[] };

const styles = {
	attachmentContainer: css({
		gap: "s.padding.s",
	}),
	attachment: css({
		padding: "s.padding.m",
		gap: "s.padding.s",
		backgroundColor: "s.bg.actionLow.initial",
		"&:hover": {
			bg: "s.bg.actionLow.hover",
		},
	}),
};

export const EmailAttachments = ({ attachments }: Props) => {
	const parsedAttachments = useMemo(() => {
		if (!attachments) return [];

		console.log(attachments);

		return attachments
			.filter(
				(attach) =>
					!attach.fileName?.toLowerCase().startsWith("image") &&
					!attach.innerMsgContent,
			)
			.map((attach) => {
				const { content, fileName, extension } = attach;

				const mimeMap: Record<string, string> = {
					pdf: "application/pdf",
					txt: "text/plain",
					docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
					png: "image/png",
					jpg: "image/jpeg",
					jpeg: "image/jpeg",
				};

				const mimeType =
					mimeMap[extension] || `application/${extension}`;
				const data =
					content instanceof ArrayBuffer
						? new Uint8Array(content)
						: content;
				// @ts-ignore <no explanation for now>
				const blob = new Blob([data], { type: mimeType });
				const url = URL.createObjectURL(blob);

				const previewableExtensions = [
					"pdf",
					"txt",
					"png",
					"jpg",
					"jpeg",
				];
				const shouldPreview = previewableExtensions.includes(extension);

				return { name: fileName, url, shouldPreview };
			});
	}, [attachments]);

	return (
		<Stack className={styles.attachmentContainer} direction="row">
			{parsedAttachments.map((attachment, index) =>
				attachment.shouldPreview ? (
					<a
						key={`${attachment.url}_${index}`}
						href={attachment.url}
						target="_blank"
						rel="noopener noreferrer"
					>
						<Stack direction="row" className={styles.attachment}>
							<RiAttachment2 />
							{attachment.name}
						</Stack>
					</a>
				) : (
					<a
						key={`${attachment.url}_${index}`}
						href={attachment.url}
						download={attachment.name}
					>
						<Stack direction="row" className={styles.attachment}>
							<RiAttachment2 />
							{attachment.name}
						</Stack>
					</a>
				),
			)}
		</Stack>
	);
};
