import { api } from "@src/infrastructure/services/raw.api";

import { naturesMasksInternalSchema } from "../contracts/internal/natures-masks.internal";

const allowedFileTypes = [
	"json",
	"unknown",
	"pdf",
	"jpg",
	"jpeg",
	"mpeg",
	"svg",
	"mp4",
	"txt",
	"xml",
	"msg",
] as const;

type FileType = (typeof allowedFileTypes)[number];

const toFileType = (value: string | undefined): FileType =>
	allowedFileTypes.includes((value ?? "").toLowerCase() as FileType)
		? ((value ?? "").toLowerCase() as FileType)
		: "unknown";

export const naturesMasksAdapter = api.adapt.ermewa.naturesMasks.get(
	naturesMasksInternalSchema,
	(raw) => {
		const result: typeof naturesMasksInternalSchema.infer = {};

		for (const key in raw.xOHN) {
			const entry = raw.xOHN[key];

			const documents = Object.values(entry.XDOC).map((doc) => {
				const fileType = Object.keys(doc.XFILE)[0];
				const fileEntry = Object.values(doc.XFILE)[0];

				return {
					documentCode: doc.COD,
					lastTimeUpdated: doc.UPDTIME,

					documentDate: doc.DOCDATE,
					documentExpires: doc.DOCEXPIRE,

					link: {
						state: doc.LINK.STATE,
						stateDescription: {
							french: doc.LINK.STATEDES.FRA,
							english: doc.LINK.STATEDES.ENG,
							german: doc.LINK.STATEDES.GER,
						},
					},

					isMaster: doc.MASTER,
					url: doc.URL,
					memo: doc.MEM,

					name: {
						baseName: doc.NAME.BASENAME,
						documentName: {
							french: doc.NAME.DOCNAME.FRA || "none",
							english: doc.NAME.DOCNAME.ENG || "none",
							german: doc.NAME.DOCNAME.GER || "none",
						},
					},

					state: doc.STATE,

					stateDescription: {
						french: doc.STATEDES.FRA,
						english: doc.STATEDES.ENG,
						german: doc.STATEDES.GER,
					},

					file: {
						lang: "",
						type: toFileType(fileType),
						detailedUrl: fileEntry?.LAN[""]?.URLDET,
						shortUrl: fileEntry?.LAN[""]?.URLSHO,
					},

					isLocal: false,
				};
			});

			result[key] = {
				sid: raw.headers.xSid,

				code: entry.COD,

				headers: {
					error: {
						code: entry.HEADERS.ERROR.COD,
						message: entry.HEADERS.ERROR.MSG,
					},

					lockCode: entry.HEADERS.LCKCOD,
					isMaster: entry.HEADERS.MASTER,

					type: entry.HEADERS.TYPE,
					typeDescription: entry.HEADERS.TYPEDES,
				},

				documents: documents.filter((d) => d.state !== 4),
			};
		}

		return result;
	},
);
