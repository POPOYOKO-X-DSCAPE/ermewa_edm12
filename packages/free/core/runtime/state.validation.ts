import { isOptionalType, stripOptionalType } from "./state.optional";

type ValidationPathSegment = string | number;
type ValidationPath = readonly ValidationPathSegment[];

export type RuntimePrimaryKeyField = {
	readonly __kind: "primaryKey";
	readonly of: string;
};

export const isLazyField = (
	v: RuntimeEntityField,
): v is RuntimeLazyField =>
	typeof v === "object" &&
	v !== null &&
	"__kind" in v &&
	(v as { readonly __kind?: unknown }).__kind === "lazy";

export const resolveLazyField = (
	v: RuntimeEntityField,
): RuntimeEntityField => {
	let current = v;
	while (isLazyField(current)) {
		current = current.get();
	}
	return current;
};

export type RuntimeLazyField = {
	readonly __kind: "lazy";
	readonly get: () => RuntimeEntityField;
};

export type RuntimeEntityField =
	| string
	| RuntimePrimaryKeyField
	| RuntimeLazyField
	| { readonly [key: string]: RuntimeEntityField }
	| { readonly __kind: "array"; readonly of: RuntimeEntityField }
	| {
			readonly __kind: "ref";
			readonly kind: symbol;
			readonly min: number;
			readonly max: number | "n";
	  }
	| { readonly __kind: "opt"; readonly of: RuntimeEntityField }
	| {
			readonly __kind: "oneOf";
			readonly values: readonly (
				| string
				| number
				| boolean
				| null
				| undefined
			)[];
	  }
	| {
			readonly __kind: "dict";
			readonly of: RuntimeEntityField;
			readonly __only?: readonly string[];
	  };

const isRecord = (
	value: unknown,
): value is Record<PropertyKey, unknown> =>
	typeof value === "object" && value !== null;

const isObjectContainer = (
	value: unknown,
): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const toObjectKey = (segment: ValidationPathSegment): string =>
	String(segment);

const normalizeIndex = (
	segment: ValidationPathSegment,
): number | undefined => {
	if (typeof segment === "number" && Number.isInteger(segment)) {
		return segment;
	}

	if (typeof segment === "string" && /^(0|[1-9]\d*)$/.test(segment)) {
		return Number(segment);
	}

	return undefined;
};

type ValidationPathTrieNode = {
	terminal: boolean;
	children: Map<ValidationPathSegment, ValidationPathTrieNode>;
};

const createValidationPathTrieNode = (): ValidationPathTrieNode => ({
	terminal: false,
	children: new Map(),
});

const normalizeValidationPaths = (
	paths: readonly ValidationPath[],
): readonly ValidationPath[] => {
	if (paths.length <= 1) {
		return paths;
	}

	const ordered = [...paths].sort(
		(left, right) => left.length - right.length,
	);

	const root = createValidationPathTrieNode();
	const out: ValidationPath[] = [];

	for (const path of ordered) {
		let node = root;
		let blocked = false;

		for (const segment of path) {
			if (node.terminal) {
				blocked = true;
				break;
			}

			let child = node.children.get(segment);
			if (!child) {
				child = createValidationPathTrieNode();
				node.children.set(segment, child);
			}

			node = child;
		}

		if (blocked || node.terminal) {
			continue;
		}

		node.terminal = true;
		node.children.clear();
		out.push(path);
	}

	return out;
};

export const isPrimaryKeyField = (
	value: unknown,
): value is RuntimePrimaryKeyField => {
	if (!isRecord(value)) return false;
	if (value.__kind !== "primaryKey") return false;
	return typeof value.of === "string";
};

export const isArrayField = (
	value: RuntimeEntityField,
): value is {
	readonly __kind: "array";
	readonly of: RuntimeEntityField;
} =>
	typeof value === "object" &&
	value !== null &&
	"__kind" in value &&
	(value as { readonly __kind?: unknown }).__kind === "array";

export const isRefField = (
	value: RuntimeEntityField,
): value is {
	readonly __kind: "ref";
	readonly min: number;
	readonly max: number | "n";
	readonly kind: symbol;
} =>
	typeof value === "object" &&
	value !== null &&
	"__kind" in value &&
	(value as { readonly __kind?: unknown }).__kind === "ref";

export const isOptField = (
	value: RuntimeEntityField,
): value is {
	readonly __kind: "opt";
	readonly of: RuntimeEntityField;
} =>
	typeof value === "object" &&
	value !== null &&
	"__kind" in value &&
	(value as { readonly __kind?: unknown }).__kind === "opt";

