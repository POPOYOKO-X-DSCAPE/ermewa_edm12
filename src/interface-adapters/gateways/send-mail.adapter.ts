import { api } from "@src/infrastructure/services/raw.api";

import {
	sendMailInternalBodySchema,
	sendMailInternalPayloadSchema,
} from "../contracts/internal/send-mail.internal";

export const sendMailAdapter = api.adapt.ermewa.sendMail.post({
	body: {
		schema: sendMailInternalBodySchema,
		map: (input) => ({
			$ClassName: "IerXEdmMail",
			$ClassVer: "12.7",

			xMessage: {
				$ClassName: "IerXMailMessage",
				$ClassVer: "12.7",

				from: input.from,
				to: input.to,
				cc: input.cc,
				bcc: input.bcc,
				subject: input.subject,
				text: input.text,
				html: input.html,
				attachments: input.attachments,
			},
		}),
	},

	payload: {
		schema: sendMailInternalPayloadSchema,
		map: (legacy) => legacy,
	},
});
