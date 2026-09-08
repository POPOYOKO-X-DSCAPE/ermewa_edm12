import { api } from "@src/infrastructure/services/raw.api";

import { normalizeOptionalTransportDate } from "@src/core/type-utils";
import {
	documentUpdateInternalBodySchema,
	documentUpdateInternalPayloadSchema,
} from "../contracts/internal/document-update.internal";

const extractLineFromURL = (input: string) => {
	const match = input?.match(/\$LIG:(\d+)/);
	return match ? Number.parseInt(match[1], 10) : undefined;
};

const normalizeTransportBinary = (
	value: string | undefined,
): string | undefined => {
	const trimmed = value?.trim();
	if (!trimmed) {
		return undefined;
	}

	const normalized = (
		trimmed.split("base64,")[1] ??
		trimmed.split(",")[1] ??
		trimmed
	).trim();

	return normalized.length > 0 ? normalized : undefined;
};

export const documentUpdateAdapter =
	api.adapt.ermewa.documentUpdate.post({
		body: {
			schema: documentUpdateInternalBodySchema,
			map: (input) => ({
				$ClassName: "IerXEdm12Update",
				$ClassVer: "12.7",

				xUpdate: input.map(
					({
						documentCode,
						lastUpdateTime,
						url,
						name,
						status,
						documentDate,
						documentExpires,
						fileData,
						memo,
						master,
						natureCode,
					}) => {
						const docDate =
							normalizeOptionalTransportDate(documentDate);
						console.log(url);

						const line =
							extractLineFromURL(url) ||
							extractLineFromURL(fileData?.detailedUrl || "");
						const docExpire =
							normalizeOptionalTransportDate(documentExpires);
						const normalizedBinary = normalizeTransportBinary(
							fileData?.binary,
						);
						const normalizedExtension = fileData?.extension?.trim();
						const effectiveFileData =
							normalizedBinary && normalizedExtension
								? {
										binary: normalizedBinary,
										extension: normalizedExtension,
										encoding: fileData?.encoding ?? "base64",
										language: fileData?.language,
										detailedUrl: fileData?.detailedUrl || "",
										shortUrl: fileData?.shortUrl || "",
									}
								: undefined;

						return {
							$ClassName: "IerXEdmUpdate",
							$ClassVer: "12.7",

							XDOC: documentCode,
							UPDTIME: lastUpdateTime,

							line,
							Nature: natureCode,
							Mem: status === 3 ? memo : "",

							Master: {
								Obj: master.folderName,
								ObjID: master.sid,
								Format: effectiveFileData?.extension,
								Pub: effectiveFileData?.extension,
							},

							Name: {
								BaseName: name,
							},

							State: status?.toString(),
							...(docDate !== undefined && { DocDate: docDate }),
							...(docExpire !== undefined && {
								DocExpire: docExpire,
							}),

							...(effectiveFileData && {
								fileData: {
									[effectiveFileData.extension.toUpperCase()]: {
										LAN: {
											[effectiveFileData.language !== "default"
												? effectiveFileData.language?.toUpperCase() ||
													""
												: ""]: {
												data: effectiveFileData.binary,
												encode: effectiveFileData.encoding,
												URLDET: effectiveFileData.detailedUrl,
												URLSHO: effectiveFileData.shortUrl,
											},
										},
									},
								},
							}),
						};
					},
				),
			}),
		},

		payload: {
			schema: documentUpdateInternalPayloadSchema,
			map: (raw) => ({
				updated: raw.xRetUpdated.map(({ XDOC, xDocUpdated }) => ({
					baseName: xDocUpdated.BASENAME,
					documentCode: XDOC,
					activeCode: XDOC,
					documentDate: xDocUpdated.DOCDATE,
					documentExpires: xDocUpdated.DOCEXPIRE,
					etag: 0,
					natureCode: xDocUpdated.NATURE,
					state: xDocUpdated.STATE,
					updateStatusFlag: xDocUpdated.UPDSTAFLG,
					updateStatusMessage: xDocUpdated.UPDSTAMSG,
					lastUpdateTime: xDocUpdated.UPDTIME,
					user: xDocUpdated.USER,

					files: xDocUpdated.XDOAFILEDATA?.map((file) => ({
						uuid: file.$uuid ?? "",
						language: file.CODLAN ?? "",
						fileType: file.DOCTYP ?? file.CODTYP ?? "",
						shortUrl: file.URLSHO ?? file.URLDET ?? "",
						linkState: file.STATELNK,
						sid: file.SID,
						objectHybrid: file.OBJHYB,
					})),

					links: xDocUpdated.XDOAOBJLINK?.map((link) => ({
						uuid: link.$uuid ?? "",
						objectHybrid: link.OBJHYB ?? "",
						sid: link.SID ?? "",
						linkState: link.STATELNK ?? 0,
					})),
				})),
			}),
		},
	});
