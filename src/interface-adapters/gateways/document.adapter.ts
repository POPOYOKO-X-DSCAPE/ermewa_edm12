import { api } from "@src/infrastructure/services/raw.api";
import { documentInternalSchema } from "../contracts/internal/document.internal";

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

const unwrapXdocResponse = (raw: Record<string, unknown>): Record<string, unknown> => {
	if ("COD" in raw) return raw;

	for (const value of Object.values(raw)) {
		if (typeof value === "object" && value !== null && "COD" in value) {
			return value as Record<string, unknown>;
		}
	}

	return raw;
};

const isEmptyObject = (v: unknown): boolean =>
	typeof v === "object" && v !== null && Object.keys(v as Record<string, unknown>).length === 0;

export const documentAdapter = api.adapt.ermewa.document.get(
	documentInternalSchema,
	(raw, rawPayload?) => {
		const doc = isEmptyObject(raw)
			? (unwrapXdocResponse((rawPayload ?? raw) as Record<string, unknown>) as typeof raw)
			: raw;

		type RawFileType = Extract<
			keyof NonNullable<typeof doc.XFILE>,
			string
		>;

		const [fileType] = Object.keys(doc.XFILE ?? {}) as RawFileType[];
		const fileEntry = fileType ? doc.XFILE?.[fileType] : undefined;
		const lane =
			fileEntry?.LAN?.[""] ?? Object.values(fileEntry?.LAN ?? {})[0];

		return {
			code: doc.COD,
			nature: doc.NAT,

			lastTimeUpdated: doc.UPDTIME,
			date: doc.DOCDATE,
			expirationDate: doc.DOCEXPIRE,

			link: doc.LINK
				? {
						state: doc.LINK.STATE,
						stateDescription: {
							english: doc.LINK.STATEDES.ENG,
							french: doc.LINK.STATEDES.FRA,
							german: doc.LINK.STATEDES.GER,
						},
					}
				: undefined,

			memo: doc.MEM,
			isMaster: doc.MASTER,

			name: {
				baseName: doc.NAME.BASENAME,
				documentName: {
					english: doc.NAME.DOCNAME.ENG,
					french: doc.NAME.DOCNAME.FRA,
					german: doc.NAME.DOCNAME.GER,
				},
			},

			state: doc.STATE,

			stateDescription: {
				english: doc.STATEDES.ENG,
				french: doc.STATEDES.FRA,
				german: doc.STATEDES.GER,
			},

			url: doc.URL,

			file: {
				lang: "",
				type: toFileType(fileType),
				detailedUrl: lane?.URLDET,
				shortUrl: lane?.URLSHO,
			},

			isLocal: false,
		} satisfies typeof documentInternalSchema.infer;
	},
);
