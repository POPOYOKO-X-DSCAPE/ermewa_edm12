import { api } from "@src/infrastructure/services/raw.api";

import { rejectEmailInfoInternalSchema } from "../contracts/internal/reject-email-info.internal";

export const rejectEmailInfoAdapter =
	api.adapt.ermewa.rejectEmailInfo.get(
		rejectEmailInfoInternalSchema,
		(raw) => {
			const [templateKey, message] = Object.entries(raw.xRML)[0] ?? [
				"",
				{
					MSG_OBJ: "",
					MSG_BODY: undefined,
					MSG_DEST: [],
					MSG_CC: undefined,
				},
			];

			return {
				templateKey,
				subject: message.MSG_OBJ,
				text: message.MSG_BODY,
				to: message.MSG_DEST.map((dest) => dest.MAIL),
				cc: message.MSG_CC?.map((dest) => dest.MAIL),
			} satisfies typeof rejectEmailInfoInternalSchema.infer;
		},
	);
