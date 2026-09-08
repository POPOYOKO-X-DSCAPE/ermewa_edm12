export type ReactiveNamespace =
	| "store"
	| "repo"
	| "model"
	| "component";

export type ReactivePathSegment = string | number;

export type ReactiveRootKey = `${ReactiveNamespace}.${string}`;
export type ReactiveKey = `${ReactiveNamespace}.${string}`;
export type ReactiveScope = ReactiveRootKey;

const SEGMENT_SEPARATOR = ".";
const ROOT_SEGMENT_COUNT = 2;

const escapeSegment = (value: ReactivePathSegment): string =>
	encodeURIComponent(String(value)).replace(/\./g, "%2E");

const unescapeSegment = (value: string): string => decodeURIComponent(value);

const splitSegments = (key: ReactiveKey): string[] =>
	key.split(SEGMENT_SEPARATOR);

const joinSegments = (segments: readonly string[]): ReactiveKey =>
	segments.join(SEGMENT_SEPARATOR) as ReactiveKey;

const buildKey = (
	namespace: ReactiveNamespace,
	name: string,
	path: readonly ReactivePathSegment[] = [],
): ReactiveKey => {
	const root = [namespace, escapeSegment(name)];
	if (!path.length) {
		return joinSegments(root);
	}

	return joinSegments([...root, ...path.map(escapeSegment)]);
};

const getRootSegments = (
	key: ReactiveKey,
): readonly [ReactiveNamespace, string] => {
	const parts = splitSegments(key);
	const namespace = (parts[0] ?? "store") as ReactiveNamespace;
	const name = parts[1] ?? "";
	return [namespace, name];
};

const getScope = (key: ReactiveKey): ReactiveScope => {
	const parts = splitSegments(key);
	return joinSegments(parts.slice(0, ROOT_SEGMENT_COUNT)) as ReactiveScope;
};

const getPathSegments = (key: ReactiveKey): readonly string[] => {
	const parts = splitSegments(key);
	return parts.slice(ROOT_SEGMENT_COUNT);
};

const decodePath = (key: ReactiveKey): readonly string[] =>
	getPathSegments(key).map(unescapeSegment);

const isPrefix = (
	prefix: readonly string[],
	value: readonly string[],
): boolean => {
	if (prefix.length > value.length) return false;

	for (let index = 0; index < prefix.length; index += 1) {
		if (prefix[index] !== value[index]) {
			return false;
		}
	}

	return true;
};

const isAncestorOrSelf = (
	ancestor: ReactiveKey,
	value: ReactiveKey,
): boolean => {
	if (getScope(ancestor) !== getScope(value)) {
		return false;
	}

	return isPrefix(getPathSegments(ancestor), getPathSegments(value));
};

const isRelated = (left: ReactiveKey, right: ReactiveKey): boolean => {
	if (getScope(left) !== getScope(right)) {
		return false;
	}

	const leftPath = getPathSegments(left);
	const rightPath = getPathSegments(right);

	if (!leftPath.length || !rightPath.length) {
		return true;
	}

	return isPrefix(leftPath, rightPath) || isPrefix(rightPath, leftPath);
};

const parent = (key: ReactiveKey): ReactiveKey | undefined => {
	const parts = splitSegments(key);
	if (parts.length <= ROOT_SEGMENT_COUNT) {
		return undefined;
	}

	return joinSegments(parts.slice(0, -1));
};

const parents = (key: ReactiveKey): readonly ReactiveKey[] => {
	const out: ReactiveKey[] = [];
	let current: ReactiveKey | undefined = key;

	while (current) {
		out.push(current);
		current = parent(current);
	}

	return out;
};

const append = (
	key: ReactiveKey,
	...path: readonly ReactivePathSegment[]
): ReactiveKey => {
	if (!path.length) return key;
	return joinSegments([...splitSegments(key), ...path.map(escapeSegment)]);
};

const compact = (keys: readonly ReactiveKey[]): readonly ReactiveKey[] => {
	if (keys.length <= 1) {
		return Array.from(new Set(keys));
	}

	const byScope = new Map<ReactiveScope, ReactiveKey[]>();

	for (const key of keys) {
		const scope = getScope(key);
		const scoped = byScope.get(scope);

		if (scoped) {
			scoped.push(key);
			continue;
		}

		byScope.set(scope, [key]);
	}

	const out: ReactiveKey[] = [];

	for (const scopedKeys of byScope.values()) {
		const unique = Array.from(new Set(scopedKeys)).sort((left, right) => {
			return (
				getPathSegments(left).length - getPathSegments(right).length
			);
		});

		const kept: ReactiveKey[] = [];

		for (const key of unique) {
			if (kept.some((candidate) => isAncestorOrSelf(candidate, key))) {
				continue;
			}

			kept.push(key);
		}

		out.push(...kept);
	}

	return out;
};

export const ReactiveKeys = {
	store: (name: string, ...path: readonly ReactivePathSegment[]) =>
		buildKey("store", name, path),
	repo: (name: string, ...path: readonly ReactivePathSegment[]) =>
		buildKey("repo", name, path),
	model: (name: string) => buildKey("model", name),
	component: (id: string) => buildKey("component", id),

	scope: getScope,
	root: getScope,
	append,
	parent,
	parents,
	isRelated,
	isAncestorOrSelf,
	compact,
	decodePath,
	decodeRoot: (key: ReactiveKey) => {
		const [namespace, encodedName] = getRootSegments(key);
		return {
			namespace,
			name: unescapeSegment(encodedName),
		};
	},
} as const;
