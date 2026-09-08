import { createSchema } from "../../../core/domain.builders";

export const documentUploadExternalBodySchema = createSchema(
	({ optional, dict }) => ({
		$ClassName: "string",
		$ClassVer: "string",

		xEdmDoc: {
			$ClassName: "string",
			$ClassVer: "string",

			DocDate: "string",
			DocExpire: "string",
			line: "number",
			Nature: "string",
			State: "number",

			Name: {
				BaseName: "string",
				DocName: dict("string"),
			},

			Master: {
				Format: "string",
				Pub: "string",
				Lan: "string",
				Obj: "string",
				ObjID: "string",
			},

			objLink: optional("object"),

			fileData: dict({
				LAN: dict({
					data: "string",
					encode: "string",
				}),
			}),
		},
	}),
);

export const documentUploadExternalPayloadSchema = createSchema(
	({ array, optional }) => ({
		$ClassName: "string",
		$ClassVer: "string",
		xRetUploaded: array({
			XDOC: "string",
			xDocUploaded: {
				XDOC: "string",
				UPDTIME: "string",
				UPDSTAFLG: "number",
				UPDSTAMSG: optional("string"),
				BASENAME: "string",
				NATURE: "string",
				STATE: "number",
				DOCDATE: optional("string"),
				XDOAFILEDATA: optional(
					array({
						URLSHO: optional("string"),
						URLDET: optional("string"),
						CODLAN: optional("string"),
						CODTYP: optional("string"),
					}),
				),
			},
		}),
	}),
);
