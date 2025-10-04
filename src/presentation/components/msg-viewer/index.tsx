// @ts-ignore
import MsgReader from "msgreader";
import { useCallback, useEffect, useState } from "react";

type MsgViewerProps = {
  file: File | null; // Le fichier .msg à parser
};

const MsgViewer: React.FC<MsgViewerProps> = ({ file }) => {
  const [htmlContent, setHtmlContent] = useState<string | null>(null);

  const parseMsgFile = useCallback(async (file: File) => {
    const reader = new MsgReader(await file.arrayBuffer());
    const msg = reader.getFileData();

    const parseMsgBody = (rawBody: string) => {
      return rawBody
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\r\n|\n|\r/g, "<br>")
        .replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;");
    };

    const parsedAttachments = msg.attachments
      .filter(
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        (item: any) => !item.name.startsWith("image") && !item.innerMsgContent
      )
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      .map((attach: any) => {
        const { extension } = attach;
        const { content, fileName } = reader.getAttachment(attach);
        const mimeType = `application/${extension}`; // Tentative de deviner le mimeType
        const blob = new Blob([new Uint8Array(content)], { type: mimeType });
        const url = URL.createObjectURL(blob);

        return { name: fileName, url };
      });

    const html = `
      <div>
        <h1>${msg.subject}</h1>
        <p><b>From:</b> ${msg.senderName}</p>
        <p><b>To:</b> <ul>${msg.recipients
          .map(({ email }: { email: string }) => `<li>${email}</li>`)
          .join("")}</ul></p>
        ${
          parsedAttachments.length > 0
            ? `<p><b>Attachments:</b><ul>${parsedAttachments
                .map(
                  ({ name, url }: { name: string; url: string }) =>
                    `<li><a href="${url}" target="_blank" download="${name}">${name}</a></li>`
                )
                .join("")}</ul></p>`
            : ""
        }
        <hr />
        ${
          typeof msg.body === "string"
            ? parseMsgBody(msg.body)
            : `<p><b style="color: red;">Unable to display the message body.</b></p>`
        }
      </div>
    `;

    setHtmlContent(html);
  }, []);

  useEffect(() => {
    if (file?.name.endsWith(".msg")) {
      parseMsgFile(file);
    } else {
      setHtmlContent(null);
    }
  }, [file, parseMsgFile]);

  return (
    <div className="msg-viewer">
      {htmlContent ? (
        <div
          // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      ) : (
        <p>No .msg file selected or unable to parse.</p>
      )}
    </div>
  );
};

export default MsgViewer;
