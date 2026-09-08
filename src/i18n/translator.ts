import type { SupportedLocale } from "./locale";
import { toLocaleTag } from "./locale";
import type { TranslationKey } from "./messages";
import { localMessages } from "./messages";

export type XprmTranslationEntry = Readonly<{
	english?: string;
	french?: string;
	german?: string;
}>;

export type XprmTranslations = Readonly<
	Record<string, XprmTranslationEntry | undefined>
>;

export type TranslationParams = Readonly<
	Record<string, string | number>
>;

export type Translator = (
	key: TranslationKey,
	params?: TranslationParams,
) => string;

export type I18n = Readonly<{
	t: Translator;
	formatDate: (
		value: string | Date | undefined,
		options?: Intl.DateTimeFormatOptions,
	) => string;
}>;

const localeField: Record<SupportedLocale, keyof XprmTranslationEntry> =
	{
		en: "english",
		fr: "french",
		de: "german",
	};

/** Maps local UI keys onto the XPRM translation catalog (translationsKeyMap internals). */
const xprmKeyByTranslationKey: Partial<Record<TranslationKey, string>> =
	{
		viewerDate: "documentDate",
		viewerExpires: "documentExpiration",
		viewerZoomIn: "zoomInView",
		viewerZoomOut: "zoomOutView",
		viewerRotateClockwise: "rotateClockwise",
		viewerRotateAnticlockwise: "rotateAntiClockwise",
		emailFrom: "emailSender",
		emailTo: "emailRecipients",
		emailCc: "emailCopy",
		emailBcc: "emailBlindCopy",
		emailSubject: "emailSubject",
		emailMessage: "emailBody",
		emailBody: "emailBody",
		emailSend: "sendEmail",
		viewerCancel: "cancelAction",
		emailRejectSubmit: "rejectAction",
		statusNotApplicable: "statusNotApplicable",
		statusOngoing: "statusOngoing",
		statusPlanning: "statusPlanned",
		statusPending: "statusPending",
		statusRejected: "statusRejected",
		statusRemoved: "statusRemoved",
		displaySelectTitle: "folderSelectionDialog",
		displaySelectManualTitle: "manualFolderSelection",
		displaySelectFolderNumber: "folderNumber",
		createDocumentTitle: "addDocumentAction",
		actionSave: "saveDocument",
		actionUpload: "uploadDocument",
		actionDownload: "downloadDocument",
		actionEmail: "sendMail",
		actionCopy: "copyDocument",
		actionPaste: "pasteDocument",
		actionPending: "statusPending",
		actionValidate: "approveAction",
		actionReject: "rejectAction",
		actionRemove: "removeDocument",
		actionDelete: "deleteDocument",
	};

const interpolate = (
	template: string,
	params?: TranslationParams,
): string => {
	if (!params) {
		return template;
	}

	return template.replace(/\{(\w+)\}/g, (match, name: string) => {
		const value = params[name];
		return value === undefined ? match : String(value);
	});
};

const resolveMessage = (
	key: TranslationKey,
	locale: SupportedLocale,
	xprmTranslations: XprmTranslations | undefined,
): string => {
	const xprmKey = xprmKeyByTranslationKey[key];
	const xprmText = xprmKey
		? xprmTranslations?.[xprmKey]?.[localeField[locale]]
		: undefined;
	const xprm = xprmText?.trim();
	if (xprm) {
		return xprm;
	}

	return localMessages[locale][key] ?? localMessages.en[key] ?? key;
};

const statusKeywordsByKey: ReadonlyArray<
	readonly [readonly string[], TranslationKey]
> = [
	[
		["ongoing", "in work", "in progress", "en cours", "in arbeit"],
		"statusOngoing",
	],
	[
		["planned", "planning", "prévisionel", "prévisionnel", "geplant"],
		"statusPlanning",
	],
	[
		[
			"n/a",
			"na",
			"non applicable",
			"nicht anwendbar",
			"keine anwendung",
		],
		"statusNotApplicable",
	],
	[
		[
			"pending",
			"statuspending",
			"wait",
			"waiting",
			"en attente",
			"anhängig",
			"ausstehend",
		],
		"statusPending",
	],
	[
		[
			"validated",
			"validé",
			"validiert",
			"approved",
			"accepté",
			"genehmigt",
		],
		"statusValidated",
	],
	[["rejected", "rejeté", "abgelehnt"], "statusRejected"],
	[["removed", "supprimé", "gelöscht", "entfernt"], "statusRemoved"],
];

const normalizeStatusLabel = (label: string | undefined): string =>
	(label ?? "").trim().toLowerCase();

/** Maps a server-provided status label ("Pending"/... localized) onto a status translation key. */
export const statusLabelToKey = (
	label: string | undefined,
): TranslationKey => {
	const normalized = normalizeStatusLabel(label);
	if (!normalized) {
		return "statusUnknown";
	}

	for (const [keywords, key] of statusKeywordsByKey) {
		if (keywords.includes(normalized)) {
			return key;
		}
	}

	return "statusUnknown";
};

export const statusLabel = (
	label: string | undefined,
	i18n: I18n,
): string => i18n.t(statusLabelToKey(label));

export const createI18n = (
	locale: SupportedLocale,
	xprmTranslations?: XprmTranslations,
): I18n => {
	const t: Translator = (key, params) =>
		interpolate(resolveMessage(key, locale, xprmTranslations), params);

	const tag = toLocaleTag(locale);

	const formatDate = (
		value: string | Date | undefined,
		options?: Intl.DateTimeFormatOptions,
	): string => {
		if (!value) {
			return "";
		}

		const date = value instanceof Date ? value : new Date(value);
		if (Number.isNaN(date.getTime())) {
			return String(value);
		}

		try {
			return new Intl.DateTimeFormat(
				tag,
				options ?? { dateStyle: "short" },
			).format(date);
		} catch {
			return String(value);
		}
	};

	return { t, formatDate };
};
