// DATES

const YYYY_MM_DD_RE = /^\d{4}-\d{2}-\d{2}$/;
export const EMPTY_LEGACY_DATE_RE = /^\s*-\s*-\s*$/;

export const normalizeOptionalTransportDate = (
	value?: string,
): string | undefined => {
	if (value === undefined) return undefined;

	const trimmed = value.trim();

	if (trimmed.length === 0 || EMPTY_LEGACY_DATE_RE.test(trimmed)) {
		return undefined;
	}

	return trimmed;
};

export const isErmiDate = (value: string): boolean => {
	const normalized = value.trim();

	if (!YYYY_MM_DD_RE.test(normalized)) return false;

	const [year, month, day] = normalized.split("-").map(Number);
	const probe = new Date(Date.UTC(year, month - 1, day));

	return (
		probe.getUTCFullYear() === year &&
		probe.getUTCMonth() === month - 1 &&
		probe.getUTCDate() === day
	);
};

export const isErmiDateOrEmpty = (value: string): boolean => {
	const normalized = value.trim();

	return (
		normalized.length === 0 ||
		EMPTY_LEGACY_DATE_RE.test(normalized) ||
		isErmiDate(normalized)
	);
};
