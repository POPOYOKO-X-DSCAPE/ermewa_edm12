// interface-adapters/contracts/internal/app-profile.internal.ts
import { createSchema } from "../../../core/domain.builders";

import { parametersKeyMap } from "../common/parameters.keymap";
import { translationsKeyMap } from "../common/translations.keymap";

export const appProfileInternalSchema = createSchema(
	({ array, dict, optional }) => ({
		application: {
			name: {
				english: "string",
				french: "string",
				german: optional("string"),
				default: "string",
			},
			sid: "string",
			version: "string",
		},

		profile: {
			name: {
				english: "string",
				french: "string",
				german: optional("string"),
				default: "string",
			},
			sid: "string",
			pid: "string",

			parameters: dict({
				parameter: "string",
				type: "string",
				value: "object",
			}).only(...parametersKeyMap.internals),
		},

		translations: dict({
			sid: optional("string"),
			format: optional("string"),
			number: optional("number"),
			remark: optional("string"),
			language: {
				english: optional("string"),
				french: optional("string"),
				german: optional("string"),
			},
		}).only(...translationsKeyMap.internals),

		user: {
			app: "object",
			email: "string",
			login: "string",
			fullName: "string",
			languages: array("string"),
			defaultLanguage: optional("string"),
		},
	}),
);
