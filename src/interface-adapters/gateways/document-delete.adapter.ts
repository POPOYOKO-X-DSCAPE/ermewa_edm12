import { api } from "@src/infrastructure/services/raw.api";
import {
	documentDeleteInternalBodySchema,
	documentDeleteInternalPayloadSchema,
} from "../contracts/internal/document-delete.internal";

export const documentDeleteAdapter =
	api.adapt.ermewa.documentDelete.post({
		body: {
			schema: documentDeleteInternalBodySchema,
			map: (input) => ({
				XDOC: {
					[input.documentCode]: {
						COD: input.documentCode,
						STATE: input.state,
						URL: input.url,
					},
				},
				XFILE: {
					[input.fileExtension.toUpperCase()]: {
						LAN: {
							[input.language.toUpperCase()]: {
								URLFUL: input.fullUrl,
								URLSHO: input.shortUrl,
							},
						},
					},
				},
			}),
		},
		payload: {
			schema: documentDeleteInternalPayloadSchema,
			map: (legacy) => legacy,
		},
	});
