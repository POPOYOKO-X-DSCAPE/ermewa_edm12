import type {
	AdaptBuilder,
	AdaptedApi,
	AdaptedPostValidation,
	AdapterUnitFor,
	ApiResult,
	ApiSpec,
	AuthMode,
	BodyToken,
	CallBaseArgs,
	EndpointDef,
	GeneratedApi,
	Headers,
	Health,
	HttpError,
	Issue,
	LowerMethod,
	NamespaceConfig,
	RequestToken,
	ResponseToken,
	Result,
	SchemaLike,
	VerbConfig,
	VerbDef,
} from "../infer/api.infer";

import { httpEngine } from "./http.engine";

/* ============================================================
 * Defaults (namespace/global)
 * ============================================================ */

type DefaultsInput = {
	headers?: Headers;
	auth?: AuthMode;
	timeoutMs?: number;
	credentials?: RequestCredentials;
};

const defaultsToTokens = (
	d?: DefaultsInput,
): readonly RequestToken[] => {
	if (!d) return [];
	const out: RequestToken[] = [];
	if (d.headers) out.push({ kind: "headers", headers: d.headers });
	if (d.auth) out.push({ kind: "auth", mode: d.auth });
	if (typeof d.timeoutMs === "number")
		out.push({ kind: "timeout", timeoutMs: d.timeoutMs });
	if (d.credentials)
		out.push({ kind: "credentials", value: d.credentials });
	return out;
};

/* ============================================================
 * Codec factories
 * - json<T> is used via instantiation expression: json<MyType>
 * - json(schema) returns a factory as well
 * ============================================================ */

function json<T>(): { as: "json"; __t?: T };
function json<T>(
	schema: SchemaLike<T>,
): () => { as: "json"; __t?: T; schema: SchemaLike<T> };
function json<T>(schema?: SchemaLike<T>) {
	if (schema) {
		return () =>
			({ as: "json" as const, schema }) as {
				as: "json";
				__t?: T;
				schema: SchemaLike<T>;
			};
	}
	return { as: "json" as const } as { as: "json"; __t?: T };
}

const text = () => ({ as: "text" as const }) as { as: "text" };
const raw = () => ({ as: "raw" as const }) as { as: "raw" };
const blob = () => ({ as: "blob" as const }) as { as: "blob" };
const formData = () =>
	({ as: "formData" as const }) as { as: "formData" };

/* ============================================================
 * Convert DX VerbDef -> internal VerbConfig + internal tokens for httpEngine
 * ============================================================ */

