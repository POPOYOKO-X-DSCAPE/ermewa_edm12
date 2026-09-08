// interface-adapters/contracts/external/app-profile.external.ts
import { createSchema } from "../../../core/domain.builders";

import { parametersKeyMap } from "../common/parameters.keymap";
import { translationsKeyMap } from "../common/translations.keymap";

export const appProfileExternalSchema = createSchema(
	({ array, dict, optional }) => ({
		$ClassName: "string",
		$ClassVer: "string",
		$uid: "string",
		$stamp: "string",

		headers: {
			login: "string",
			uPid: "string",
			xEdm: "string",
			xPrf: "string",
		},

		APP: {
			ANAME: {
				ENG: "string",
				FRA: "string",
				GER: optional("string"),
				"": "string",
			},
			ASID: "string",
			AVER: "string",
		},

		PRF: {
			PNAME: {
				ENG: "string",
				FRA: "string",
				GER: optional("string"),
				"": "string",
			},
			PPID: "string",
			PSID: "string",

			PRM: dict({
				PRM: "string",
				TYP: "string",
				VAL: "object",
			}).only(...parametersKeyMap.externals),
		},

		MSG: dict({
			LAN: {
				ENG: optional("string"),
				FRA: optional("string"),
				GER: optional("string"),
			},
			MSGSID: optional("string"),
			MSGFOR: optional("string"),
			MSGNUM: optional("number"),
			REM: optional("string"),
		}).only(...translationsKeyMap.externals),

		USER: {
			APP: dict({
				PRF: dict("object"),
			}),
			UID: "string",
			UNAME: "string",
			UMAIL: "string",
			LAN: array("string"),
			LANDEF: optional("string"),
		},
	}),
);
