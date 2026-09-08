import { createSchema } from "../../../core/domain.builders";

export const sendMailInternalBodySchema = createSchema(
	({ array, optional }) => ({
		from: "string",
		to: "string",
		cc: optional("string"),
		bcc: optional("string"),
		subject: "string",
		text: optional("string"),
		html: optional("string"),

		attachments: optional(
			array({
				filename: "string",
				content: "string",
				encoding: "string",
			}),
		),
	}),
);

export const sendMailInternalPayloadSchema = createSchema(
	() => "object",
);
