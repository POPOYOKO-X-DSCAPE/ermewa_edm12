import { createSchema } from "../../../core/domain.builders";

export const naturesMasksInternalSchema = createSchema(
	({ dict, array, oneOf }) =>
		dict({
			sid: "string",
			code: "string",

			headers: {
				error: {
					code: "string",
					message: "string",
				},

				lockCode: "string",
				isMaster: "boolean",

				type: "string",
				typeDescription: "string",
			},

			documents: array({
				documentCode: "string",
				lastTimeUpdated: "string",
				documentDate: "string?",
				documentExpires: "string?",

				link: {
					state: "number",
					stateDescription: {
						french: "string",
						english: "string",
						german: "string",
					},
				},

				isMaster: "boolean",
				url: "string",
				memo: "string",

				name: {
					baseName: "string",
					documentName: {
						french: "string",
						english: "string",
						german: "string",
					},
				},

				state: "number",

				stateDescription: {
					french: "string",
					english: "string",
					german: "string",
				},

				file: {
					lang: "string",
					type: oneOf(
						"json",
						"unknown",
						"pdf",
						"jpg",
						"jpeg",
						"mpeg",
						"svg",
						"mp4",
						"txt",
						"xml",
						"msg",
					),
					detailedUrl: "string?",
					shortUrl: "string?",
				},

				isLocal: "boolean",
			}),
		}),
);
