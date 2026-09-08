import { createStore } from "@src/core/domain.builders";

export const documentStore = createStore(
	"documentStore",
	({ optional, dict, oneOf, array }) => ({
		selectedEditorKey: optional("string"),
		editorKeysByDocumentCode: dict("string"),
		badgesByDocumentCode: dict(oneOf("N", "M")),

		clipboard: optional({
			documentCode: "string",
			documentName: "string",
			fileExtension: oneOf(
				"json",
				"unknown",
				"pdf",
				"jpg",
				"jpeg",
				"png",
				"mpeg",
				"svg",
				"mp4",
				"txt",
				"xml",
				"msg",
			),
		}),

		editors: dict({
			documentId: optional("string"),
			documentCode: optional("string"),

			natureId: optional("string"),
			natureCode: optional("string"),

			folderId: optional("string"),
			folderSid: optional("string"),

			mode: oneOf("existing", "new"),

			dirty: "boolean",
			saving: "boolean",

			binaryStatus: oneOf("idle", "loading", "ready", "error"),

			error: optional("string"),
			lastSavedAt: optional("isoDate"),

			actions: array({
				id: oneOf(
					"save",
					"upload",
					"download",
					"email",
					"pending",
					"validate",
					"reject",
					"remove",
					"delete",
					"copy",
					"paste",
				),
				label: "string",
				hidden: "boolean",
				disabled: "boolean",
			}),

			draft: {
				name: optional("string"),
				fileType: oneOf(
					"json",
					"unknown",
					"pdf",
					"jpg",
					"jpeg",
					"png",
					"mpeg",
					"svg",
					"mp4",
					"txt",
					"xml",
					"msg",
				),

				statusNumber: optional("positiveInt"),
				statusLabel: optional("string"),

				documentDate: optional("isoDate"),
				expirationDate: optional("isoDate"),

				memo: optional("string"),

				preview: optional({
					url: "string",
					source: oneOf("descriptor", "blob"),
				}),

				binary: optional({
					url: "string",
					shortUrl: optional("string"),
					detailedUrl: optional("string"),
					name: "string",
					size: "number",
					type: "string",
					base64: optional("string"),
				}),
			},
		}),
	}),
)({
	selectedEditorKey: undefined,
	editorKeysByDocumentCode: {},
	badgesByDocumentCode: {},
	clipboard: undefined,
	editors: {},
});