export const isOneOfField = (
	value: RuntimeEntityField,
): value is {
	readonly __kind: "oneOf";
	readonly values: readonly (
		| string
		| number
		| boolean
		| null
		| undefined
	)[];
} =>
	typeof value === "object" &&
	value !== null &&
	"__kind" in value &&
	(value as { readonly __kind?: unknown }).__kind === "oneOf";

export const isDictField = (
	value: RuntimeEntityField,
): value is {
	readonly __kind: "dict";
	readonly of: RuntimeEntityField;
	readonly __only?: readonly string[];
} =>
	typeof value === "object" &&
	value !== null &&
	"__kind" in value &&
	(value as { readonly __kind?: unknown }).__kind === "dict";

const makeErrorNode = (node: RuntimeEntityField): unknown => {
	const current = resolveLazyField(node);

	if (typeof current === "string") return [];
	if (isOptField(current)) return makeErrorNode(current.of);
	if (isPrimaryKeyField(current)) return [];
	if (isOneOfField(current)) return [];
	if (isArrayField(current)) return {};
	if (isDictField(current)) return {};
	if (isRefField(current)) return [];

	const shape = current as Record<string, RuntimeEntityField>;
	const out: Record<string, unknown> = {};
	for (const key in shape) {
		out[key] = makeErrorNode(shape[key]);
	}
	return out;
};

export const buildErrorTree = (
	definition: Record<string, RuntimeEntityField>,
) => {
	const root: Record<string, unknown> = {};
	for (const key in definition) {
		root[key] = makeErrorNode(definition[key]);
	}
	return root;
};

const clearLeafError = (err: unknown) => {
	if (Array.isArray(err)) {
		err.length = 0;
	}
};

const clearErrorNode = (
	def: RuntimeEntityField,
	err: unknown,
): void => {
	const current = resolveLazyField(def);

	if (isOptField(current)) {
		clearErrorNode(current.of, err);
		return;
	}

	if (isPrimaryKeyField(current)) {
		clearErrorNode(current.of, err);
		return;
	}

	if (
		typeof current === "string" ||
		isOneOfField(current) ||
		isRefField(current)
	) {
		clearLeafError(err);
		return;
	}

	if (!isRecord(err)) {
		return;
	}

	if (isArrayField(current) || isDictField(current)) {
		if ("__self" in err) {
			(err as Record<string, unknown>).__self = undefined;
		}
		for (const key of Object.keys(err)) {
			if (key === "__self") continue;
			delete (err as Record<string, unknown>)[key];
		}
		return;
	}

	const shape = current as Record<string, RuntimeEntityField>;
	if ("__self" in err) {
		(err as Record<string, unknown>).__self = undefined;
	}

	for (const key of Object.keys(err)) {
		if (key === "__self") continue;
		if (!(key in shape)) {
			delete (err as Record<string, unknown>)[key];
			continue;
		}
		clearErrorNode(shape[key], (err as Record<string, unknown>)[key]);
	}

	for (const key in shape) {
		if (!(key in err)) {
			(err as Record<string, unknown>)[key] = makeErrorNode(shape[key]);
		}
	}
};

const ensureChildErrorNode = (
	container: Record<string, unknown>,
	key: string,
	def: RuntimeEntityField,
): unknown => {
	if (!(key in container)) {
		container[key] = makeErrorNode(def);
	}

	return container[key];
};

const setObjectExpectedError = (err: Record<string, unknown>) => {
	err.__self = "expected object";
};

const setArrayExpectedError = (err: Record<string, unknown>) => {
	err.__self = "expected array";
};

const validateScalarNode = (
	types: Record<string, readonly ((v: unknown) => boolean | string)[]>,
	def: string,
	val: unknown,
	err: unknown,
) => {
	if (!Array.isArray(err)) return;

	clearLeafError(err);

	const optional = isOptionalType(def);
	const typeName = stripOptionalType(def);

	if (val === undefined && optional) {
		return;
	}

	const validators = types[typeName];
	if (!validators) return;

	for (const rule of validators) {
		const result = rule(val);
		if (typeof result === "string") {
			err.push(result);
			return;
		}
	}
};

const validateOneOfNode = (
	def: {
		readonly values: readonly (
			| string
			| number
			| boolean
			| null
			| undefined
		)[];
	},
	val: unknown,
	err: unknown,
) => {
	if (!Array.isArray(err)) return;

	clearLeafError(err);

	const ok = def.values.some((candidate) => Object.is(candidate, val));
	if (ok) return;

	err.push(
		`expected one of: ${def.values
			.map((entry) => JSON.stringify(entry))
			.join(" | ")}`,
	);
};

