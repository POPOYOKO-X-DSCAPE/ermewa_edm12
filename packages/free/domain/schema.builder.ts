import type {
	ArrayField,
	DictField,
	EntityField,
	LazyField,
	OneOfField,
	OptionalField,
	PrimaryKeyField,
	RefField,
	SelfField,
} from "../core/dsl/state.definition";
import type { InferFieldState } from "../core/infer/state.infer";
import {
	type RuntimeEntityField,
	buildErrorTree,
	isArrayField,
	isDictField,
	isLazyField,
	isOptField,
	isPrimaryKeyField,
	isRefField,
	validateState,
} from "../core/runtime/state.validation";

type TypeEngineLike<D extends Record<string, unknown>> = {
	load(): D;
};

type Validators = Record<
	string,
	readonly ((v: unknown) => boolean | string)[]
>;

type SchemaHelpers<D extends Record<string, unknown>> = {
	array<F extends EntityField<D>>(
		of: F,
	): { readonly __kind: "array"; readonly of: F };
	optional<F extends EntityField<D>>(
		of: F,
	): { readonly __kind: "opt"; readonly of: F };
	dict<F extends EntityField<D>>(of: F): DictField<D, F>;

	oneOf<
		const T extends readonly (
			| string
			| number
			| boolean
			| null
			| undefined
		)[],
	>(...values: T): OneOfField<T>;

	lazy<F extends EntityField<D>>(
		build: (self: SelfField) => F,
	): LazyField<D, F>;
};

export type Unchecked<T> = T & { readonly __unchecked: unique symbol };

type IssueSeverity = "error" | "warn";

export type SchemaIssueCode =
	| "type_mismatch"
	| "missing_required"
	| "invalid_value"
	| "unknown_key"
	| "dict_key_not_allowed";

export type SchemaIssue = {
	readonly code: SchemaIssueCode;
	readonly path: readonly (string | number)[];
	readonly severity: IssueSeverity;
	readonly message: string;
	readonly actual?: unknown;
	readonly expected?: string;
};

export type SchemaHealth = {
	readonly ok: boolean;
	readonly perfect: boolean;
	readonly errors: number;
	readonly warnings: number;
};

type ErrorLeaf = readonly string[];
type ErrorSelf = { readonly __self?: string | undefined };

type EmptyObj = Record<never, never>;

