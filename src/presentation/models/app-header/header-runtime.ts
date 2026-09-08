/* cspell:ignore xprm xtree */

type RawRecord = Record<string, unknown>;

export type HeaderRuntime = Readonly<{
	appName?: string;
	title?: string;
	login?: string;
}>;

type ResolveHeaderRuntimeInput = Readonly<{
	xprmRaw: unknown;
	xtreeRaw: unknown;
}>;

const DEFAULT_APP_NAME = undefined;
const DEFAULT_LOGIN = undefined;
const DEFAULT_TITLE = undefined;

const isRecord = (value: unknown): value is RawRecord =>
	typeof value === "object" && value !== null;

const getRecordValue = (
	record: RawRecord,
	segment: string,
): unknown => {
	if (segment in record) {
		return record[segment];
	}

	const lowerSegment = segment.toLowerCase();

	for (const key of Object.keys(record)) {
		if (key.toLowerCase() === lowerSegment) {
			return record[key];
		}
	}

	return undefined;
};

const readPath = (value: unknown, path: readonly string[]): unknown => {
	let current: unknown = value;

	for (const segment of path) {
		if (current === undefined || current === null) {
			return undefined;
		}

		if (Array.isArray(current)) {
			const index = Number(segment);
			if (
				!Number.isInteger(index) ||
				index < 0 ||
				index >= current.length
			) {
				return undefined;
			}
			current = current[index];
			continue;
		}

		if (!isRecord(current)) {
			return undefined;
		}

		current = getRecordValue(current, segment);
	}

	return current;
};

const asDisplayString = (value: unknown): string | undefined => {
	if (typeof value === "string") {
		const trimmed = value.trim();
		return trimmed || undefined;
	}

	if (
		typeof value === "number" ||
		typeof value === "boolean" ||
		typeof value === "bigint"
	) {
		return String(value);
	}

	return undefined;
};

const pickLocalizedString = (value: unknown): string | undefined => {
	const direct = asDisplayString(value);
	if (direct) {
		return direct;
	}

	if (!isRecord(value)) {
		return undefined;
	}

	for (const key of ["FRA", "ENG", ""] as const) {
		const candidate = asDisplayString(value[key]);
		if (candidate) {
			return candidate;
		}
	}

	for (const candidate of Object.values(value)) {
		const resolved = asDisplayString(candidate);
		if (resolved) {
			return resolved;
		}
	}

	return undefined;
};

const normalizePath = (path: string): readonly string[] =>
	path
		.split(".")
		.map((segment) => segment.replace(/!/g, "").trim())
		.filter(Boolean);

const parseToken = (
	token: string,
): { sourceName: string; path: readonly string[] } | undefined => {
	const trimmed = token.trim().replace(/!/g, "");
	if (!trimmed) {
		return undefined;
	}

	const pipeIndex = trimmed.indexOf("|");
	if (pipeIndex >= 0) {
		const sourceName = trimmed.slice(0, pipeIndex).trim().toUpperCase();
		const rawPath = trimmed
			.slice(pipeIndex + 1)
			.trim()
			.replace(/^\./, "");
		if (!sourceName) {
			return undefined;
		}
		return {
			sourceName,
			path: normalizePath(rawPath),
		};
	}

	const [sourceName = "", ...segments] = trimmed.split(".");
	if (!sourceName.trim()) {
		return undefined;
	}

	return {
		sourceName: sourceName.trim().toUpperCase(),
		path: normalizePath(segments.join(".")),
	};
};

const resolveSourcePath = (
	sourceName: string,
	source: unknown,
	path: readonly string[],
): unknown => {
	const direct = path.length ? readPath(source, path) : source;
	if (direct !== undefined) {
		return direct;
	}

	if (sourceName !== "XTREE" || !isRecord(source)) {
		return undefined;
	}

	const nestedCandidates = [
		getRecordValue(source, "xTree"),
		getRecordValue(source, "XTREE"),
		getRecordValue(source, "tree"),
		getRecordValue(source, "data"),
	];

	for (const candidate of nestedCandidates) {
		const resolved = path.length
			? readPath(candidate, path)
			: candidate;
		if (resolved !== undefined) {
			return resolved;
		}
	}

	return undefined;
};