const validateRefNode = (
	def: {
		readonly min: number;
		readonly max: number | "n";
	},
	val: unknown,
	err: unknown,
) => {
	if (!Array.isArray(err)) return;

	clearLeafError(err);

	if (val === undefined) {
		if (def.min > 0) {
			err.push("missing reference");
		}
		return;
	}

	if (def.max === 1) {
		if (typeof val !== "string") {
			err.push("expected reference id");
		}
		return;
	}

	if (!Array.isArray(val)) {
		err.push("expected array of reference ids");
		return;
	}

	if (val.length < def.min) {
		err.push(`expected at least ${def.min} references`);
	}

	if (def.max !== "n" && val.length > def.max) {
		err.push(`expected at most ${def.max} references`);
	}

	for (const entry of val) {
		if (typeof entry !== "string") {
			err.push("invalid reference id");
			return;
		}
	}
};

const isFieldOptionalOnInitial = (
	field: RuntimeEntityField,
): boolean => {
	const current = resolveLazyField(field);
	return (
		isOptField(current) ||
		(typeof current === "string" && isOptionalType(current)) ||
		(isRefField(current) && current.min === 0)
	);
};

const assignMissingRequiredError = (err: unknown) => {
	if (Array.isArray(err)) {
		err.push("missing required field");
		return;
	}

	if (isRecord(err)) {
		(err as Record<string, unknown>).__self = "missing required field";
	}
};

const validateNodeFull = (
	types: Record<string, readonly ((v: unknown) => boolean | string)[]>,
	def: RuntimeEntityField,
	val: unknown,
	err: unknown,
	isInitial: boolean,
): void => {
	clearErrorNode(def, err);

	const current = resolveLazyField(def);

	if (isOptField(current)) {
		if (val === undefined) {
			return;
		}
		validateNodeFull(types, current.of, val, err, isInitial);
		return;
	}

	if (isPrimaryKeyField(current)) {
		validateNodeFull(types, current.of, val, err, isInitial);
		return;
	}

	if (typeof current === "string") {
		validateScalarNode(types, current, val, err);
		return;
	}

	if (isOneOfField(current)) {
		validateOneOfNode(current, val, err);
		return;
	}

	if (isRefField(current)) {
		validateRefNode(current, val, err);
		return;
	}

	if (isArrayField(current)) {
		if (!isRecord(err)) return;
		const e = err as Record<string, unknown>;

		if (!Array.isArray(val)) {
			setArrayExpectedError(e);
			return;
		}

		e.__self = undefined;
		for (let index = 0; index < val.length; index += 1) {
			const key = String(index);
			const childErr = ensureChildErrorNode(e, key, current.of);
			validateNodeFull(
				types,
				current.of,
				val[index],
				childErr,
				isInitial,
			);
		}
		return;
	}

	if (isDictField(current)) {
		if (!isRecord(err)) return;
		const e = err as Record<string, unknown>;

		if (!isObjectContainer(val)) {
			setObjectExpectedError(e);
			return;
		}

		const v = val as Record<string, unknown>;
		const only = current.__only;

		if (only) {
			const allowed = new Set(only);
			const bad = Object.keys(v).filter((key) => !allowed.has(key));
			e.__self = bad.length
				? `unexpected keys: ${bad.join(", ")}`
				: undefined;
		} else {
			e.__self = undefined;
		}

		for (const key of Object.keys(v)) {
			if (only && !only.includes(key)) {
				continue;
			}

			const childErr = ensureChildErrorNode(e, key, current.of);
			validateNodeFull(types, current.of, v[key], childErr, isInitial);
		}
		return;
	}

	if (!isRecord(err)) return;
	const e = err as Record<string, unknown>;

	if (!isObjectContainer(val)) {
		setObjectExpectedError(e);
		return;
	}

	const v = val as Record<string, unknown>;
	const shape = current as Record<string, RuntimeEntityField>;

	e.__self = undefined;

	for (const key in shape) {
		const childDef = shape[key];
		const childErr = ensureChildErrorNode(e, key, childDef);

		if (
			isInitial &&
			!(key in v) &&
			!isFieldOptionalOnInitial(childDef)
		) {
			assignMissingRequiredError(childErr);
			continue;
		}

		if (key in v) {
			validateNodeFull(types, childDef, v[key], childErr, isInitial);
		}
	}
};

