import { createSchema } from "../../../core/domain.builders";

export const sendMailExternalBodySchema = createSchema(
	({ array, optional }) => ({
		$ClassName: "string",
		$ClassVer: "string",

		xMessage: {
			$ClassName: "string",
			$ClassVer: "string",

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
		},
	}),
);

export const sendMailExternalPayloadSchema = createSchema(
	() => "object",
);
