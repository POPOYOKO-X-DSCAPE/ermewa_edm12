import { createSchema } from "../../../core/domain.builders";

export const documentUpdateInternalBodySchema = createSchema(
	({ array, optional }) =>
		array({
			documentCode: "string",
			lastUpdateTime: "string",

			name: "string",

			url: "string",

			status: optional("number"),
			memo: optional("string"),

			documentDate: optional("documentDateOrEmpty"),
			documentExpires: optional("documentDateOrEmpty"),
			line: optional("number"),

			master: {
				folderName: "string",
				sid: "string",
			},

			natureCode: "string",

			fileData: optional({
				binary: "string",
				extension: "string",
				encoding: "string",
				language: optional("string"),
				detailedUrl: optional("string"),
				shortUrl: optional("string"),
			}),
		}),
);

export const documentUpdateInternalPayloadSchema = createSchema(
	({ array, optional }) => ({
		updated: array({
			baseName: "string",
			documentCode: "string",
			activeCode: "string",
			documentDate: "string",
			documentExpires: optional("string"),
			etag: "number",
			natureCode: "string",
			state: "number",
			updateStatusFlag: "number",
			updateStatusMessage: "string",
			lastUpdateTime: "string",
			user: "string",

			files: optional(
				array({
					uuid: "string",
					language: "string",
					fileType: "string",
					shortUrl: "string",
					linkState: optional("number"),
					sid: optional("string"),
					objectHybrid: optional("string"),
				}),
			),

			links: optional(
				array({
					uuid: "string",
					objectHybrid: "string",
					sid: "string",
					linkState: "number",
				}),
			),
		}),
	}),
);
