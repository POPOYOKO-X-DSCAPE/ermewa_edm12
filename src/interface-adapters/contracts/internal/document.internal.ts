import { createSchema } from "../../../core/domain.builders";

export const documentInternalSchema = createSchema(
	({ optional, oneOf }) => ({
		code: "string",
		nature: "string",

		lastTimeUpdated: "string",
		date: optional("string"),
		expirationDate: optional("string"),

		link: optional({
			state: "number",
			stateDescription: {
				english: "string",
				french: "string",
				german: "string",
			},
		}),

		memo: optional("string"),

		isMaster: "boolean",

		name: {
			baseName: "string",
			documentName: {
				english: "string",
				french: "string",
				german: "string",
			},
		},

		state: "number",

		stateDescription: {
			english: "string",
			french: "string",
			german: "string",
		},

		url: "string",

		file: {
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
			lang: "string",
			detailedUrl: "string?",
			shortUrl: "string?",
		},

		isLocal: "boolean",
	}),
);
