import type {
	AuthMode,
	BodyToken,
	CallBaseArgs,
	Headers,
	HttpError,
	RequestToken,
	ResponseToken,
	Result,
} from "../infer/api.infer";

type FetchLike = (
	input: RequestInfo | URL,
	init?: RequestInit,
) => Promise<Response>;

type EngineDefaults = {
	baseUrl?: string;
	headers?: Headers;
	timeoutMs?: number;
	auth?: AuthMode;
	credentials?: RequestCredentials;
};

type RequestConfig = {
	method: string;
	path: string;

	baseUrl?: string;
	defaults?: EngineDefaults;

	requestTokens: readonly RequestToken[];
	response?: ResponseToken<unknown>;
	body?: BodyToken<unknown>;
};

type ResolveAuth = () => string | undefined;

type Params = CallBaseArgs["params"];

const mergeHeaders = (...parts: readonly (Headers | undefined)[]) => {
	const out: Record<string, string> = {};
	for (const h of parts) {
		if (!h) continue;
		for (const k in h) out[k] = h[k];
	}
	return out;
};

const lastAuthMode = (
	defaults: AuthMode | undefined,
	tokens: readonly RequestToken[],
) => {
	let mode = defaults;
	for (const t of tokens) {
		if (t.kind === "auth") mode = t.mode;
	}
	return mode;
};

const lastTimeoutMs = (
	defaults: number | undefined,
	tokens: readonly RequestToken[],
	callTimeout: number | undefined,
) => {
	let ms = defaults;
	for (const t of tokens) {
		if (t.kind === "timeout") ms = t.timeoutMs;
	}
	return callTimeout ?? ms;
};

const lastCredentials = (
	defaults: RequestCredentials | undefined,
	tokens: readonly RequestToken[],
	callCreds: RequestCredentials | undefined,
) => {
	let c = defaults;
	for (const t of tokens) {
		if (t.kind === "credentials") c = t.value;
	}
	return callCreds ?? c;
};

