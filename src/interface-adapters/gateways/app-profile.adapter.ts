import { api } from "@src/infrastructure/services/raw.api";

import { parametersKeyMap } from "../contracts/common/parameters.keymap";
import { translationsKeyMap } from "../contracts/common/translations.keymap";

import { createKeyMap } from "@packages/free/core/utils";
import { appProfileInternalSchema } from "../contracts/internal/app-profile.internal";

const langKeyMap = createKeyMap({
	FRA: "french",
	ENG: "english",
	GER: "german",
});

export const appProfileAdapter = api.adapt.ermewa.appProfile.get(
	appProfileInternalSchema,
	(raw) =>
		({
			application: {
				name: {
					english: raw.APP.ANAME.ENG || raw.APP.ANAME[""],
					french: raw.APP.ANAME.FRA || raw.APP.ANAME[""],
					german: raw.APP.ANAME.GER || raw.APP.ANAME[""],
					default: raw.APP.ANAME[""],
				},
				sid: raw.APP.ASID,
				version: raw.APP.AVER,
			},

			profile: {
				name: {
					english: raw.PRF.PNAME.ENG,
					french: raw.PRF.PNAME.FRA,
					german: raw.PRF.PNAME.GER,
					default: raw.PRF.PNAME[""],
				},
				sid: raw.PRF.PSID,
				pid: raw.PRF.PPID,

				parameters: parametersKeyMap.remap(raw.PRF.PRM, (node) => ({
					parameter: node?.PRM || "",
					type: node?.TYP || "",
					value: node?.VAL || {},
				})),
			},

			translations: translationsKeyMap.remap(raw.MSG, (node) => ({
				sid: node?.MSGSID,
				format: node?.MSGFOR,
				number: node?.MSGNUM,
				remark: node?.REM,
				language: {
					english: node?.LAN.ENG,
					french: node?.LAN.FRA,
					german: node?.LAN.GER,
				},
			})),

			user: {
				app: raw.USER.APP,
				email: raw.USER.UMAIL,
				login: raw.USER.UID,
				fullName: raw.USER.UNAME,

				languages: raw.USER.LAN.map((l) => langKeyMap.map(l)),
				defaultLanguage: raw.USER.LANDEF
					? langKeyMap.map(raw.USER.LANDEF)
					: undefined,
			},
		}) satisfies typeof appProfileInternalSchema.infer,
);
