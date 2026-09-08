import { createSchema } from "../../../core/domain.builders";

export const rejectEmailInfoInternalSchema = createSchema(
	({ array, optional }) => ({
		templateKey: "string",
		subject: "string",
		text: optional("string"),
		to: array("string"),
		cc: optional(array("string")),
	}),
);
