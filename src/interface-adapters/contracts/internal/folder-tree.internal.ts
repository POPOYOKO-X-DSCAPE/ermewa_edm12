import { createSchema } from "../../../core/domain.builders";

const folderNameEntryInternalSchema = {
	short: "string",
	description: "string",
} as const;

export const folderTreeInternalSchema = createSchema(
	({ array, optional, lazy }) =>
		lazy((self) => ({
			sid: "string",
			level: "string",
			name: "string",
			type: "string",
			status: "string",

			path: array("string"),
			natures: array("object"),

			folder: optional("string"),

			folderName: optional({
				english: optional(folderNameEntryInternalSchema),
				french: optional(folderNameEntryInternalSchema),
				german: optional(folderNameEntryInternalSchema),
				default: optional(folderNameEntryInternalSchema),
			}),

			display: {
				folder: "string",
				sid: "string",
			},

			links: "object",

			children: array(self),
		})),
);
