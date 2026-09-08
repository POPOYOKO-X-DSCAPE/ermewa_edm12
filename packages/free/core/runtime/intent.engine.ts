/* =========================
 * Utils
 * ========================= */

type AnyRecord = Record<PropertyKey, unknown>;

type IsPlainObject<T> = T extends AnyRecord
	? T extends (...args: unknown[]) => unknown
		? false
		: true
	: false;

export type IntentPathSegment = string | number;
export type IntentPath = readonly IntentPathSegment[];

export type IntentMutation = Readonly<{
	paths: readonly IntentPath[];
}>;

const EMPTY_INTENT_MUTATION: IntentMutation = Object.freeze({
	paths: Object.freeze([]),
});

const serializeIntentPath = (path: IntentPath): string => JSON.stringify(path);

const freezeMutationPaths = (paths: readonly IntentPath[]): readonly IntentPath[] =>
	Object.freeze(paths.map((path) => Object.freeze([...path])));

const makeIntentMutation = (paths: readonly IntentPath[]): IntentMutation => ({
	paths: freezeMutationPaths(paths),
});

const createMutationCollector = () => {
	const seen = new Map<string, IntentPath>();

	return {
		add(path: IntentPath) {
			seen.set(serializeIntentPath(path), [...path]);
		},
		size() {
			return seen.size;
		},
		result(): IntentMutation {
			if (seen.size === 0) {
				return EMPTY_INTENT_MUTATION;
			}

			return makeIntentMutation(Array.from(seen.values()));
		},
	};
};

/* =========================
 * Intents (OPAQUES)
 * ========================= */

const UNSET = Symbol("intent.unset");
const RESET = Symbol("intent.reset");

type IntentToken<T extends symbol> = {
	readonly [K in T]: true;
};

type Unset = IntentToken<typeof UNSET>;
type Reset = IntentToken<typeof RESET>;

export const unset: Unset = { [UNSET]: true };
export const reset: Reset = { [RESET]: true };

/* =========================
 * Derive
 * ========================= */

type Derive<T> = (value: T | undefined) => T;
type DeriveStrict<T> = (value: T) => T;

export const derive = <T>(fn: Derive<T>): Derive<T> => fn;
export const deriveStrict =
	<T>(fn: DeriveStrict<T>): Derive<T> =>
	(value) =>
		fn(value as T);
export const require =
	<T>(fn: (value: T) => T) =>
	(value: T | undefined) => {
		if (value === undefined) {
			throw new Error("require: missing previous value");
		}
		return fn(value);
	};

/* =========================
 * Intent typing
 * ========================= */

type IntentValue<T> =
	| T
	| Derive<T>
	| (undefined extends T ? Unset | Reset : never);

type DeepMergeInput<T> = {
	[K in keyof T]?: IsPlainObject<NonNullable<T[K]>> extends true
		? DeepMergeInput<NonNullable<T[K]>> | IntentValue<T[K]>
		: IntentValue<T[K]>;
};

type ReplaceInput<T> = {
	[K in keyof T]: IsPlainObject<NonNullable<T[K]>> extends true
		? ReplaceInput<NonNullable<T[K]>> | IntentValue<T[K]>
		: IntentValue<T[K]>;
};

type MergeHelpers = {
	unset: Unset;
	reset: Reset;
	derive: typeof derive;
	require: typeof require;
};

type ReplaceHelpers = {
	unset: Unset;
	reset: Reset;
	derive: typeof deriveStrict;
	require: typeof require;
};

type IntentEngine<S extends AnyRecord> = {
	readonly current: S;
	readonly lastMutation: IntentMutation;

	merge(
		input:
			| DeepMergeInput<S>
			| ((helpers: MergeHelpers) => DeepMergeInput<S>),
	): S;

	replace(
		input:
			| ReplaceInput<S>
			| ((helpers: ReplaceHelpers) => ReplaceInput<S>),
	): S;
};

/* =========================
 * Runtime guards
 * ========================= */

const isObject = (v: unknown): v is AnyRecord =>
	typeof v === "object" && v !== null;

const isPlainObject = (v: unknown): v is AnyRecord => {
	if (!isObject(v)) return false;

	const proto = Object.getPrototypeOf(v);

	return proto === Object.prototype || proto === null;
};

const isCallable = <T>(v: unknown): v is Derive<T> =>
	typeof v === "function";

const isUnset = (v: unknown): v is Unset => isObject(v) && UNSET in v;
const isReset = (v: unknown): v is Reset => isObject(v) && RESET in v;

