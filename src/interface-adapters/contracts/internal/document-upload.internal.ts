import { createSchema } from "../../../core/domain.builders";

export const documentUploadInternalBodySchema = createSchema(
	({ optional }) => ({
		localDocumentCode: "string",
		natureCode: "string",
		documentDate: "documentDate",
		expirationDate: optional("documentDateOrEmpty"),
		lineNumber: "number",
		status: "number",

		documentName: {
			baseName: "string",
			name: optional("string"),
		},

		master: {
			objectSid: "string",
			publication: optional("string"),
			format: optional("string"),
			object: optional("string"),
			language: optional("string"),
		},

		content: "string",
	}),
);

export const documentUploadInternalPayloadSchema = createSchema(
	({ array, optional }) => ({
		uploaded: array({
			documentCode: "string",
			ok: "boolean",
			message: optional("string"),
			lastUpdateTime: "string",
			baseName: "string",
			natureCode: "string",
			status: "number",
			documentDate: optional("string"),
			file: optional({
				shortUrl: optional("string"),
				detailedUrl: optional("string"),
				fileType: optional("string"),
				language: optional("string"),
			}),
		}),
	}),
);
