import { createStore } from "@src/core/domain.builders";

export const appStore = createStore(
	"appStore",
	({ optional, array }) => ({
		currentNavigation: optional({
			documentCode: "string",
			natureCode: "string",
			folder: {
				name: "string",
				sid: "string",
			},
		}),

		folderTreeStructure: optional("object"),

		selectedDocument: optional("string"),

		createDocumentDialog: optional({
			folderSid: "string",
			natureCode: "string",
		}),

		expandedFolderSids: array("string"),
		loadedFolders: array("string"),
		loadingFolders: array("string"),
		appProfile: optional("object"),
		xprmRaw: optional("object"),
		xtreeRaw: optional("object"),

		displaySelectItems: array({
			id: "string",
			etag: "string",
			requestNumber: "string",
			requestOrder: "number",
			requestStatus: "string",
			bpsNumber: "string",
			establishmentNumber: "string",
			yme06: "string",
			workshopCode: "string",
			machineNumber: "string",
			cophid: "string",
			wysa01: "string",
			requestInitialDate: "string",
			beginDate: "string",
			endDate: "string",
			requestCloseDate: "string",
			requestRoot: {
				code: "string",
				label: "string",
			},
			requestFather: {
				code: "string",
				label: "string",
			},
			requestType: {
				code: "string",
				label: "string",
				description: "string",
			},
			contractRevision: {
				code: "string",
				label: "string",
			},
		}),
		displaySelectLoading: "boolean",
		displaySelectLoaded: "boolean",
		displaySelectError: optional("string"),

		filters: optional({
			mandatoryOnly: "boolean",
			statuses: array("number"),
		}),
	}),
)(	{
	currentNavigation: undefined,
	folderTreeStructure: undefined,
	selectedDocument: undefined,
	createDocumentDialog: undefined,
	expandedFolderSids: [],
	loadedFolders: [],
	loadingFolders: [],
	appProfile: undefined,
	xprmRaw: undefined,
	xtreeRaw: undefined,
	displaySelectItems: [],
	displaySelectLoading: false,
	displaySelectLoaded: false,
	displaySelectError: undefined,
	filters: {
		mandatoryOnly: false,
		statuses: [],
	},
});
