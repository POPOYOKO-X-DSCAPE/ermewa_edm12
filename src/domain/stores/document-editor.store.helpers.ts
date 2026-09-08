export type EditorStoreBadge = "N" | "M";

type EditorStoreLike = {
	documentCode?: string;
	mode?: string;
	dirty?: boolean;
};

export type EditorStoreCollection = Record<
	string,
	EditorStoreLike | undefined
>;

const EMPTY_EDITOR_KEY_INDEX: Readonly<Record<string, string>> =
	Object.freeze({});
const EMPTY_BADGE_INDEX: Readonly<Record<string, EditorStoreBadge>> =
	Object.freeze({});

const areFlatRecordsEqual = <T extends string>(
	left: Readonly<Record<string, T>> | undefined,
	right: Readonly<Record<string, T>>,
): boolean => {
	const leftSafe = left ?? {};
	const leftKeys = Object.keys(leftSafe);
	const rightKeys = Object.keys(right);

	if (leftKeys.length !== rightKeys.length) {
		return false;
	}

	for (const key of rightKeys) {
		if (leftSafe[key] !== right[key]) {
			return false;
		}
	}

	return true;
};

export const buildDocumentBadgesByDocumentCode = (
	editors: EditorStoreCollection,
): Readonly<Record<string, EditorStoreBadge>> => {
	const out: Record<string, EditorStoreBadge> = {};

	for (const editor of Object.values(editors)) {
		const documentCode = editor?.documentCode;
		if (!documentCode || documentCode in out) {
			continue;
		}

		if (editor.mode === "new") {
			out[documentCode] = "N";
			continue;
		}

		if (editor.dirty) {
			out[documentCode] = "M";
		}
	}

	return out;
};

export const buildEditorKeysByDocumentCode = (input: {
	editors: EditorStoreCollection;
	selectedEditorKey?: string;
}): Readonly<Record<string, string>> => {
	const { editors, selectedEditorKey } = input;
	const out: Record<string, string> = {};

	for (const [editorKey, editor] of Object.entries(editors)) {
		const documentCode = editor?.documentCode;
		if (!documentCode || documentCode in out) {
			continue;
		}

		out[documentCode] = editorKey;
	}

	if (selectedEditorKey) {
		const selectedEditor = editors[selectedEditorKey];
		const selectedDocumentCode = selectedEditor?.documentCode;
		if (selectedDocumentCode) {
			out[selectedDocumentCode] = selectedEditorKey;
		}
	}

	for (const [editorKey, editor] of Object.entries(editors)) {
		const documentCode = editor?.documentCode;
		if (!documentCode || editor?.mode !== "new") {
			continue;
		}

		out[documentCode] = editorKey;
	}

	return out;
};

export const resolveDocumentEditorKey = (input: {
	documentCode: string;
	editors: EditorStoreCollection;
	editorKeysByDocumentCode?: Readonly<Record<string, string>>;
	selectedEditorKey?: string;
}): string | undefined => {
	const { documentCode, editors, editorKeysByDocumentCode, selectedEditorKey } =
		input;

	const indexedEditorKey = editorKeysByDocumentCode?.[documentCode];
	if (
		indexedEditorKey &&
		editors[indexedEditorKey]?.documentCode === documentCode
	) {
		return indexedEditorKey;
	}

	return buildEditorKeysByDocumentCode({
		editors,
		selectedEditorKey,
	})[documentCode];
};

export const buildDocumentStoreDerivedPatch = (input: {
	editors: EditorStoreCollection;
	selectedEditorKey?: string;
}) => {
	const nextEditorKeysByDocumentCode = buildEditorKeysByDocumentCode(
		input,
	);
	const nextBadgesByDocumentCode = buildDocumentBadgesByDocumentCode(
		input.editors,
	);

	return {
		editorKeysByDocumentCode: (
			current?: Readonly<Record<string, string>>,
		) =>
			areFlatRecordsEqual(current, nextEditorKeysByDocumentCode)
				? (current ?? EMPTY_EDITOR_KEY_INDEX)
				: nextEditorKeysByDocumentCode,
		badgesByDocumentCode: (
			current?: Readonly<Record<string, EditorStoreBadge>>,
		) =>
			areFlatRecordsEqual(current, nextBadgesByDocumentCode)
				? (current ?? EMPTY_BADGE_INDEX)
				: nextBadgesByDocumentCode,
	};
};