const hasOwn = (value: object, key: PropertyKey): boolean =>
	Object.prototype.hasOwnProperty.call(value, key);

/* =========================
 * Apply logic
 * ========================= */

function applyLeaf<T>(
	base: T | undefined,
	value: IntentValue<T>,
): T | undefined {
	if (isUnset(value) || isReset(value)) {
		return undefined;
	}

	if (isCallable<T>(value)) {
		return value(base);
	}

	return value as T;
}

function applyObject<T extends AnyRecord>(
	base: T | undefined,
	patch: DeepMergeInput<T>,
	collector: ReturnType<typeof createMutationCollector>,
	path: readonly IntentPathSegment[] = [],
): T {
	const source = (base ?? {}) as T;
	let next: Partial<T> | undefined;
	let changed = false;

	const ensureNext = () => {
		if (!next) {
			next = { ...source } as Partial<T>;
		}

		return next;
	};

	for (const key in patch) {
		const value = patch[key];
		const prev = base?.[key];
		const nextPath = [...path, key] as const;
		const hadPrev = base ? hasOwn(base, key) : false;

		if (value === undefined) {
			const didChange = !hadPrev || !Object.is(prev, undefined);
			if (!didChange) continue;

			ensureNext()[key] = undefined as T[typeof key];
			collector.add(nextPath);
			changed = true;
			continue;
		}

		if (isUnset(value)) {
			if (!hadPrev) continue;

			delete ensureNext()[key];
			collector.add(nextPath);
			changed = true;
			continue;
		}

		if (isReset(value)) {
			const didChange = !hadPrev || !Object.is(prev, undefined);
			if (!didChange) continue;

			ensureNext()[key] = undefined as T[typeof key];
			collector.add(nextPath);
			changed = true;
			continue;
		}

		if (isCallable<T[typeof key]>(value)) {
			const nextValue = applyLeaf(
				prev as T[typeof key] | undefined,
				value as IntentValue<T[typeof key]>,
			) as T[typeof key];

			const didChange = !hadPrev || !Object.is(prev, nextValue);
			if (!didChange) continue;

			ensureNext()[key] = nextValue;
			collector.add(nextPath);
			changed = true;
			continue;
		}

		if (Array.isArray(value)) {
			const didChange = !hadPrev || !Object.is(prev, value);
			if (!didChange) continue;

			ensureNext()[key] = value as T[typeof key];
			collector.add(nextPath);
			changed = true;
			continue;
		}

		if (isPlainObject(value)) {
			if (hadPrev && Object.is(prev, value)) continue;

			const sizeBefore = collector.size();
			const nextValue = applyObject(
				isPlainObject(prev) ? (prev as AnyRecord) : undefined,
				value as DeepMergeInput<AnyRecord>,
				collector,
				nextPath,
			) as T[typeof key];

			const didChange = !hadPrev || !Object.is(prev, nextValue);
			if (!didChange) continue;

			ensureNext()[key] = nextValue;
			changed = true;

			if (collector.size() === sizeBefore) {
				collector.add(nextPath);
			}
			continue;
		}

		const nextValue = value as T[typeof key];
		const didChange = !hadPrev || !Object.is(prev, nextValue);
		if (!didChange) continue;

		ensureNext()[key] = nextValue;
		collector.add(nextPath);
		changed = true;
	}

	if (!changed) {
		return (base ?? ({} as T)) as T;
	}

	return next as T;
}

/* =========================
 * Engine
 * ========================= */

export function createIntentEngine<S extends AnyRecord>(
	initialState: S,
): IntentEngine<S> {
	let state: S = structuredClone(initialState);
	let lastMutation: IntentMutation = EMPTY_INTENT_MUTATION;

	const mergeHelpers: MergeHelpers = { unset, reset, derive, require };
	const replaceHelpers: ReplaceHelpers = {
		unset,
		reset,
		derive: deriveStrict,
		require,
	};

	return {
		get current() {
			return state;
		},

		get lastMutation() {
			return lastMutation;
		},

		merge(input) {
			const fragment =
				typeof input === "function" ? input(mergeHelpers) : input;
			const collector = createMutationCollector();

			state = applyObject(state, fragment, collector);
			lastMutation = collector.result();
			return state;
		},

		replace(input) {
			const fragment =
				typeof input === "function" ? input(replaceHelpers) : input;
			const collector = createMutationCollector();

			state = applyObject(
				state,
				fragment as unknown as DeepMergeInput<S>,
				collector,
			);
			lastMutation = collector.result();
			return state;
		},
	};
}
