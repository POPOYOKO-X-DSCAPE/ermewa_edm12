import { createSchema } from "../../../core/domain.builders";

export const rejectEmailInfoExternalPayloadSchema = createSchema(
	({ array, dict, optional }) => ({
		$ClassName: "string",
		$ClassVer: "string",
		$uid: "string",
		$stamp: "string",

		headers: {
			login: "string",
			uPid: "string",
			uSid: "string",
		},

		xRML: dict({
			MSG_OBJ: "string",
			MSG_BODY: optional("string"),
			MSG_DEST: array({
				MAIL: "string",
			}),
			MSG_CC: optional(
				array({
					MAIL: "string",
				}),
			),
		}),
	}),
);
