import { createSchema } from "../../../core/domain.builders";

export const naturesInternalSchema = createSchema(
	({ dict, optional, oneOf, array }) =>
		dict({
			description: {
				french: "string",
			},

			show: {
				english: "string",
				french: "string",
				german: "string",
			},

			natures: dict({
				linkedTo: optional("string"),
				code: "string",
				show: optional("string"),

				description: optional({
					english: "string",
					french: "string",
					german: "string",
				}),

				record: optional("string"),
				genre: optional("string"),
				extensions: optional(array("string")),
				history: optional("string"),
				limit: optional("number"),
				numberLines: optional("number"),
				mode: oneOf("mono", "multi"),

				documentDate: optional("boolean"),
				dueDate: optional("number"),
				hasExpirationDate: "boolean",

				flags: {
					editable: optional("boolean"),
					controllable: optional("boolean"),
					uploadEnabled: optional("boolean"),
					flagEnabled: optional("boolean"),
					enableAxfr: optional("boolean"),
				},

				maxSize: optional("number"),
			}),
		}),
);