const verbTokens = (v: VerbDef): readonly RequestToken[] => {
	const out: RequestToken[] = [];
	if (v.headers) out.push({ kind: "headers", headers: v.headers });
	if (v.auth) out.push({ kind: "auth", mode: v.auth });
	if (typeof v.timeoutMs === "number")
		out.push({ kind: "timeout", timeoutMs: v.timeoutMs });
	if (v.credentials)
		out.push({ kind: "credentials", value: v.credentials });
	return out;
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
	typeof v === "object" && v !== null;

const schemaFromCodec = (
	c: unknown,
): SchemaLike<unknown> | undefined => {
	if (!isRecord(c)) return undefined;
	const s = c.schema;
	if (!s || !isRecord(s)) return undefined;
	const parse = s.parse;
	return typeof parse === "function"
		? (s as SchemaLike<unknown>)
		: undefined;
};

const payloadToResponseToken = (
	f: VerbDef["payload"],
): ResponseToken<unknown> => {
	const c = f();
	if (c.as === "json")
		return { kind: "response", as: "json", schema: schemaFromCodec(c) };
	if (c.as === "text") return { kind: "response", as: "text" };
	if (c.as === "raw") return { kind: "response", as: "raw" };
	return { kind: "response", as: "blob" };
};

const bodyToBodyToken = (
	f: Exclude<VerbDef["body"], undefined>,
): BodyToken<unknown> => {
	const c = f();
	if (c.as === "json")
		return { kind: "body", as: "json", schema: schemaFromCodec(c) };
	if (c.as === "formData") return { kind: "body", as: "formData" };
	if (c.as === "text") return { kind: "body", as: "text" };
	return { kind: "body", as: "blob" };
};

const toVerbConfig = (v: VerbDef): VerbConfig => ({
	request: verbTokens(v),
	response: payloadToResponseToken(v.payload),
	body: v.body ? bodyToBodyToken(v.body) : undefined,
});

/* ============================================================
 * Join path+query at runtime (query auto '?')
 * ============================================================ */

const normalizeQuery = (q: string) => {
	if (!q) return "";
	if (q.startsWith("?") || q.startsWith("&")) return q;
	return `?${q}`;
};

const joinPathQuery = (path: string, query: string) => {
	const q = normalizeQuery(query);
	if (!q) return path;
	if (!path) return q;
	if (path.includes("?")) {
		const tail = q.startsWith("?")
			? q.slice(1)
			: q.startsWith("&")
				? q.slice(1)
				: q;
		return `${path}&${tail}`;
	}
	return `${path}${q.startsWith("&") ? `?${q.slice(1)}` : q}`;
};

/* ============================================================
 * Namespace builder (base/prefix/defaults/endpoints)
 * ============================================================ */

type NamespaceBuilder = {
	base(url: string): NamespaceBuilder;
	prefix(pathPrefix: string): NamespaceBuilder;
	defaults(d: DefaultsInput): NamespaceBuilder;

	endpoints<const E>(
		endpoints: E,
	): E extends Record<string, EndpointDef> ? NamespaceConfig<E> : never;
};

type HttpDsl = {
	base(url: string): NamespaceBuilder;
	prefix(pathPrefix: string): NamespaceBuilder;
	defaults(d: DefaultsInput): NamespaceBuilder;

	endpoints<const E>(
		endpoints: E,
	): E extends Record<string, EndpointDef> ? NamespaceConfig<E> : never;

	// codecs (used without parentheses)
	json: typeof json;
	text: typeof text;
	raw: typeof raw;
	blob: typeof blob;
	formData: typeof formData;

	// auth modes
	authRequired: "required";
	authOptional: "optional";
	authNone: "none";
};

const makeNamespaceBuilder = (seed?: {
	baseUrl?: string;
	pathPrefix?: string;
	defaults?: readonly RequestToken[];
}): NamespaceBuilder => {
	const currentBaseUrl = seed?.baseUrl;
	const currentPathPrefix = seed?.pathPrefix;
	const currentDefaults = seed?.defaults ?? [];

	const withBase = (baseUrl: string) =>
		makeNamespaceBuilder({
			baseUrl,
			pathPrefix: currentPathPrefix,
			defaults: currentDefaults,
		});

	const withPrefix = (pathPrefix: string) =>
		makeNamespaceBuilder({
			baseUrl: currentBaseUrl,
			pathPrefix,
			defaults: currentDefaults,
		});

	const withDefaults = (d: DefaultsInput) =>
		makeNamespaceBuilder({
			baseUrl: currentBaseUrl,
			pathPrefix: currentPathPrefix,
			defaults: [...currentDefaults, ...defaultsToTokens(d)],
		});

	const endpoints = <const E>(
		eps: E,
	): E extends Record<string, EndpointDef>
		? NamespaceConfig<E>
		: never =>
		({
			baseUrl: currentBaseUrl,
			pathPrefix: currentPathPrefix,
			defaults: currentDefaults,
			endpoints: eps,
		}) as unknown as E extends Record<string, EndpointDef>
			? NamespaceConfig<E>
			: never;

	return {
		base: withBase,
		prefix: withPrefix,
		defaults: withDefaults,
		endpoints,
	};
};

const makeHttpDsl = (): HttpDsl => ({
	base(url) {
		return makeNamespaceBuilder().base(url);
	},
	prefix(pathPrefix) {
		return makeNamespaceBuilder().prefix(pathPrefix);
	},
	defaults(d) {
		return makeNamespaceBuilder().defaults(d);
	},
	endpoints(eps) {
		return makeNamespaceBuilder().endpoints(eps);
	},

	json,
	text,
	raw,
	blob,
	formData,

	authRequired: "required",
	authOptional: "optional",
	authNone: "none",
});

/* ============================================================
 * Adapters runtime types (0 any)
 * ============================================================ */

type AdaptStage = Readonly<{
	schema: SchemaLike<unknown>;
	map: (input: unknown) => unknown;
}>;

type PostAdapter = Readonly<{
	body?: AdaptStage;
	payload?: AdaptStage;
}>;

type GetAdapter = Readonly<{
	schema: SchemaLike<unknown>;
	map: (legacy: unknown, rawPayload?: unknown) => unknown;
}>;

type AdapterVerb = GetAdapter | PostAdapter;

type AdapterTree = Readonly<
	Record<
		string,
		Readonly<Record<string, Partial<Record<LowerMethod, AdapterVerb>>>>
	>
>;

type WithAdaptersOptions = Readonly<{ withoutSanitize?: boolean }>;

const perfectHealth: Health = Object.freeze({
	ok: true,
	perfect: true,
	errors: 0,
	warnings: 0,
});

const parseMaybe = (
	raw: unknown,
	schema: SchemaLike<unknown> | undefined,
	withoutSanitize: boolean,
): { data: unknown; issues: readonly Issue[]; health: Health } => {
	if (!schema) return { data: raw, issues: [], health: perfectHealth };

	const parsed = schema.parse(raw);

	if (withoutSanitize) {
		return {
			data: parsed.value,
			issues: parsed.error.list,
			health: parsed.health,
		};
	}

	return {
		data: parsed.lean.value,
		issues: parsed.lean.error.list,
		health: parsed.lean.health,
	};
};

const mergeAdapters = <S extends ApiSpec>(
	units: readonly AdapterUnitFor<S>[],
): AdapterTree => {
	const out: Record<
		string,
		Record<string, Partial<Record<LowerMethod, AdapterVerb>>>
	> = {};

	for (const u of units) {
		if (!isRecord(u)) continue;

		for (const ns of Object.keys(u)) {
			const nsVal = u[ns];
			if (!isRecord(nsVal)) continue;

			if (!(ns in out)) out[ns] = {};

			for (const ep of Object.keys(nsVal)) {
				const epVal = nsVal[ep];
				if (!isRecord(epVal)) continue;

				if (!(ep in out[ns])) out[ns][ep] = {};

				for (const verb of Object.keys(epVal)) {
					const v = verb as LowerMethod;
					const adapter = epVal[v];
					out[ns][ep][v] = adapter as AdapterVerb;
				}
			}
		}
	}

	return out as AdapterTree;
};

/* ============================================================
 * apiFactory
 * ============================================================ */

type FetchLike = Parameters<typeof httpEngine>[0]["fetch"];

type WithAdaptersFn<S extends ApiSpec> = <
	const Units extends readonly AdapterUnitFor<S>[],
>(
	...args: [...Units, WithAdaptersOptions?]
) => AdaptedApi<S, Units>;

export const apiFactory = <S extends ApiSpec>(
	deps: {
		fetch: FetchLike;
		resolveAuth?: () => string | undefined;
		defaults?: {
			baseUrl?: string;
			headers?: Headers;
			timeoutMs?: number;
			auth?: AuthMode;
			credentials?: RequestCredentials;
		};
	},
	define: (args: { http: HttpDsl }) => S,
): GeneratedApi<S> & {
	withAdapters: WithAdaptersFn<S>;
	adapt: AdaptBuilder<S>;
} => {
	const engine = httpEngine({
		fetch: deps.fetch,
		resolveAuth: deps.resolveAuth,
		defaults: deps.defaults,
	});

	const http = makeHttpDsl();
	const spec = define({ http });

	const api: Record<string, unknown> = {};

	// Build raw api first
	for (const ns in spec) {
		const nsCfg = spec[ns] as NamespaceConfig;
		const nsObj: Record<string, unknown> = {};
		const endpoints = nsCfg.endpoints as Record<string, EndpointDef>;

		for (const ep in endpoints) {
			const def = endpoints[ep];

			const localPath = joinPathQuery(def.path ?? "", def.query ?? "");
			const prefix = nsCfg.pathPrefix ?? "";
			const fullPath = prefix ? `${prefix}${localPath}` : localPath;

			const verbs: readonly LowerMethod[] = [
				"get",
				"post",
				"put",
				"patch",
				"delete",
			];

			for (const v of verbs) {
				const verbDef = def[v];
				if (!verbDef) continue;

				if (!(v in nsObj)) nsObj[v] = {};
				const group = nsObj[v] as Record<string, unknown>;

				const vc = toVerbConfig(verbDef);
				const requestTokens = [...nsCfg.defaults, ...vc.request];

				group[ep] = async (args: unknown) => {
					const call = args as unknown as CallBaseArgs & {
						body?: unknown;
					};

					return engine.request(
						{
							method: v.toUpperCase(),
							path: fullPath,
							baseUrl: nsCfg.baseUrl,
							defaults: undefined,
							requestTokens,
							response: vc.response,
							body: vc.body,
						},
						call,
					) as Promise<Result<unknown, HttpError>>;
				};
			}
		}

		api[ns] = nsObj;
	}

	const adaptRuntime: Record<string, unknown> = {};

	for (const ns in spec) {
		const nsCfg = spec[ns] as NamespaceConfig;
		const endpoints = nsCfg.endpoints as Record<string, EndpointDef>;

		const nsAdapt: Record<string, unknown> = {};

		for (const ep in endpoints) {
			const def = endpoints[ep];

			const epAdapt: Record<string, unknown> = {};

			if (def.get) {
				epAdapt.get = (
					schema: SchemaLike<unknown>,
					map: (legacy: unknown) => unknown,
				) => ({ [ns]: { [ep]: { get: { schema, map } } } }) as const;
			}

			type RuntimePostConfig = Readonly<{
				body?: {
					schema: SchemaLike<unknown>;
					map: (input: unknown) => unknown;
				};
				payload?: {
					schema: SchemaLike<unknown>;
					map: (legacy: unknown, rawPayload?: unknown) => unknown;
				};
			}>;

			if (def.post) {
				epAdapt.post = (cfg: RuntimePostConfig) =>
					({ [ns]: { [ep]: { post: cfg } } }) as const;
			}
			// TODO: put/patch/delete:same pattern as post

			nsAdapt[ep] = epAdapt;
		}

		adaptRuntime[ns] = nsAdapt;
	}

	// attach to api (non enumerable like withAdapters)
	Object.defineProperty(api, "adapt", {
		enumerable: false,
		value: adaptRuntime as unknown as AdaptBuilder<S>,
	});

	// Attach withAdapters
	const withAdaptersImpl: WithAdaptersFn<S> = (...args) => {
		const last = args.length ? args[args.length - 1] : undefined;

		const hasOptions =
			isRecord(last) &&
			"withoutSanitize" in last &&
			(typeof (last as Record<string, unknown>).withoutSanitize ===
				"boolean" ||
				(last as Record<string, unknown>).withoutSanitize ===
					undefined);

		const opts: WithAdaptersOptions = hasOptions
			? (last as WithAdaptersOptions)
			: { withoutSanitize: false };

		const adapterUnits = (
			hasOptions ? args.slice(0, -1) : args
		) as readonly AdapterUnitFor<S>[];
		const withoutSanitize = opts.withoutSanitize === true;

		const merged = mergeAdapters(adapterUnits);

		const adaptedApi: Record<string, unknown> = {};

		for (const ns in spec) {
			const nsCfg = spec[ns] as NamespaceConfig;
			const nsObj: Record<string, unknown> = {};
			const endpoints = nsCfg.endpoints as Record<string, EndpointDef>;

			for (const ep in endpoints) {
				const def = endpoints[ep];

				const localPath = joinPathQuery(
					def.path ?? "",
					def.query ?? "",
				);
				const prefix = nsCfg.pathPrefix ?? "";
				const fullPath = prefix ? `${prefix}${localPath}` : localPath;

				const verbs: readonly LowerMethod[] = [
					"get",
					"post",
					"put",
					"patch",
					"delete",
				];

				for (const v of verbs) {
					const verbDef = def[v];
					if (!verbDef) continue;

					if (!(v in nsObj)) nsObj[v] = {};
					const group = nsObj[v] as Record<string, unknown>;

					const vc = toVerbConfig(verbDef);
					const requestTokens = [...nsCfg.defaults, ...vc.request];

					const responseSchema =
						vc.response?.as === "json" ? vc.response.schema : undefined;

					const getAdapter = merged?.[ns]?.[ep]?.[v];

					group[ep] = async (args: unknown) => {
						const call = args as unknown as CallBaseArgs & {
							body?: unknown;
						};

						// POST input validation (blocking)
						if (v === "post") {
							if (isRecord(getAdapter)) {
								const post = getAdapter as PostAdapter;
								if (post.body) {
									const parsedIn = post.body.schema.parse(call.body);
									const viewIn = withoutSanitize
										? parsedIn
										: parsedIn.lean;

									if (!viewIn.health.ok) {
										const blocked: ApiResult<
											undefined,
											undefined,
											AdaptedPostValidation
										> = {
											raw: undefined,
											data: undefined,
											errors: viewIn.error.list,
											meta: {
												adapted: true,
												validation: {
													in: viewIn.health,
													out: perfectHealth,
												},
											},
										};
										return { ok: true, value: blocked } as Result<
											ApiResult<
												undefined,
												undefined,
												AdaptedPostValidation
											>,
											HttpError
										>;
									}

									call.body = post.body.map(viewIn.value);
								}
							}
						}

						const res = (await engine.request(
							{
								method: v.toUpperCase(),
								path: fullPath,
								baseUrl: nsCfg.baseUrl,
								defaults: undefined,
								requestTokens,
								response: vc.response,
								body: vc.body,
							},
							call,
						)) as Result<unknown, HttpError>;

						if (!res.ok) return res;

						const rawPayload = res.value;

						const outParsed = parseMaybe(
							rawPayload,
							responseSchema,
							withoutSanitize,
						);

						let data = outParsed.data;
						let adapted = false;

						const tagIssues = (
							source: "external" | "adapter" | "body",
							list: readonly Issue[],
						): Issue[] =>
							list.map((i) => ({
								...i,
								code: `${source}:${i.code}`,
								path: [source, ...i.path],
							}));

						const mergeHealth = (a: Health, b: Health): Health => {
							const errors = a.errors + b.errors;
							const warnings = a.warnings + b.warnings;
							return {
								errors,
								warnings,
								ok: errors === 0,
								perfect: errors === 0 && warnings === 0,
							};
						};
						/**
						 * ============================================================
						 * GET (new model): fail fast external -> map -> parse internal
						 * - getAdapter is ALWAYS an object: { schema, map }
						 * - we do NOT merge issues: on GET we return only:
						 *   - external issues if external parse is not ok (fail fast)
						 *   - internal issues if projection parse is not ok
						 * ============================================================
						 */
						if (v === "get") {
							// helpers local to this scope (0 impact elsewhere)
							const tagIssues = (
								source: "external" | "adapter",
								list: readonly Issue[],
							): Issue[] =>
								list.map((i) => ({
									...i,
									code: `${source}:${i.code}`,
									path: [source, ...i.path],
								}));

							const mergeHealth = (a: Health, b: Health): Health => {
								const errors = a.errors + b.errors;
								const warnings = a.warnings + b.warnings;
								return {
									errors,
									warnings,
									ok: errors === 0,
									perfect: errors === 0 && warnings === 0,
								};
							};

							// external parse (best effort)
							const externalIssues = tagIssues(
								"external",
								outParsed.issues,
							);
							const externalHealth = outParsed.health;

							// no adapter -> just return external view
							if (!isRecord(getAdapter)) {
								const out: ApiResult<unknown, unknown, Health> = {
									raw: rawPayload,
									data: outParsed.data,
									errors: externalIssues,
									meta: {
										adapted: false,
										validation: externalHealth,
									},
								};

								return { ok: true, value: out } as Result<
									ApiResult<unknown, unknown, Health>,
									HttpError
								>;
							}

							// adapter exists -> project (best effort) even if external has errors
							const ga = getAdapter as GetAdapter;
							adapted = true;

							let candidate: unknown;
							let adapterIssues: Issue[] = [];
							let adapterHealth: Health = perfectHealth;

							try {
								candidate = ga.map(outParsed.data, rawPayload);
							} catch (e) {
								// security: we cannot project safely, keep external data
								adapterIssues = [
									{
										code: "adapter:ADAPTER_CRASH",
										path: ["adapter"],
										severity: "error",
										message: (e as Error)?.message ?? "Adapter crashed",
										actual: e,
										expected: "projection mapping should not throw",
									} satisfies Issue,
								];

								adapterHealth = {
									ok: false,
									perfect: false,
									errors: 1,
									warnings: 0,
								};

								const out: ApiResult<unknown, unknown, Health> = {
									raw: rawPayload,
									data: outParsed.data,
									errors: [...externalIssues, ...adapterIssues],
									meta: {
										adapted: true,
										validation: mergeHealth(
											externalHealth,
											adapterHealth,
										),
									},
								};

								return { ok: true, value: out } as Result<
									ApiResult<unknown, unknown, Health>,
									HttpError
								>;
							}

							const projected = parseMaybe(
								candidate,
								ga.schema,
								withoutSanitize,
							);

							// best effort: keep projected.data even if invalid
							data = projected.data;

							adapterIssues = tagIssues("adapter", projected.issues);
							adapterHealth = projected.health;

							const out: ApiResult<unknown, unknown, Health> = {
								raw: rawPayload,
								data,
								errors: [...externalIssues, ...adapterIssues],
								meta: {
									adapted: true,
									validation: mergeHealth(
										externalHealth,
										adapterHealth,
									),
								},
							};

							return { ok: true, value: out } as Result<
								ApiResult<unknown, unknown, Health>,
								HttpError
							>;
						}

						/**
						 * POST (existing model): keep your current behavior
						 * - body adapter stays in the POST branch you already have below
						 * - result mapping stays where it already is
						 */
						if (v === "post") {
							const post = isRecord(getAdapter)
								? (getAdapter as PostAdapter)
								: undefined;

							const parsedIn = post?.body
								? post.body.schema.parse(
										(args as { body?: unknown }).body,
									)
								: undefined;

							const inView = parsedIn
								? withoutSanitize
									? parsedIn
									: parsedIn.lean
								: undefined;

							const inHealth = inView?.health ?? perfectHealth;
							const inIssues = inView
								? tagIssues("body", inView.error.list)
								: [];

							let outHealth = outParsed.health;
							let outIssues = tagIssues("external", outParsed.issues);
							let finalData = outParsed.data;

							if (post?.payload) {
								adapted = true;

								let candidate: unknown;

								try {
									candidate = post.payload.map(outParsed.data);
								} catch (e) {
									const adapterHealth: Health = {
										ok: false,
										perfect: false,
										errors: 1,
										warnings: 0,
									};

									const adapterIssues: Issue[] = [
										{
											code: "adapter:ADAPTER_CRASH",
											path: ["adapter"],
											severity: "error",
											message:
												(e as Error)?.message ?? "Adapter crashed",
											actual: e,
											expected: "projection mapping should not throw",
										},
									];

									const out: ApiResult<
										unknown,
										unknown,
										AdaptedPostValidation
									> = {
										raw: rawPayload,
										data: outParsed.data,
										errors: [
											...inIssues,
											...outIssues,
											...adapterIssues,
										],
										meta: {
											adapted: true,
											validation: {
												in: inHealth,
												out: mergeHealth(outHealth, adapterHealth),
											},
										},
									};

									return { ok: true, value: out } as Result<
										ApiResult<unknown, unknown, AdaptedPostValidation>,
										HttpError
									>;
								}

								const projected = parseMaybe(
									candidate,
									post.payload.schema,
									withoutSanitize,
								);

								finalData = projected.data;
								outIssues = [
									...outIssues,
									...tagIssues("adapter", projected.issues),
								];
								outHealth = mergeHealth(outHealth, projected.health);
							}

							const out: ApiResult<
								unknown,
								unknown,
								AdaptedPostValidation
							> = {
								raw: rawPayload,
								data: finalData,
								errors: [...inIssues, ...outIssues],
								meta: {
									adapted: adapted || !!post?.body || !!post?.payload,
									validation: {
										in: inHealth,
										out: outHealth,
									},
								},
							};

							return { ok: true, value: out } as Result<
								ApiResult<unknown, unknown, AdaptedPostValidation>,
								HttpError
							>;
						}
					};
				}
			}

			adaptedApi[ns] = nsObj;
		}

		// re-attach adapt + withAdapters on returned api so chaining works at runtime too
		Object.defineProperty(adaptedApi, "adapt", {
			enumerable: false,
			value: adaptRuntime as unknown as AdaptBuilder<S>,
		});
		Object.defineProperty(adaptedApi, "withAdapters", {
			enumerable: false,
			value: withAdaptersImpl,
		});

		return adaptedApi as unknown as AdaptedApi<S, typeof adapterUnits>;
	};

	Object.defineProperty(api, "withAdapters", {
		enumerable: false,
		value: withAdaptersImpl,
	});

	return api as unknown as GeneratedApi<S> & {
		withAdapters: WithAdaptersFn<S>;
		adapt: AdaptBuilder<S>;
	};
};
