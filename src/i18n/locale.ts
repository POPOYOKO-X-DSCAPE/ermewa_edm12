export type SupportedLocale = "en" | "fr" | "de";

export const SUPPORTED_LOCALES: readonly SupportedLocale[] = [
	"en",
	"fr",
	"de",
];

const localeByProfileLanguage = {
	english: "en",
	french: "fr",
	german: "de",
} as const;

const normalizedLocaleByProfileLanguage = {
	eng: "en",
	en: "en",
	fra: "fr",
	fr: "fr",
	ger: "de",
	de: "de",
} as const;

const localeTagBySupportedLocale: Record<SupportedLocale, string> = {
	en: "en-US",
	fr: "fr-FR",
	de: "de-DE",
};

export const toLocaleTag = (locale: SupportedLocale): string =>
	localeTagBySupportedLocale[locale];

/** Normalizes a profile/user language (full name, BCP-47 tag or XPRM code) to a supported locale. */
export const resolveSupportedLocale = (
	language: string | undefined,
): SupportedLocale | undefined => {
	const value = language?.trim().toLowerCase();
	if (!value) {
		return undefined;
	}

	if (value in localeByProfileLanguage) {
		return localeByProfileLanguage[
			value as keyof typeof localeByProfileLanguage
		];
	}

	const candidate =
		normalizedLocaleByProfileLanguage[
			value as keyof typeof normalizedLocaleByProfileLanguage
		];
	if (candidate) {
		return candidate;
	}

	const tag = value.split("-")[0];
	const byTag =
		normalizedLocaleByProfileLanguage[
			tag as keyof typeof normalizedLocaleByProfileLanguage
		];
	return byTag ?? undefined;
};
