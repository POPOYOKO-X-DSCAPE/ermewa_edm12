export type EditorActionShape = Readonly<{
	id: string;
	label: string;
	hidden: boolean;
	disabled: boolean;
}>;

export type EditorPreviewShape = Readonly<{
	url: string;
	source: string;
}>;

export type EditorBinaryShape = Readonly<{
	url: string;
	shortUrl?: string;
	detailedUrl?: string;
	name: string;
	size: number;
	type: string;
	base64?: string;
}>;

export type EditorDraftShape = Readonly<{
	name?: string;
	fileType?: string;
	statusNumber?: number;
	statusLabel?: string;
	documentDate?: string;
	expirationDate?: string;
	memo?: string;
	preview?: EditorPreviewShape;
	binary?: EditorBinaryShape;
}>;

export type EditorLike = Readonly<{
	documentId?: string;
	documentCode?: string;
	natureId?: string;
	natureCode?: string;
	folderId?: string;
	folderSid?: string;
	mode: string;
	dirty: boolean;
	saving: boolean;
	binaryStatus: string;
	error?: string;
	lastSavedAt?: string;
	actions: readonly EditorActionShape[];
	draft: EditorDraftShape;
}>;

const areOptionalStringsEqual = (left?: string, right?: string) =>
	left === right;

const areOptionalNumbersEqual = (left?: number, right?: number) =>
	left === right;

const arePreviewsEqual = (
	left?: EditorPreviewShape,
	right?: EditorPreviewShape,
): boolean => {
	if (left === right) return true;
	if (!left || !right) return left === right;

	return left.url === right.url && left.source === right.source;
};

const areBinariesEqual = (
	left?: EditorBinaryShape,
	right?: EditorBinaryShape,
): boolean => {
	if (left === right) return true;
	if (!left || !right) return left === right;

	return (
		left.url === right.url &&
		left.shortUrl === right.shortUrl &&
		left.detailedUrl === right.detailedUrl &&
		left.name === right.name &&
		left.size === right.size &&
		left.type === right.type &&
		left.base64 === right.base64
	);
};

const areDraftsEqual = (
	left: EditorDraftShape,
	right: EditorDraftShape,
): boolean => {
	if (left === right) return true;

	return (
		areOptionalStringsEqual(left.name, right.name) &&
		areOptionalStringsEqual(left.fileType, right.fileType) &&
		areOptionalNumbersEqual(left.statusNumber, right.statusNumber) &&
		areOptionalStringsEqual(left.statusLabel, right.statusLabel) &&
		areOptionalStringsEqual(left.documentDate, right.documentDate) &&
		areOptionalStringsEqual(
			left.expirationDate,
			right.expirationDate,
		) &&
		areOptionalStringsEqual(left.memo, right.memo) &&
		arePreviewsEqual(left.preview, right.preview) &&
		areBinariesEqual(left.binary, right.binary)
	);
};

export const reuseShallowEqualEditorActions = <
	T extends readonly EditorActionShape[],
>(
	current: T | undefined,
	next: T,
): T => {
	if (!current || current.length !== next.length) {
		return next;
	}

	for (let index = 0; index < next.length; index += 1) {
		const left = current[index];
		const right = next[index];

		if (
			left.id !== right.id ||
			left.label !== right.label ||
			left.hidden !== right.hidden ||
			left.disabled !== right.disabled
		) {
			return next;
		}
	}

	return current;
};

export const areEditorsEquivalentForStore = (
	left: EditorLike,
	right: EditorLike,
): boolean => {
	if (left === right) return true;

	return (
		areOptionalStringsEqual(left.documentId, right.documentId) &&
		areOptionalStringsEqual(left.documentCode, right.documentCode) &&
		areOptionalStringsEqual(left.natureId, right.natureId) &&
		areOptionalStringsEqual(left.natureCode, right.natureCode) &&
		areOptionalStringsEqual(left.folderId, right.folderId) &&
		areOptionalStringsEqual(left.folderSid, right.folderSid) &&
		left.mode === right.mode &&
		left.dirty === right.dirty &&
		left.saving === right.saving &&
		left.binaryStatus === right.binaryStatus &&
		areOptionalStringsEqual(left.error, right.error) &&
		areOptionalStringsEqual(left.lastSavedAt, right.lastSavedAt) &&
		left.actions === right.actions &&
		areDraftsEqual(left.draft, right.draft)
	);
};
