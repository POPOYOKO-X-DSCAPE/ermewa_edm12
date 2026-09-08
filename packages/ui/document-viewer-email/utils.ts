export const normalizeEmailValue = (
	value: string | undefined,
): string => value?.trim() ?? "";

export const normalizeMetaName = (value: string | undefined): string =>
	value?.trim() ?? "";

export const normalizeOptionalMemo = (
	value: string | undefined,
): string | undefined => {
	const trimmed = value?.trim();
	return trimmed ? trimmed : undefined;
};
