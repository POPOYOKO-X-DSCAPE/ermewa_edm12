export const PRM_LABELS = {
	TITLE: "title",
	MODE: "mode",
	DEFUPLSTA: "defaultUploadStatus",
	MNG_DOC: "documentManagement",
	FORMATS: "supportedFormats",
	AUTOPUB: "autoPublishEnabled",
	MNG_LINK: "linkManagementMode",
	FLT_LINK: "linkFilteringMode",
	DSP_NATURES: "displayedNatures",
	DSP_STATUS: "displayedStatuses",
	DSP_LINK: "displayedLinks",
	DOCWOCTL: "uncontrolledDocumentStatus",
	MNG_FILE: "fileManagement",
	MNG_SUP: "supervisionManagement",
	DSPSEL: "displaySelectionLayout",
} as const;

export const MSG_LABELS = {
	MNR: "maintenanceAndRepair",
	REMOVE: "removeDocument",
	UPLOAD: "uploadDocument",
	SAVE: "saveDocument",
	UPLOAD_IT_TO_SAVE_IT: "uploadToSave",
	MERGE_UPLOAD: "mergeAndUploadDocument",
	MERGE_SAVE: "mergeAndSaveDocument",
	PENDING: "statusPending",
	CANCEL: "cancelAction",
	REJECT: "rejectAction",
	APPROVE: "approveAction",
	ZOOM_IN: "zoomInView",
	ZOOM_OUT: "zoomOutView",
	DELETE: "deleteDocument",
	COPY: "copyDocument",
	PASTE: "pasteDocument",
	DOWNLOAD: "downloadDocument",
	MAIL: "sendMail",
	BASE_NAME: "documentBaseName",
	DATE: "documentDate",
	EXPIRE: "documentExpiration",
	FOLDER_SELECTION: "folderSelectionDialog",
	ADD_FILE: "addFileAction",
	ADD_DOC: "addDocumentAction",
	RELOAD: "reloadView",
	UNFOLD: "unfoldSection",
	FOLD: "foldSection",
	MORE_OPTIONS: "moreOptionsMenu",
	EDIT_DOC: "editDocument",
	NEW_DOC: "newDocument",
	LOCAL_DOC: "unregisteredDocument",
	MONO_DOC: "singleDocument",
	MULTI_DOC: "multipleDocuments",
	FOLDER: "documentFolder",
	APPROVED: "statusApproved",
	REJECTED: "statusRejected",
	REMOVED: "statusRemoved",
	SENT: "statusSent",
	EMAIL_FORM: "emailFormDialog",
	EMAIL_FROM: "emailSender",
	EMAIL_TO: "emailRecipients",
	EMAIL_CC: "emailCopy",
	EMAIL_BCC: "emailBlindCopy",
	EMAIL_OBJECT: "emailSubject",
	EMAIL_BODY: "emailBody",
	EMAIL_SEND: "sendEmail",
	EMAIL_CANCEL: "cancelEmail",
	PAGES: "documentPages",
	MANDATORY: "mandatoryField",
	MANUAL_FOLDER_SELECTION: "manualFolderSelection",
	FOLDER_NUMBER: "folderNumber",
	LOAD: "loadDocument",
	SHOW_ALL: "showAllDocuments",
	ROTATION_CLOCKWISE: "rotateClockwise",
	ROTATION_ANTICLOCKWISE: "rotateCounterClockwise",
	FLD_O: "statusOngoing",
	FLD_P: "statusPlanned",
	FLD_NA: "statusNotApplicable",
} as const;

export type AppProfileBodyResponse = {
	$ClassName: string;
	$ClassVer: string;
	$uid: string;
	$stamp: string;
	headers: {
		login: string;
		uPid: string;
		xEdm: string;
		xPrf: string;
	};
	APP: {
		ANAME: {
			ENG: string;
			FRA: string;
			GER?: string;
			"": string;
		};
		ASID: string;
		AVER: string;
	};
	PRF: {
		PNAME: {
			ENG: string;
			FRA: string;
			GER?: string;
			"": string;
		};
		PPID: string;
		PSID: string;
		PRM: {
			[parameterName in keyof typeof PRM_LABELS]: {
				PRM: string | number | boolean;
				TYP: string;
				VAL: Record<string, unknown>;
			};
		};
	};
	MSG: {
		[msgLabel in keyof typeof MSG_LABELS]: {
			LAN: Partial<{
				ENG: string;
				FRA: string;
				GER: string;
			}>;
			MSGSID?: string;
			MSGFOR?: string;
			MSGNUM?: number;
			REM?: string;
		};
	};
	USER: {
		APP: {
			[appId: string]: {
				PRF: {
					[profileId: string]: Record<string, unknown>;
				};
			};
		};
		UID: string;
		UNAME: string;
		UMAIL: string;
		LAN: ("FRA" | "ENG" | "GER")[];
		LANDEF?: "FRA" | "ENG" | "GER";
	};
};

export type AppProfileResponse = {
	json(): Promise<AppProfileBodyResponse>;
} & Response;

export type DisplaySelectParameter = {
	dspQuery: {
		content: {
			layout: {
				title: {
					alias: string;
					defaultTxt: string;
				};
				category: string;
				items: {
					category: string;
					layout: {
						header: {
							defaultTxt: string;
							alias: string;
							linkto: string;
						}[];
						items: {
							category: string;
							bind: {
								rem: string;
								field: string;
								group?: string;
								format?: string;
								actions?: {
									action: string;
									parameters: {
										key: string;
									};
								}[];
							}[];
						}[];
					};
				}[];
			};
		};
	};
};
