import { api } from "@src/infrastructure/services/raw.api";

import {
	fileInternalBodySchema,
	fileInternalPayloadSchema,
} from "../contracts/internal/file.internal";

export const fileAdapter = api.adapt.ermewa.file.post({
	body: {
		schema: fileInternalBodySchema,
		map: (input) => ({
			XDOC: {
				[input.documentCode]: {
					URL: input.url.split("//")[1] ?? input.url,
					XFILE: {
						[input.extension.toUpperCase()]: {
							LAN: {
								"": {
									URLDET: input.detailedUrl,
								},
							},
						},
					},
				},
			},
		}),
	},

	payload: {
		schema: fileInternalPayloadSchema,
		map: (legacy) => legacy,
	},
});
