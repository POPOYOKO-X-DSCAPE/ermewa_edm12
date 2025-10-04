import type {
	MSG_LABELS,
	PRM_LABELS,
} from "@/interface-adapters/external-types";

export type AppProfileInterface = {
	application: {
		name: {
			english: string;
			french: string;
			german?: string;
			default: string;
		};
		sid: string;
		version: string;
	};
	profile: {
		name: {
			english: string;
			french: string;
			german?: string;
			default: string;
		};
		pid: string;
		sid: string;
		parameters: {
			[parameterName in (typeof PRM_LABELS)[keyof typeof PRM_LABELS]]: {
				parameter: string | number | boolean;
				type: string;
				value: Record<string, unknown>;
			};
		};
	};
	messages: {
		[messageLabel in (typeof MSG_LABELS)[keyof typeof MSG_LABELS]]: {
			messageSid?: string;
			messageFormat?: string;
			messageNumber?: number;
			remark?: string;
			language: Partial<{
				english: string;
				french: string;
				german: string;
			}>;
		};
	};
	user: {
		app?: Record<string, unknown>;
		email: string;
		login: string;
		fullName: string;
		languages: ("french" | "english" | "german" | "default")[];
		defaultLanguage?: "french" | "english" | "german" | "default";
	};
};
