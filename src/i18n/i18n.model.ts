import { createModels } from "@src/core/presentation.builder";
import {
	type I18n,
	type XprmTranslationEntry,
	createI18n,
} from "@src/i18n/translator";
import { type SupportedLocale, resolveSupportedLocale } from "./locale";

type AppProfileShape = {
	translations?: Readonly<
		Record<string, XprmTranslationEntry | undefined>
	>;
	user?: {
		languages?: readonly string[];
		defaultLanguage?: string;
	};
};

const readAppProfile = (
	appProfile: unknown,
): AppProfileShape | undefined =>
	appProfile === null || typeof appProfile !== "object"
		? undefined
		: (appProfile as AppProfileShape);

const resolveLocaleShape = (
	appProfile: AppProfileShape | undefined,
): Readonly<{
	locale: SupportedLocale;
	xprmTranslations: AppProfileShape["translations"];
}> => {
	const defaultLanguage = appProfile?.user?.defaultLanguage;
	const firstLanguage = appProfile?.user?.languages?.[0];

	const locale =
		resolveSupportedLocale(defaultLanguage) ??
		resolveSupportedLocale(firstLanguage) ??
		"en";

	return { locale, xprmTranslations: appProfile?.translations };
};

export const i18nModel = createModels(({ stores }) => ({
	i18n: (): I18n => {
		const shape = resolveLocaleShape(
			readAppProfile(stores.appStore.state.appProfile),
		);

		return createI18n(shape.locale, shape.xprmTranslations);
	},
}));
