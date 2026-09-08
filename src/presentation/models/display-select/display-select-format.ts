const localeByLanguage = {
	english: "en-US",
	french: "fr-FR",
	german: "de-DE",
} as const;

const resolveLocale = (locale?: string): string => {
	if (!locale) {
		return "en-US";
	}

	return localeByLanguage[
		locale.toLowerCase() as keyof typeof localeByLanguage
	] ?? locale;
};

const formatMaskedValue = (
	value: string,
	format: string,
): string | undefined => {
	if (!/[#0]/.test(format)) {
		return undefined;
	}

	const characters = Array.from(value.replace(/\s+/g, ""));
	let index = 0;
	let result = "";

	for (const character of format) {
		if (character !== "#" && character !== "0") {
			result += character;
			continue;
		}

		const next = characters[index];
		if (next === undefined) {
			if (character === "0") {
				return undefined;
			}
			continue;
		}

		result += next;
		index += 1;
	}

	if (index < characters.length) {
		result += characters.slice(index).join("");
	}

	return result;
};

export const formatDisplaySelectValue = (
	value: string | number,
	format?: string,
	locale?: string,
): string => {
	const text = String(value);
	const normalizedFormat = format?.trim().toLowerCase();

	if (!normalizedFormat) {
		return text;
	}

	try {
		switch (normalizedFormat) {
			case "trim":
				return text.trim();
			case "upper":
			case "uppercase":
				return text.toLocaleUpperCase(resolveLocale(locale));
			case "lower":
			case "lowercase":
				return text.toLocaleLowerCase(resolveLocale(locale));
			case "integer": {
				const number = Number(value);
				return Number.isFinite(number)
					? new Intl.NumberFormat(resolveLocale(locale), {
							maximumFractionDigits: 0,
						}).format(number)
					: text;
			}
			case "number": {
				const number = Number(value);
				return Number.isFinite(number)
					? new Intl.NumberFormat(resolveLocale(locale)).format(number)
					: text;
			}
			case "date": {
				const date = new Date(text);
				return Number.isNaN(date.getTime())
					? text
					: new Intl.DateTimeFormat(resolveLocale(locale)).format(date);
			}
			case "datetime":
			case "date-time": {
				const date = new Date(text);
				return Number.isNaN(date.getTime())
					? text
					: new Intl.DateTimeFormat(resolveLocale(locale), {
							dateStyle: "short",
							timeStyle: "short",
						}).format(date);
			}
		}

		return formatMaskedValue(text, format?.trim() ?? "") ?? text;
	} catch {
		return text;
	}
};
