import { createSchema } from "../../../core/domain.builders";

export const naturesMasksExternalPayloadSchema = createSchema(
	({ dict }) => ({
		headers: {
			xSid: "string",
		},

		xOHN: dict({
			COD: "string",

			HEADERS: {
				ERROR: {
					COD: "string",
					MSG: "string",
				},

				LCKCOD: "string",
				MASTER: "boolean",

				TYPE: "string",
				TYPEDES: "string",
			},

			XDOC: dict({
				UPDTIME: "string",
				DOCDATE: "string?",
				DOCEXPIRE: "string?",
				COD: "string",

				LINK: {
					STATE: "number",
					STATEDES: {
						ENG: "string",
						FRA: "string",
						GER: "string",
					},
				},

				MEM: "string",
				MASTER: "boolean",
				URL: "string",

				NAME: {
					BASENAME: "string",
					DOCNAME: {
						ENG: "string",
						FRA: "string",
						GER: "string",
					},
				},

				STATE: "number",

				STATEDES: {
					ENG: "string",
					FRA: "string",
					GER: "string",
				},

				XFILE: "object",
			}),
		}),
	}),
);
