import { apiFactory } from "@packages/free/core/runtime/api.factory";
import {
	appProfileExternalSchema as appProfilePayload,
	displaySelectExternalPayloadSchema as displaySelectPayload,
	documentDeleteExternalBodySchema as documentDeleteBody,
	documentDeleteExternalPayloadSchema as documentDeletePayload,
	documentExternalSchema as documentPayload,
	documentUpdateExternalBodySchema as documentUpdateBody,
	documentUpdateExternalPayloadSchema as documentUpdatePayload,
	documentUploadExternalBodySchema as documentUploadBody,
	documentUploadExternalPayloadSchema as documentUploadPayload,
	fileExternalBodySchema as fileBodySchema,
	folderTreeExternalPayloadSchema as folderTreePayload,
	naturesMasksExternalPayloadSchema as naturesMasksPayload,
	naturesExternalPayloadSchema as naturesPayload,
	rejectEmailInfoExternalPayloadSchema as rejectEmailInfoPayload,
	sendMailExternalBodySchema as sendMailBodySchema,
	sendMailExternalPayloadSchema as sendMailPayloadSchema,
} from "@src/interface-adapters/contracts/external/";

const {
	VITE_API_HOST,
	VITE_API_PATH_NAME,
	VITE_ENABLE_OFFLINE_SERVICES,
	VITE_OFFLINE_API_PORT,
	VITE_IS_LOCAL,
} = import.meta.env;

const isOfflineMode = VITE_ENABLE_OFFLINE_SERVICES === "true";
const offlinePort = VITE_OFFLINE_API_PORT;

let baseUrl: string;
let pathName = "";

switch (import.meta.env.MODE) {
	case "development": {
		const segments = new URL(window.location.href).pathname
			.split("/")
			.filter(Boolean);

		const rootFolderName = segments[0];
		const rootFolderSid = segments[1];

		baseUrl = isOfflineMode
			? VITE_IS_LOCAL === "true"
				? `http://localhost:${offlinePort}`
				: `${window.location.origin}/api`
			: VITE_API_HOST;
		pathName =
			rootFolderName && rootFolderSid
				? `${VITE_API_PATH_NAME}/${rootFolderName}/${rootFolderSid}`
				: VITE_API_PATH_NAME;
		break;
	}
	case "production":
		baseUrl = window.location.origin + window.location.pathname;
		break;
}

// legacy Basic dummy credentials
const credentials = {
	username: "mzeghdoudi",
	password: "Paris2024",
};

export const api = apiFactory(
	{
		fetch: globalThis.fetch,
		defaults: {
			credentials: isOfflineMode ? "omit" : "include",
		},
	},
	({ http: { base, json, blob } }) => {
		const basic = `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`;

		return {
			dummy: base(baseUrl).endpoints({
				auth: {
					path: "/api/dummy/v1/request",
					query: "param=noparam",
					get: {
						payload: json<unknown>,
						headers: { Authorization: basic },
					},
				},
			}),

			ermewa: base(baseUrl)
				.prefix(pathName)
				.endpoints({
					appProfile: {
						query: "request=XPRM",
						get: {
							payload: json(appProfilePayload),
						},
					},

					displaySelect: {
						query: "request=XSEL",
						get: { payload: json(displaySelectPayload) },
					},

					natures: {
						query: "request=XNAT&OBJ=:object",
						get: { payload: json(naturesPayload) },
					},

					naturesMasks: {
						query: "request=XOHN&OBJ=:object&SID=:sid",
						get: { payload: json(naturesMasksPayload) },
					},

					folderTree: {
						query: "request=XTREE",
						get: {
							payload: json(folderTreePayload),
						},
					},

					document: {
						query: "request=XDOC&XDC=:documentCode",
						get: { payload: json(documentPayload) },
					},

					documentUpdate: {
						query: "request=XUPD",
						post: {
							body: json(documentUpdateBody),
							payload: json(documentUpdatePayload),
						},
					},

					documentDelete: {
						query: "request=XRMV&XDC=:documentCode",
						post: {
							body: json(documentDeleteBody),
							payload: json(documentDeletePayload),
						},
					},

					file: {
						query: "request=XFILE&XDC=:documentCode&EXT=:extension",
						post: { payload: blob, body: json(fileBodySchema) },
					},

					upload: {
						query: "request=XUPL",
						post: {
							body: json(documentUploadBody),
							payload: json(documentUploadPayload),
						},
					},

					sendMail: {
						query: "request=XMAIL",
						post: {
							body: json(sendMailBodySchema),
							payload: json(sendMailPayloadSchema),
						},
					},

					rejectEmailInfo: {
						query: "request=XRML&XDC=:documentCode",
						get: {
							payload: json(rejectEmailInfoPayload),
						},
					},
				}),
		};
	},
);
