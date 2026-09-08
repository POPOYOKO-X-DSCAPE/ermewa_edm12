import type { DisplaySelectTextSegment } from "@src/presentation/contracts/display-select.interface";

const DASHES_RE = /[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g;
const MARKS_RE = /\p{M}/gu;
const SPACES_RE = /\s+/g;

export const normalizeDisplaySelectSearch = (value: string): string =>
	value
		.normalize("NFKD")
		.replace(MARKS_RE, "")
		.replace(DASHES_RE, "-")
		.replace(SPACES_RE, "")
		.toLowerCase();

type SearchProjection = Readonly<{
	normalized: string;
	starts: readonly number[];
	ends: readonly number[];
}>;

const buildSearchProjection = (text: string): SearchProjection => {
	let normalized = "";
	const starts: number[] = [];
	const ends: number[] = [];

	for (let index = 0; index < text.length; ) {
		const codePoint = text.codePointAt(index);
		const character = codePoint === undefined
			? text[index]
			: String.fromCodePoint(codePoint);
		const end = index + character.length;
		const normalizedCharacter = normalizeDisplaySelectSearch(character);

		for (const value of normalizedCharacter) {
			normalized += value;
			starts.push(index);
			ends.push(end);
		}

		index = end;
	}

	return {
		normalized,
		starts,
		ends,
	};
};

export const buildDisplaySelectTextSegments = (
	text: string,
	query: string,
): readonly DisplaySelectTextSegment[] => {
	const normalizedQuery = normalizeDisplaySelectSearch(query);
	if (!normalizedQuery) {
		return [{ text, highlighted: false }];
	}

	const projection = buildSearchProjection(text);
	const ranges: Array<Readonly<{ start: number; end: number }>> = [];
	let searchIndex = 0;

	while (searchIndex < projection.normalized.length) {
		const matchIndex = projection.normalized.indexOf(
			normalizedQuery,
			searchIndex,
		);
		if (matchIndex < 0) {
			break;
		}

		const lastNormalizedIndex =
			matchIndex + normalizedQuery.length - 1;
		const start = projection.starts[matchIndex];
		const end = projection.ends[lastNormalizedIndex];

		if (start !== undefined && end !== undefined) {
			const previous = ranges[ranges.length - 1];
			if (previous && start <= previous.end) {
				ranges[ranges.length - 1] = {
					start: previous.start,
					end: Math.max(previous.end, end),
				};
			} else {
				ranges.push({ start, end });
			}
		}

		searchIndex = matchIndex + normalizedQuery.length;
	}

	if (!ranges.length) {
		return [{ text, highlighted: false }];
	}

	const segments: DisplaySelectTextSegment[] = [];
	let cursor = 0;

	for (const range of ranges) {
		if (range.start > cursor) {
			segments.push({
				text: text.slice(cursor, range.start),
				highlighted: false,
			});
		}

		segments.push({
			text: text.slice(range.start, range.end),
			highlighted: true,
		});
		cursor = range.end;
	}

	if (cursor < text.length) {
		segments.push({
			text: text.slice(cursor),
			highlighted: false,
		});
	}

	return segments;
};