// Replaces optional query pairs: &KEY?=:param or ?KEY?=:param
// - if param undefined => remove the whole pair (including separator)
// - else => becomes &KEY=<encoded>
const applyOptionalQueryPairs = (template: string, params: Params) => {
	const re = /([?&])([^=&#?]+)\?=:([A-Za-z0-9_]+)/g;

	return template.replace(
		re,
		(_full, sep: string, key: string, name: string) => {
			const value = params?.[name];
			if (value === undefined) return "";
			return `${sep}${key}=${encodeURIComponent(String(value))}`;
		},
	);
};

const cleanupQuery = (s: string) =>
	s
		.replace(/\?&/g, "?")
		.replace(/&&/g, "&")
		.replace(/\?$/g, "")
		.replace(/&$/g, "");

const applyRequiredParams = (
	template: string,
	params: Params,
): Result<string, HttpError> => {
	const re = /:([A-Za-z0-9_]+)/g;

	let ok = true;
	let missing: string | undefined;

	const out = template.replace(re, (_full, name: string) => {
		const value = params?.[name];
		if (value === undefined) {
			ok = false;
			missing = name;
			return "";
		}
		return encodeURIComponent(String(value));
	});

	if (!ok) {
		return {
			ok: false,
			error: {
				kind: "http",
				status: 400,
				message: `missing param: ${missing ?? ""}`,
			},
		};
	}

	return { ok: true, value: out };
};

const buildUrl = (
	baseUrl: string | undefined,
	pathTemplate: string,
	params: Params,
): Result<string, HttpError> => {
	const withOptionals = cleanupQuery(
		applyOptionalQueryPairs(pathTemplate, params),
	);

	const resolved = applyRequiredParams(withOptionals, params);
	if (!resolved.ok) return resolved;

	const path = cleanupQuery(resolved.value);

	if (!baseUrl) return { ok: true, value: path };

	if (path.startsWith("http://") || path.startsWith("https://")) {
		return { ok: true, value: path };
	}

	const slash =
		baseUrl.endsWith("/") || path.startsWith("/") ? "" : "/";
	const trimmed =
		baseUrl.endsWith("/") && path.startsWith("/")
			? path.slice(1)
			: path;

	return { ok: true, value: `${baseUrl}${slash}${trimmed}` };
};

const encodeBody = (
	bodyToken: BodyToken<unknown> | undefined,
	bodyValue: unknown,
	headers: Record<string, string>,
): Result<BodyInit | undefined, HttpError> => {
	if (!bodyToken) return { ok: true, value: undefined };

	if (bodyToken.as === "json") {
		headers["Content-Type"] =
			headers["Content-Type"] ?? "application/json";
		try {
			return { ok: true, value: JSON.stringify(bodyValue) };
		} catch {
			return {
				ok: false,
				error: { kind: "decode", message: "json stringify failed" },
			};
		}
	}

	if (bodyToken.as === "formData") {
		if (bodyValue instanceof FormData)
			return { ok: true, value: bodyValue };
		return {
			ok: false,
			error: { kind: "decode", message: "expected FormData body" },
		};
	}

	if (bodyToken.as === "text") {
		if (typeof bodyValue === "string")
			return { ok: true, value: bodyValue };
		return {
			ok: false,
			error: { kind: "decode", message: "expected string body" },
		};
	}

	if (bodyToken.as === "blob") {
		if (bodyValue instanceof Blob)
			return { ok: true, value: bodyValue };
		return {
			ok: false,
			error: { kind: "decode", message: "expected Blob body" },
		};
	}

	return {
		ok: false,
		error: { kind: "decode", message: "unsupported body kind" },
	};
};

const parseResponse = async (
	res: Response,
	response: ResponseToken<unknown> | undefined,
): Promise<Result<unknown, HttpError>> => {
	const mode = response?.as ?? "json";

	try {
		if (mode === "raw") return { ok: true, value: res };
		if (mode === "text") return { ok: true, value: await res.text() };
		if (mode === "blob") return { ok: true, value: await res.blob() };

		return { ok: true, value: await res.json() };
	} catch {
		return {
			ok: false,
			error: { kind: "decode", message: "response decode failed" },
		};
	}
};

export const httpEngine = (deps: {
	fetch: FetchLike;
	resolveAuth?: ResolveAuth;
	defaults?: EngineDefaults;
}) => {
	const { fetch, resolveAuth, defaults } = deps;

	return {
		async request(
			cfg: RequestConfig,
			call?: CallBaseArgs & { body?: unknown },
		) {
			const callSafe: CallBaseArgs & { body?: unknown } = call ?? {};

			const baseUrl =
				cfg.baseUrl ?? cfg.defaults?.baseUrl ?? defaults?.baseUrl;

			const urlRes = buildUrl(baseUrl, cfg.path, callSafe.params);
			if (!urlRes.ok) return urlRes;

			const mergedHeaders = mergeHeaders(
				defaults?.headers,
				cfg.defaults?.headers,
				(() => {
					const h: Record<string, string> = {};
					for (const t of cfg.requestTokens) {
						if (t.kind === "headers") Object.assign(h, t.headers);
					}
					return h;
				})(),
				callSafe.headers,
			);

			const authMode = lastAuthMode(
				cfg.defaults?.auth ?? defaults?.auth,
				cfg.requestTokens,
			);

			if (authMode && authMode !== "none") {
				const token = resolveAuth?.();
				if (token) {
					mergedHeaders.Authorization =
						mergedHeaders.Authorization ?? `Bearer ${token}`;
				} else if (authMode === "required") {
					return {
						ok: false,
						error: {
							kind: "http",
							status: 401,
							message: "missing auth",
						},
					};
				}
			}

			const timeoutMs = lastTimeoutMs(
				cfg.defaults?.timeoutMs ?? defaults?.timeoutMs,
				cfg.requestTokens,
				callSafe.timeoutMs,
			);

			const credentials = lastCredentials(
				cfg.defaults?.credentials ?? defaults?.credentials,
				cfg.requestTokens,
				callSafe.credentials,
			);

			const controller = timeoutMs ? new AbortController() : undefined;
			const timer =
				timeoutMs && controller
					? setTimeout(() => controller.abort(), timeoutMs)
					: undefined;

			const bodyRes = encodeBody(
				cfg.body,
				callSafe.body,
				mergedHeaders,
			);
			if (!bodyRes.ok) {
				if (timer) clearTimeout(timer);
				return bodyRes;
			}

			let res: Response;
			try {
				res = await fetch(urlRes.value, {
					method: cfg.method,
					headers: mergedHeaders,
					body: bodyRes.value,
					signal: controller?.signal,
					credentials,
				});
			} catch {
				if (timer) clearTimeout(timer);
				const aborted = controller?.signal.aborted;
				return {
					ok: false,
					error: aborted
						? { kind: "timeout", message: "request timeout" }
						: { kind: "network", message: "network error" },
				};
			} finally {
				if (timer) clearTimeout(timer);
			}

			if (!res.ok) {
				let body: unknown = undefined;
				try {
					body = await res.text();
				} catch {
					body = undefined;
				}
				return {
					ok: false,
					error: {
						kind: "http",
						status: res.status,
						message: `http ${res.status}`,
						body,
					},
				};
			}

			return parseResponse(res, cfg.response);
		},
	};
};