// depth limiter to prevent TS2589
type PrevDepth = [0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
type DecDepth<N extends number> = N extends keyof PrevDepth
	? PrevDepth[N]
	: 0;

type ErrorTreeFor<
	D extends Record<string, unknown>,
	F,
	Depth extends number = 7,
> = Depth extends 0
	? unknown
	: // Scalars
		F extends string
		? ErrorLeaf
		: F extends PrimaryKeyField<infer _T>
			? ErrorLeaf
			: // oneOf
				F extends OneOfField<infer _T>
				? ErrorLeaf
				: // Optional wrapper (dsl)
					F extends OptionalField<D, infer OF>
					? ErrorTreeFor<D, OF, DecDepth<Depth>>
					: // Optional wrapper (runtime node)
						F extends { readonly __kind: "opt"; readonly of: infer OF }
						? ErrorTreeFor<D, OF, DecDepth<Depth>>
						: // Refs
							F extends RefField<infer _MIN, infer _MAX, infer _K>
							? ErrorLeaf
							: // Arrays (dsl)
								F extends ArrayField<D, infer OF>
								? ErrorSelf & {
										readonly [index: string]: ErrorTreeFor<
											D,
											OF,
											DecDepth<Depth>
										>;
									}
								: // Arrays (runtime node)
									F extends {
											readonly __kind: "array";
											readonly of: infer OF;
										}
									? ErrorSelf & {
											readonly [index: string]: ErrorTreeFor<
												D,
												OF,
												DecDepth<Depth>
											>;
										}
									: // Dicts (dsl)
										F extends DictField<D, infer OF, infer K>
										? ErrorSelf & {
												readonly [key: string]: ErrorTreeFor<
													D,
													OF,
													DecDepth<Depth>
												>;
											} & (string extends K
													? EmptyObj
													: {
															readonly [P in K]?: ErrorTreeFor<
																D,
																OF,
																DecDepth<Depth>
															>;
														})
										: // Dicts (runtime node)
											F extends {
													readonly __kind: "dict";
													readonly of: infer OF;
													readonly __only?: readonly (infer K extends
														string)[];
												}
											? ErrorSelf & {
													readonly [key: string]: ErrorTreeFor<
														D,
														OF,
														DecDepth<Depth>
													>;
												} & (string extends K
														? EmptyObj
														: {
																readonly [P in K]?: ErrorTreeFor<
																	D,
																	OF,
																	DecDepth<Depth>
																>;
															})
											: // Objects
												F extends {
														readonly [key: string]: EntityField<D>;
													}
												? ErrorSelf & {
														readonly [P in keyof F &
															string]: ErrorTreeFor<
															D,
															F[P],
															DecDepth<Depth>
														>;
													}
												: unknown;

export type SchemaErrorView<Tree> = {
	readonly list: readonly SchemaIssue[];
	readonly tree: Tree; // getter
};

export type Parsed<T, Tree> = {
	readonly value: T;
	readonly health: SchemaHealth;
	readonly error: SchemaErrorView<Tree>;
	readonly lean: LeanParsed<T, Tree>;
};

export type LeanParsed<T, Tree> = {
	readonly value: T;
	readonly health: SchemaHealth;
	readonly error: SchemaErrorView<Tree>;
};

export type SchemaInstance<T, Tree = unknown> = {
	parse(input: unknown): Parsed<T, Tree>;
	readonly infer: T;
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
	typeof v === "object" && v !== null;

const isNonEmptyString = (v: unknown): v is string =>
	typeof v === "string" && v.length > 0;

/**
 * Clone the error tree while preserving its shape.
 * Removes warn-only messages from __self (currently: dict.only "unexpected keys: ...").
 * Keeps every branch/key that exists in the original tree.
 */
const cloneLeanTreePreserveShape = <Tree>(node: Tree): Tree => {
	const walk = (n: unknown): unknown => {
		if (Array.isArray(n)) return n.slice();

		if (!isRecord(n)) return n;

		const out: Record<string, unknown> = {};
		for (const k of Object.keys(n)) {
			if (k === "__self") {
				const self = n.__self;
				if (
					isNonEmptyString(self) &&
					self.startsWith("unexpected keys:")
				) {
					out.__self = undefined;
				} else {
					out.__self = self;
				}
				continue;
			}
			out[k] = walk(n[k]);
		}
		return out;
	};

	return walk(node) as unknown as Tree;
};

const isRefRuntime = (v: unknown): v is { readonly __kind: "ref" } =>
	isRecord(v) && v.__kind === "ref";

type LazyLike = {
	readonly __kind: "lazy";
	readonly get: () => unknown;
};

const isLazyLike = (field: unknown): field is LazyLike =>
	isRecord(field) &&
	field.__kind === "lazy" &&
	typeof field.get === "function";

const assertNoRefs = (
	field: unknown,
	path: readonly (string | number)[] = [],
	seen: ReadonlySet<object> = new Set<object>(),
) => {
	if (typeof field === "string") return;
	if (!isRecord(field)) return;

	if (isRefRuntime(field)) {
		throw new Error(
			`Refs are not allowed in createSchema (at ${path.join(".")})`,
		);
	}

	if (seen.has(field)) return;

	const nextSeen = new Set(seen);
	nextSeen.add(field);

	if (isLazyLike(field)) {
		assertNoRefs(field.get(), [...path, "get"], nextSeen);
		return;
	}

	if (field.__kind === "array" && "of" in field) {
		assertNoRefs(field.of, [...path, "of"], nextSeen);
		return;
	}

	if (field.__kind === "opt" && "of" in field) {
		assertNoRefs(field.of, [...path, "of"], nextSeen);
		return;
	}

	if (field.__kind === "oneOf" && "values" in field) {
		return;
	}

	if (field.__kind === "dict" && "of" in field) {
		assertNoRefs(field.of, [...path, "of"], nextSeen);
		return;
	}

	for (const k of Object.keys(field)) {
		assertNoRefs(field[k], [...path, k], nextSeen);
	}
};

const unwrapRuntimeField = (
	field: RuntimeEntityField,
): RuntimeEntityField => {
	let current = field;

	while (isLazyField(current)) {
		current = current.get();
	}

	return current;
};

const sanitizeField = (
	def: RuntimeEntityField,
	val: unknown,
): unknown => {
	// def = resolveLazyField(def);
	const current = unwrapRuntimeField(def);

	if (isOptField(current)) {
		if (val === undefined) return undefined;
		return sanitizeField(current.of, val);
	}

	if (isPrimaryKeyField(current)) return sanitizeField(current.of, val);

	if (typeof current === "string") return val;
	if (isRecord(current) && current.__kind === "oneOf") return val;
	if (isRefField(current)) return val;

	if (isArrayField(current)) {
		if (!Array.isArray(val)) return val;
		return val.map((it) => sanitizeField(current.of, it));
	}

	if (isDictField(current)) {
		if (typeof val !== "object" || val === null || Array.isArray(val))
			return val;

		const src = val as Record<string, unknown>;
		const out: Record<string, unknown> = {};
		const only = current.__only;

		if (only) {
			for (const k of only) {
				if (k in src) out[k] = sanitizeField(current.of, src[k]);
			}
			return out;
		}

		for (const k of Object.keys(src))
			out[k] = sanitizeField(current.of, src[k]);
		return out;
	}

	if (typeof current === "object" && current !== null) {
		if (typeof val !== "object" || val === null || Array.isArray(val))
			return val;

		const src = val as Record<string, unknown>;
		const out: Record<string, unknown> = {};

		for (const k of Object.keys(current)) {
			if (k in src) {
				out[k] = sanitizeField(
					(current as Record<string, RuntimeEntityField>)[k],
					src[k],
				);
			}
		}
		return out;
	}

	return val;
};

const toPathSegment = (k: string): string | number =>
	/^(0|[1-9]\d*)$/.test(k) ? Number(k) : k;

const getAtPath = (
	root: unknown,
	path: readonly (string | number)[],
): unknown => {
	let cur: unknown = root;
	for (const seg of path) {
		if (cur === null || cur === undefined) return undefined;

		if (typeof seg === "number") {
			if (!Array.isArray(cur)) return undefined;
			cur = cur[seg];
			continue;
		}

		// string key
		if (!isRecord(cur)) return undefined;
		cur = cur[seg];
	}
	return cur;
};

const inferExpected = (
	code: SchemaIssueCode,
	message: string,
): string | undefined => {
	if (code === "type_mismatch") {
		if (message === "expected object") return "object";
		if (message === "expected array") return "array";
		return undefined;
	}

	if (message.startsWith("not a ")) {
		return message.slice("not a ".length).trim() || undefined;
	}

	return undefined;
};

const collectIssuesFromTree = (
	err: unknown,
	path: readonly (string | number)[],
	issues: SchemaIssue[],
	rootInput: unknown,
) => {
	if (Array.isArray(err)) {
		for (const m of err) {
			const msg = m;
			if (msg === "missing required field") {
				issues.push({
					code: "missing_required",
					path,
					severity: "error",
					message: msg,
					// actual: getAtPath(rootInput, path),
					// expected: "present",
				});
			} else {
				issues.push({
					code: "invalid_value",
					path,
					severity: "error",
					message: msg,
					actual: getAtPath(rootInput, path),
					expected: inferExpected("invalid_value", msg),
				});
			}
		}
		return;
	}

	if (!isRecord(err)) return;

	const self = err.__self;
	if (typeof self === "string" && self.length > 0) {
		if (self === "expected object" || self === "expected array") {
			issues.push({
				code: "type_mismatch",
				path,
				severity: "error",
				message: self,
				actual: getAtPath(rootInput, path),
				expected: inferExpected("type_mismatch", self),
			});
		} else if (self === "missing required field") {
			issues.push({
				code: "missing_required",
				path,
				severity: "error",
				message: self,
				// actual: getAtPath(rootInput, path),
				// expected: "present",
			});
		} else if (self.startsWith("unexpected keys:")) {
			const raw = self.slice("unexpected keys:".length).trim();
			const parts = raw.length ? raw.split(",") : [];
			if (parts.length) {
				for (const p of parts) {
					const key = p.trim();
					if (!key) continue;
					const _p = [...path, key] as const;
					issues.push({
						code: "dict_key_not_allowed",
						path: _p,
						severity: "warn",
						message: "dict key not allowed",
						actual: getAtPath(rootInput, _p),
						expected: "allowed key",
					});
				}
			} else {
				issues.push({
					code: "dict_key_not_allowed",
					path,
					severity: "warn",
					message: self,
					actual: getAtPath(rootInput, path),
				});
			}
		} else {
			issues.push({
				code: "invalid_value",
				path,
				severity: "error",
				message: self,
				actual: getAtPath(rootInput, path),
				expected: inferExpected("invalid_value", self),
			});
		}
	}

	for (const k of Object.keys(err)) {
		if (k === "__self") continue;
		collectIssuesFromTree(
			err[k],
			[...path, toPathSegment(k)],
			issues,
			rootInput,
		);
	}
};

const collectUnknownKeyWarnings = (
	def: RuntimeEntityField,
	val: unknown,
	path: readonly (string | number)[],
	issues: SchemaIssue[],
) => {
	const current = unwrapRuntimeField(def);

	if (isOptField(current)) {
		if (val === undefined) return;
		return collectUnknownKeyWarnings(current.of, val, path, issues);
	}

	if (isPrimaryKeyField(current)) {
		return collectUnknownKeyWarnings(current.of, val, path, issues);
	}

	if (typeof current === "string" || isRefField(current)) return;

	if (isArrayField(current)) {
		if (!Array.isArray(val)) return;

		for (let i = 0; i < val.length; i++) {
			collectUnknownKeyWarnings(
				current.of,
				val[i],
				[...path, i],
				issues,
			);
		}
		return;
	}

	if (isDictField(current)) {
		if (typeof val !== "object" || val === null || Array.isArray(val))
			return;

		const obj = val as Record<string, unknown>;
		const only = current.__only;

		for (const k of Object.keys(obj)) {
			if (only && !only.includes(k)) continue;
			collectUnknownKeyWarnings(
				current.of,
				obj[k],
				[...path, k],
				issues,
			);
		}
		return;
	}

	if (typeof current === "object" && current !== null) {
		if (typeof val !== "object" || val === null || Array.isArray(val))
			return;

		const obj = val as Record<string, unknown>;
		const shape = current as Record<string, RuntimeEntityField>;
		const schemaKeys = new Set(Object.keys(shape));

		for (const k of Object.keys(obj)) {
			if (!schemaKeys.has(k)) {
				issues.push({
					code: "unknown_key",
					path: [...path, k],
					severity: "warn",
					message: "unknown key",
				});
			}
		}

		for (const k of Object.keys(shape)) {
			if (k in obj) {
				collectUnknownKeyWarnings(
					shape[k],
					obj[k],
					[...path, k],
					issues,
				);
			}
		}
	}
};

const makeHealth = (issues: readonly SchemaIssue[]): SchemaHealth => {
	let errors = 0;
	let warnings = 0;

	for (const i of issues) {
		if (i.severity === "error") errors++;
		else warnings++;
	}

	return {
		errors,
		warnings,
		ok: errors === 0,
		perfect: errors === 0 && warnings === 0,
	};
};

export const makeDictField = <
	D extends Record<string, unknown>,
	OF extends EntityField<D>,
	K extends string = string,
>(
	of: OF,
	only?: readonly K[],
): DictField<D, OF, K> => {
	const node = {
		__kind: "dict",
		of,
		__only: only,
	} as unknown as DictField<D, OF, K>;

	Object.defineProperty(node, "only", {
		value: (<const A extends readonly string[]>(...keys: A) =>
			makeDictField<D, OF, A[number]>(
				of,
				keys,
			)) as unknown as DictField<D, OF, K>["only"],
		enumerable: false,
	});

	return node;
};

export const schemaBuilder = <D extends Record<string, unknown>>(deps: {
	appTypes: TypeEngineLike<D>;
}) => {
	const types = deps.appTypes.load();

	return {
		createSchema: <const Def extends EntityField<typeof types>>(
			definition: (h: SchemaHelpers<typeof types>) => Def,
		): SchemaInstance<
			InferFieldState<typeof types, Def>,
			ErrorTreeFor<typeof types, Def>
		> => {
			const replaceSelf = (
				field: EntityField<typeof types>,
				selfToken: SelfField,
				selfLazy: LazyField<typeof types, EntityField<typeof types>>,
			): EntityField<typeof types> => {
				// token match by identity
				if (field === selfToken) return selfLazy;

				if (typeof field === "string") return field;

				if (typeof field !== "object" || field === null) return field;

				// tagged nodes
				if ("__kind" in field) {
					const k = (field as { __kind?: unknown }).__kind;

					if (k === "array") {
						const f = field as {
							__kind: "array";
							of: EntityField<typeof types>;
						};
						return {
							__kind: "array",
							of: replaceSelf(f.of, selfToken, selfLazy),
						} as const;
					}

					if (k === "opt") {
						const f = field as {
							__kind: "opt";
							of: EntityField<typeof types>;
						};
						return {
							__kind: "opt",
							of: replaceSelf(f.of, selfToken, selfLazy),
						} as const;
					}

					if (k === "oneOf") {
						return field as EntityField<typeof types>;
					}

					if (k === "dict") {
						const f = field as {
							__kind: "dict";
							of: EntityField<typeof types>;
							__only?: readonly string[];
						};
						return makeDictField(
							replaceSelf(f.of, selfToken, selfLazy),
							f.__only,
						) as unknown as EntityField<typeof types>;
					}

					// primaryKey / ref / lazy => keep as-is
					return field as EntityField<typeof types>;
				}

				// plain object schema
				const obj = field as Record<string, EntityField<typeof types>>;
				const out: Record<string, EntityField<typeof types>> = {};
				for (const key of Object.keys(obj)) {
					out[key] = replaceSelf(obj[key], selfToken, selfLazy);
				}
				return out;
			};

			const lazy = <F extends EntityField<typeof types>>(
				build: (self: SelfField) => F,
			): LazyField<typeof types, F> => {
				const selfToken: SelfField = { __kind: "self" } as const;

				let cached: F | undefined;

				// typed as wide for replacement
				const selfLazy: LazyField<
					typeof types,
					EntityField<typeof types>
				> = {
					__kind: "lazy",
					get: () => {
						if (cached !== undefined) return cached;

						const built = build(selfToken) as unknown as EntityField<
							typeof types
						>;
						const resolved = replaceSelf(
							built,
							selfToken,
							selfLazy,
						) as unknown as F;

						cached = resolved;
						return cached;
					},
				};

				return selfLazy as unknown as LazyField<typeof types, F>;
			};

			const def = definition({
				array: (of) => ({ __kind: "array", of }) as const,
				optional: (of) => ({ __kind: "opt", of }) as const,
				oneOf: (...values) =>
					({
						__kind: "oneOf",
						values,
					}) as const,
				dict: (of) => makeDictField(of),
				lazy,
			});
			assertNoRefs(def);

			const runtimeDef = def as unknown as RuntimeEntityField;

			return {
				parse(input: unknown) {
					type Tree = ErrorTreeFor<typeof types, Def>;

					const wrappedSchema: Record<string, RuntimeEntityField> = {
						__root: runtimeDef,
					};

					const errors = buildErrorTree(wrappedSchema) as Record<
						string,
						unknown
					>;

					validateState(
						types as unknown as Validators,
						wrappedSchema,
						{ __root: input },
						errors,
						true,
					);

					const rootErrors = (errors as Record<string, unknown>).__root;
					const rootTree = rootErrors as unknown as Tree;

					const fullValue = input as InferFieldState<typeof types, Def>;

					const issues: SchemaIssue[] = [];
					collectIssuesFromTree(rootErrors, [], issues, input);
					collectUnknownKeyWarnings(runtimeDef, input, [], issues);
					Object.freeze(issues);

					const issuesLean = issues.filter(
						(i) => i.severity === "error",
					);
					Object.freeze(issuesLean);

					const health = makeHealth(issues);
					const healthLean = makeHealth(issuesLean);

					const errorAll: SchemaErrorView<Tree> = {
						list: issues,
						get tree() {
							return rootTree;
						},
					};

					let leanTreeReady = false;
					let leanTreeCache: Tree | undefined = undefined;

					const errorLean: SchemaErrorView<Tree> = {
						list: issuesLean,
						get tree() {
							if (!leanTreeReady) {
								leanTreeCache =
									cloneLeanTreePreserveShape<Tree>(rootTree);
								leanTreeReady = true;
							}
							return leanTreeCache as Tree;
						},
					};

					let leanCache:
						| LeanParsed<InferFieldState<typeof types, Def>, Tree>
						| undefined;

					const buildLean = (): LeanParsed<
						InferFieldState<typeof types, Def>,
						Tree
					> => {
						if (leanCache) return leanCache;

						const leanValue = sanitizeField(
							runtimeDef,
							input,
						) as InferFieldState<typeof types, Def>;

						const view: LeanParsed<
							InferFieldState<typeof types, Def>,
							Tree
						> = {
							value: leanValue,
							health: healthLean,
							error: errorLean,
						};

						leanCache = view;
						return view;
					};

					const parsed: Parsed<
						InferFieldState<typeof types, Def>,
						Tree
					> = {
						value: fullValue,
						health,
						error: errorAll,
						get lean() {
							return buildLean();
						},
					};

					return parsed;
				},
				infer: undefined as unknown as InferFieldState<
					typeof types,
					Def
				>,
			};
		},
	};
};