const resolveToken = (
	token: string,
	sources: Readonly<Record<string, unknown>>,
): string => {
	const parsed = parseToken(token);
	if (!parsed) {
		return "";
	}

	const source = sources[parsed.sourceName];
	if (source === undefined) {
		return "";
	}

	const resolved = resolveSourcePath(
		parsed.sourceName,
		source,
		parsed.path,
	);

	return pickLocalizedString(resolved) ?? "";
};

const resolveHashTokens = (
	template: string,
	sources: Readonly<Record<string, unknown>>,
): string => {
	let out = "";
	let cursor = 0;

	while (cursor < template.length) {
		const start = template.indexOf("#", cursor);

		if (start < 0) {
			out += template.slice(cursor);
			break;
		}

		out += template.slice(cursor, start);

		const end = template.indexOf("#", start + 1);
		if (end < 0) {
			out += template.slice(start);
			break;
		}

		const token = template.slice(start + 1, end);
		out += resolveToken(token, sources);
		cursor = end + 1;
	}

	return out;
};

const collapseWhitespace = (value: string): string =>
	value
		.replace(/\s+/g, " ")
		.replace(/\s+\]/g, "]")
		.replace(/\[\s+/g, "[")
		.trim();

const cleanupResolvedTitle = (value: string): string =>
	collapseWhitespace(value)
		.replace(/\s*\(\s*\)/g, "")
		.replace(/\s*\[\s*\]/g, "")
		.replace(/\s*-\s*$/g, "")
		.trim();

const resolveTemplate = (
	template: string,
	sources: Readonly<Record<string, unknown>>,
): string => {
	let current = template;
	let previous = "";

	while (current !== previous) {
		previous = current;
		current = current.replace(
			/\[([^\[\]]*)\]/g,
			(_match, inner: string) => {
				const resolvedInner = cleanupResolvedTitle(
					resolveTemplate(inner, sources),
				);
				return resolvedInner ? `[${resolvedInner}]` : "";
			},
		);
	}

	current = resolveHashTokens(current, sources);

	return cleanupResolvedTitle(current);
};

const firstResolvedString = (
	source: unknown,
	paths: ReadonlyArray<readonly string[]>,
): string | undefined => {
	for (const path of paths) {
		const resolved = pickLocalizedString(readPath(source, path));
		if (resolved) {
			return resolved;
		}
	}

	return undefined;
};

const resolveAppName = (xprmRaw: unknown): string | undefined => {
	const rawName = firstResolvedString(xprmRaw, [
		["APP", "ANAME"],
		["PRF", "PNAME"],
	]);
	return rawName ?? DEFAULT_APP_NAME;
};

const resolveLogin = (xprmRaw: unknown): string | undefined => {
	const login = firstResolvedString(xprmRaw, [
		["headers", "login"],
		["headers", "upid"],
		["headers", "upi"],
	]);
	return login ?? DEFAULT_LOGIN;
};

const resolveTitleTemplate = (xprmRaw: unknown): string | undefined =>
	firstResolvedString(xprmRaw, [
		["PRF", "PRM", "TITLE", "PRM"],
		["PRM", "TITLE", "PRM"],
	]);

const resolveTitle = (
	input: ResolveHeaderRuntimeInput,
): string | undefined => {
	console.log("INPUT");
	console.log(input);

	const template = resolveTitleTemplate(input.xprmRaw);
	if (!template) {
		return DEFAULT_TITLE;
	}

	const resolved = resolveTemplate(template, {
		XPRM: input.xprmRaw,
		XTREE: input.xtreeRaw,
	});

	return resolved || DEFAULT_TITLE;
};

export const resolveHeaderRuntime = (
	input: ResolveHeaderRuntimeInput,
): HeaderRuntime => ({
	appName: resolveAppName(input.xprmRaw),
	title: resolveTitle(input),
	login: resolveLogin(input.xprmRaw),
});
