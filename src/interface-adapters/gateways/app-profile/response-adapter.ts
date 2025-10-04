import type { AppProfileInterface } from "@/domain/types/";
import {
	type AppProfileBodyResponse,
	MSG_LABELS,
	PRM_LABELS,
} from "@/interface-adapters/external-types";

type AppParameters = AppProfileInterface["profile"]["parameters"];
type AppMessages = AppProfileInterface["messages"];

export const LANG_MAP = {
	"": "default",
	ENG: "english",
	FRA: "french",
	GER: "german",
} as const;

function adaptAppProfileResponse({
	APP,
	PRF,
	MSG,
	USER,
}: AppProfileBodyResponse) {
	const adaptedAppProfile = {
		application: {
			name: {
				english: APP.ANAME.ENG || APP.ANAME[""],
				french: APP.ANAME.FRA || APP.ANAME[""],
				german: APP.ANAME.GER || APP.ANAME[""],
				default: APP.ANAME[""],
			},
			sid: APP.ASID,
			version: APP.AVER,
		},
		profile: {
			name: {
				english: PRF.PNAME.ENG,
				french: PRF.PNAME.FRA,
				german: PRF.PNAME.GER,
				default: PRF.PNAME[""],
			},
			sid: PRF.PSID,
			pid: PRF.PPID,
			parameters: Object.keys(PRF.PRM).reduce<AppParameters>(
				(acc, key) => {
					const k = key as keyof typeof PRF.PRM;
					const label = PRM_LABELS[k];

					acc[label] = {
						parameter: PRF.PRM[k].PRM,
						type: PRF.PRM[k].TYP,
						value: PRF.PRM[k].VAL,
					};

					return acc;
				},
				{} as AppParameters,
			),
		},
		messages: Object.keys(MSG).reduce<AppMessages>((acc, key) => {
			const k = key as keyof typeof MSG;
			const label = MSG_LABELS[k];

			acc[label] = {
				messageSid: MSG[k].MSGSID,
				messageFormat: MSG[k].MSGFOR,
				messageNumber: MSG[k].MSGNUM,
				remark: MSG[k].REM,
				language: {
					english: MSG[k].LAN.ENG,
					french: MSG[k].LAN.FRA,
					german: MSG[k].LAN.GER,
				},
			};

			return acc;
		}, {} as AppMessages),
		user: {
			app: USER.APP,
			email: USER.UMAIL,
			login: USER.UID,
			fullName: USER.UNAME,
			languages: USER.LAN.map((language) => LANG_MAP[language]),
			defaultLanguage: USER.LANDEF ? LANG_MAP[USER.LANDEF] : undefined,
		},
	} satisfies AppProfileInterface;

	return adaptedAppProfile;
}

export default adaptAppProfileResponse;
