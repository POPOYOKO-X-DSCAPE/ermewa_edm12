import { i18nModel } from "@src/i18n/i18n.model";
import type { TranslationKey } from "@src/i18n/messages";
import type { I18n } from "@src/i18n/translator";

export type { SupportedLocale } from "./locale";
export type { TranslationKey } from "./messages";
export type {
	I18n,
	TranslationParams,
	Translator,
	XprmTranslations,
	XprmTranslationEntry,
} from "./translator";
export { resolveSupportedLocale, toLocaleTag } from "./locale";
export {
	createI18n,
	statusLabel,
	statusLabelToKey,
} from "./translator";

const liveI18n = () => i18nModel.i18n;

/**
 * Live facade over the reactive i18n model. Every access delegates to
 * `i18nModel.i18n`, so it always reflects the current app profile (locale +
 * XPRM translations) without a stale import-time snapshot. Reading a member
 * outside a model computation is not tracked and re-reads the (cached) model
 * value once per access, which is safe in plain components and handlers.
 */
export const translations: I18n = new Proxy({} as I18n, {
	get: (_target, prop) =>
		(liveI18n() as unknown as Record<PropertyKey, unknown>)[prop],
});

export const t: I18n["t"] = (key: TranslationKey, params) =>
	liveI18n().t(key, params);

export const formatDate: I18n["formatDate"] = (value, options) =>
	liveI18n().formatDate(value, options);
