import { createSchema } from "../../../core/domain.builders";

export const displaySelectExternalPayloadSchema = createSchema(
	({ array }) => ({
		xSel: array({
			$uuid: "string",
			$etag: "string",

			REQNUM: "string",
			REQORD: "number",
			REQSTA: "string",

			BPSNUM: "string",
			ETBNUM: "string",

			YME06: "string",
			WSHCOD: "string",
			MACNUM: "string",
			COPHID: "string",
			WYSA01: "string",

			REQINIDAT: "string",
			BEGDAT: "string",
			ENDDAT: "string",
			REQCLODAT: "string",

			REQROOT: "string",
			REQROOT_REF: {
				$title: "string",
			},

			REQFATHER: "string",
			REQFATHER_REF: {
				$title: "string",
			},

			REQTYP: "string",
			REQTYP_REF: {
				$title: "string",
				$description: "string",
			},

			CONREV: "string",
			CONREV_REF: {
				$title: "string",
			},
		}),
	}),
);
