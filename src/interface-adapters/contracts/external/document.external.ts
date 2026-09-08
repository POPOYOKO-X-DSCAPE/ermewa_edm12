import { createSchema } from "../../../core/domain.builders";

export const documentExternalSchema = createSchema(
	({ dict, array, optional }) => ({
		COD: "string",
		NAT: "string",

		UPDTIME: "string",
		DOCDATE: "string",
		DOCEXPIRE: optional("string"),

		URL: "string",
		STATE: "number",

		STATEDES: {
			ENG: "string",
			FRA: "string",
			GER: "string",
		},

		LINK: optional({
			UPDTIME: "string",
			STATE: "number",
			STATEDES: {
				ENG: "string",
				FRA: "string",
				GER: "string",
			},
		}),

		MASTER: "boolean",
		MEM: optional("string"),

		NAME: {
			BASENAME: "string",
			DOCNAME: {
				ENG: "string",
				FRA: "string",
				GER: "string",
			},
		},

		XFILE: dict({
			UPDTIME: "string?",
			LAN: optional(
				dict({
					UPDTIME: "string?",
					MASTER: "boolean?",
					PUB: "boolean?",
					LEG: "boolean?",
					URLDET: "string?",
					URLSHO: "string?",
				}),
			),
		}).only(
			"JSON",
			"PDF",
			"JPG",
			"JPEG",
			"MPEG",
			"SVG",
			"MP4",
			"TXT",
			"XML",
			"MSG",
		),

		XLINK: array({
			UPDTIME: "string",
			OBJ: "string",
			NAT: "string",
			SID: "string",
			MASTER: "boolean",
			STATE: "number",
			STATEDES: {
				ENG: "string",
				FRA: "string",
				GER: "string",
			},
		}),
	}),
);
