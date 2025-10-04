import { createEnvironment } from "@packages/free";

const {
	VITE_API_HOST,
	VITE_API_PATH_NAME,
	VITE_ENABLE_OFFLINE_SERVICES,
	VITE_OFFLINE_API_PORT,
} = import.meta.env;

let baseUrl: string;
let pathName = "";

const isOfflineMode = VITE_ENABLE_OFFLINE_SERVICES;
const offlinePort = VITE_OFFLINE_API_PORT;

switch (import.meta.env.MODE) {
	case "development": {
		const url = window.location.href;
		const rootFolderName = url.split("/")[3];
		const rootFolderSid = url.split("/")[4];

		baseUrl = isOfflineMode
			? `http://localhost:${offlinePort}`
			: VITE_API_HOST;
		pathName = `${VITE_API_PATH_NAME}/${rootFolderName}/${rootFolderSid}`;

		console.log(isOfflineMode);

		break;
	}
	case "production":
		baseUrl = window.location.origin + window.location.pathname;
		break;
	default:
		baseUrl = window.location.origin + window.location.pathname;
		break;
}

const { createServices } = createEnvironment({
	credentials: {
		username: "mzeghdoudi",
		password: "Paris2024",
	},
	token: "",
});

const services = createServices(
	{
		dummy: {
			baseUrl,
			endpoints: {
				auth: {
					methods: ["GET"],
					path: "/api/dummy/v1/request?param=noparam",
					config: ({ credentials: { username, password } }) => {
						return {
							headers: {
								"Content-Type": "application/json",
								Authorization: `Basic ${btoa(`${username}:${password}`)}`,
							},
						};
					},
				},
			},
		},
		ermewa: {
			baseUrl,
			endpoints: {
				appProfile: {
					path: `${pathName}?request=XPRM`,
					methods: ["GET"],
				},
				displaySelect: {
					path: `${pathName}?request=XSEL`,
					methods: ["GET"],
				},
				natures: {
					path: `${pathName}?request=XNAT&OBJ=:object`,
					methods: ["GET"],
				},
				naturesMasks: {
					path: `${pathName}?request=XOHN&OBJ=:object&SID=:sid`,
					methods: ["GET"],
				},
				folderTree: {
					path: `${pathName}?request=XTREE`,
					methods: ["GET"],
				},
				document: {
					path: `${pathName}?request=XDOC&XDC=:documentId`,
					methods: ["GET"],
				},
				documentUpdate: {
					path: `${pathName}?request=XUPD` /*&XDC=:documentId`*/,
					methods: ["POST"],
				},
				documentDelete: {
					path: `${pathName}?request=XRMV&XDC=:documentCode`,
					methods: ["POST"],
				},
				file: {
					path: `${pathName}?request=XFILE&XDC=:documentCode&EXT=:extension`,
					methods: ["GET", "POST"],
				},
				upload: {
					path: `${pathName}?request=XUPL`,
					methods: ["POST"],
				},
				sendMail: {
					path: `${pathName}?request=XMAIL`,
					methods: ["POST"],
				},
				rejectEmailInfo: {
					path: `${pathName}?request=XRML&XDC=:documentCode`,
					methods: ["GET"],
				},
			},
		},
	},
	{
		headers: {
			"Content-Type": "application/json",
		},
		credentials: isOfflineMode ? "omit" : "include",
	},
);

export default services;
