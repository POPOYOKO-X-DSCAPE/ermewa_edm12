export const documentStatusNumberByKey = {
	pending: 1,
	validated: 2,
	rejected: 3,
	removed: 4,
} as const;

export type DocumentStatusNumber =
	(typeof documentStatusNumberByKey)[keyof typeof documentStatusNumberByKey];

export type DocumentStatusKey =
	| keyof typeof documentStatusNumberByKey
	| "unknown";

export const isKnownDocumentStatusNumber = (
	value: number | undefined,
): value is DocumentStatusNumber =>
	value === documentStatusNumberByKey.pending ||
	value === documentStatusNumberByKey.validated ||
	value === documentStatusNumberByKey.rejected ||
	value === documentStatusNumberByKey.removed;

export const toDocumentStatusKey = (
	statusNumber?: number,
): DocumentStatusKey => {
	if (!isKnownDocumentStatusNumber(statusNumber)) {
		return "unknown";
	}

	switch (statusNumber) {
		case documentStatusNumberByKey.pending:
			return "pending";
		case documentStatusNumberByKey.validated:
			return "validated";
		case documentStatusNumberByKey.rejected:
			return "rejected";
		case documentStatusNumberByKey.removed:
			return "removed";
	}
};