const validateNodePath = (
	types: Record<string, readonly ((v: unknown) => boolean | string)[]>,
	def: RuntimeEntityField,
	val: unknown,
	err: unknown,
	path: ValidationPath,
): void => {
	if (path.length === 0) {
		validateNodeFull(types, def, val, err, false);
		return;
	}

	const current = resolveLazyField(def);

	if (isOptField(current)) {
		if (val === undefined) {
			clearErrorNode(def, err);
			return;
		}
		validateNodePath(types, current.of, val, err, path);
		return;
	}

	if (isPrimaryKeyField(current)) {
		validateNodePath(types, current.of, val, err, path);
		return;
	}

	if (
		typeof current === "string" ||
		isOneOfField(current) ||
		isRefField(current)
	) {
		validateNodeFull(types, def, val, err, false);
		return;
	}

	if (isArrayField(current)) {
		if (!isRecord(err)) return;
		const e = err as Record<string, unknown>;

		if (!Array.isArray(val)) {
			clearErrorNode(current, err);
			setArrayExpectedError(e);
			return;
		}

		e.__self = undefined;

		const [head, ...tail] = path;
		const index = normalizeIndex(head);
		if (index === undefined) {
			return;
		}

		const key = String(index);
		if (index < 0 || index >= val.length) {
			if (key in e) {
				clearErrorNode(current.of, e[key]);
				delete e[key];
			}
			return;
		}

		const childErr = ensureChildErrorNode(e, key, current.of);
		validateNodePath(types, current.of, val[index], childErr, tail);
		return;
	}

	if (isDictField(current)) {
		if (!isRecord(err)) return;
		const e = err as Record<string, unknown>;

		if (!isObjectContainer(val)) {
			clearErrorNode(current, err);
			setObjectExpectedError(e);
			return;
		}

		const v = val as Record<string, unknown>;
		const only = current.__only;
		if (only) {
			const allowed = new Set(only);
			const bad = Object.keys(v).filter((key) => !allowed.has(key));
			e.__self = bad.length
				? `unexpected keys: ${bad.join(", ")}`
				: undefined;
		} else {
			e.__self = undefined;
		}

		const [head, ...tail] = path;
		const key = toObjectKey(head);

		if (only && !only.includes(key)) {
			if (key in e) {
				clearErrorNode(current.of, e[key]);
				delete e[key];
			}
			return;
		}

		if (!(key in v)) {
			if (key in e) {
				clearErrorNode(current.of, e[key]);
				delete e[key];
			}
			return;
		}

		const childErr = ensureChildErrorNode(e, key, current.of);
		validateNodePath(types, current.of, v[key], childErr, tail);
		return;
	}

	if (!isRecord(err)) return;
	const e = err as Record<string, unknown>;

	if (!isObjectContainer(val)) {
		clearErrorNode(current, err);
		setObjectExpectedError(e);
		return;
	}

	e.__self = undefined;

	const shape = current as Record<string, RuntimeEntityField>;
	const [head, ...tail] = path;
	const key = toObjectKey(head);
	const childDef = shape[key];
	if (!childDef) {
		return;
	}

	const childErr = ensureChildErrorNode(e, key, childDef);
	if (!(key in (val as Record<string, unknown>))) {
		clearErrorNode(childDef, childErr);
		return;
	}

	validateNodePath(
		types,
		childDef,
		(val as Record<string, unknown>)[key],
		childErr,
		tail,
	);
};

export const validateState = (
	types: Record<string, readonly ((v: unknown) => boolean | string)[]>,
	definition: Record<string, RuntimeEntityField>,
	value: unknown,
	errors: unknown,
	isInitial: boolean,
) => {
	if (!isObjectContainer(value) || !isRecord(errors)) {
		return;
	}

	const v = value as Record<string, unknown>;
	const e = errors as Record<string, unknown>;

	for (const key in definition) {
		if (!(key in e)) {
			e[key] = makeErrorNode(definition[key]);
		}
		validateNodeFull(types, definition[key], v[key], e[key], isInitial);
	}
};

export const validateStateAtPaths = (
	types: Record<string, readonly ((v: unknown) => boolean | string)[]>,
	definition: Record<string, RuntimeEntityField>,
	value: unknown,
	errors: unknown,
	paths: readonly ValidationPath[],
) => {
	if (!isObjectContainer(value) || !isRecord(errors) || !paths.length) {
		return;
	}

	const normalizedPaths = normalizeValidationPaths(paths);
	const v = value as Record<string, unknown>;
	const e = errors as Record<string, unknown>;

	for (const path of normalizedPaths) {
		if (!path.length) {
			validateState(types, definition, value, errors, false);
			return;
		}

		const [head, ...tail] = path;
		if (typeof head !== "string") {
			continue;
		}

		const def = definition[head];
		if (!def) {
			continue;
		}

		if (!(head in e)) {
			e[head] = makeErrorNode(def);
		}

		if (tail.length === 0) {
			validateNodeFull(types, def, v[head], e[head], false);
			continue;
		}

		validateNodePath(types, def, v[head], e[head], tail);
	}
};

export const validateStatePaths = validateStateAtPaths;
