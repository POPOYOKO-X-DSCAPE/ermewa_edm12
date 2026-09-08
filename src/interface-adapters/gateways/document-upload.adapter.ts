import { api } from "@src/infrastructure/services/raw.api";

import { EMPTY_LEGACY_DATE_RE } from "@src/core/type-utils";
import {
	documentUploadInternalBodySchema,
	documentUploadInternalPayloadSchema,
} from "../contracts/internal/document-upload.internal";

const toLegacyLanguage = (language?: string): string => {
	switch (language?.toLowerCase()) {
		case "english":
		case "eng":
			return "ENG";

		case "french":
		case "fra":
			return "FRA";

		case "german":
		case "ger":
			return "GER";

		default:
			return "";
	}
};

const normalizeRequiredTransportDate = (value: string): string =>
	value.trim();

const normalizeOptionalTransportDate = (
	value?: string,
): string | undefined => {
	if (value === undefined) return undefined;

	const trimmed = value.trim();

	if (trimmed.length === 0 || EMPTY_LEGACY_DATE_RE.test(trimmed)) {
		return undefined;
	}

	return trimmed;
};

const normalizeOptionalString = (
	value?: string,
): string | undefined => {
	const trimmed = value?.trim();
	return trimmed ? trimmed : undefined;
};

const normalizeOptionalLowercaseString = (
	value?: string,
): string | undefined => normalizeOptionalString(value)?.toLowerCase();

export const documentUploadAdapter = api.adapt.ermewa.upload.post({
	body: {
		schema: documentUploadInternalBodySchema,
		map: (input) => {
			const documentDate = normalizeRequiredTransportDate(
				input.documentDate,
			);
			const expirationDate = normalizeOptionalTransportDate(
				input.expirationDate,
			);

			return {
				$ClassName: "IerXEdmUpload",
				$ClassVer: "12.7",

				xEdmDoc: {
					$ClassName: "IerXEdmDoc",
					$ClassVer: "12.7",

					DocDate: documentDate,
					DocExpire: expirationDate ?? "",
					line: input.lineNumber,
					Nature: input.natureCode,
					State: input.status,

					Name: {
						BaseName: input.documentName.baseName,
						DocName: {
							"":
								input.documentName.name ||
								input.documentName.baseName ||
								"",
						},
					},

					Master: {
						Format: input.master.format || "undefined",
						Pub:
							input.master.publication ||
							input.master.format ||
							"undefined",
						Lan: toLegacyLanguage(input.master.language),
						Obj: input.master.object || "MNR",
						ObjID: input.master.objectSid,
					},

					objLink: {},

					fileData: {
						[input.master.format || "undefined"]: {
							LAN: {
								"": {
									data:
										input.content.split("base64,")[1] ?? input.content,
									encode: "base64",
								},
							},
						},
					},
				},
			};
		},
	},

	payload: {
		schema: documentUploadInternalPayloadSchema,
		map: (legacy) => ({
			uploaded: (legacy.xRetUploaded ?? []).map((entry) => {
				const uploaded = entry.xDocUploaded;
				const file = uploaded?.XDOAFILEDATA?.[0];

				return {
					documentCode: uploaded?.XDOC ?? entry.XDOC,
					ok: uploaded?.UPDSTAFLG === 0,
					message: normalizeOptionalString(uploaded?.UPDSTAMSG),
					lastUpdateTime: uploaded?.UPDTIME ?? "",
					baseName: uploaded?.BASENAME ?? "",
					natureCode: uploaded?.NATURE ?? "",
					status: uploaded?.STATE ?? 0,
					documentDate: normalizeOptionalString(uploaded?.DOCDATE),
					file: file
						? {
								shortUrl: normalizeOptionalString(file.URLSHO),
								detailedUrl: normalizeOptionalString(file.URLDET),
								fileType: normalizeOptionalLowercaseString(file.CODTYP),
								language: normalizeOptionalLowercaseString(file.CODLAN),
							}
						: undefined,
				};
			}),
		}),
	},
});
