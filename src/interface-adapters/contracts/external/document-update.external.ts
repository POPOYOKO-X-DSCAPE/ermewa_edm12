import { createSchema } from "../../../core/domain.builders";

export const documentUpdateExternalBodySchema = createSchema(
	({ array, dict, optional }) => ({
		$ClassName: "string",
		$ClassVer: "string",

		xUpdate: array({
			$ClassName: "string",
			$ClassVer: "string",

			XDOC: "string",
			UPDTIME: "string",

			URL: optional("string"),
			line: optional("number"),

			Nature: optional("string"),
			DocDate: optional("string"),
			DocExpire: optional("string"),
			State: optional("string"),

			Name: {
				BaseName: "string",
				DocName: optional(dict("string")),
			},

			Mem: optional("string"),

			Master: optional({
				Format: optional("string"),
				Pub: optional("string"),
				Lan: optional("string"),
				Obj: "string",
				ObjID: "string",
			}),

			objLink: optional(
				dict({
					SID: "string",
					State: "number",
				}),
			),

			fileData: optional(
				dict({
					LAN: dict({
						data: "string",
						encode: "string",
						URLDET: "string",
						URLSHO: "string",
					}),
				}),
			),
		}),
	}),
);

export const documentUpdateExternalPayloadSchema = createSchema(
	({ array, optional }) => ({
		$ClassName: "string",
		$ClassVer: "string",

		xRetUpdated: array({
			$ClassName: "string",
			$ClassVer: "string",
			$uid: optional("string"),
			$stamp: optional("string"),
			$uPrm: optional({
				$ClassName: optional("string"),
				$ClassVer: optional("string"),
				$uid: optional("string"),
				$stamp: optional("string"),
				default: optional({
					xMode: optional("string"),
					xStatusAllowing: optional(array("number")),
					xStatusToUpdate: optional("number"),
					xStatusIfInserted: optional("number"),
				}),
			}),

			XDOC: "string",

			xDocUpdated: {
				XDOC: "string",
				UPDTIME: "string",
				UPDSTAFLG: "number",
				UPDSTAMSG: "string",
				BASENAME: "string",
				NATURE: "string",
				STATE: "number",
				USER: "string",
				DOCDATE: "string",
				DOCEXPIRE: optional("string"),

				XDOAFILEDATA: optional(
					array({
						$uuid: optional("string"),
						CODLAN: optional("string"),
						DOCTYP: optional("string"),
						CODTYP: optional("string"),
						URLSHO: optional("string"),
						URLDET: optional("string"),
						STATELNK: optional("number"),
						SID: optional("string"),
						OBJHYB: optional("string"),
					}),
				),

				XDOAOBJLINK: optional(
					array({
						$uuid: optional("string"),
						OBJHYB: optional("string"),
						SID: optional("string"),
						STATELNK: optional("number"),
					}),
				),
			},
		}),
	}),
);
