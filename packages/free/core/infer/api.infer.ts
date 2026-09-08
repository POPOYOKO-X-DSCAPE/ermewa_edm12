export type HttpMethod =
	| "GET"
	| "POST"
	| "PUT"
	| "PATCH"
	| "DELETE"
	| "HEAD"
	| "OPTIONS";

export type LowerMethod = Lowercase<HttpMethod>;

export type AuthMode = "required" | "optional" | "none";

export type Headers = Readonly<Record<string, string>>;

export type ParamsValue = string | number | boolean | undefined;

export type CallBaseArgs = {
	params?: Readonly<Record<string, ParamsValue>>;
	headers?: Headers;
	timeoutMs?: number;
	credentials?: RequestCredentials;
};

export type CallArgsNoBody = CallBaseArgs & { body?: never };
export type CallArgsWithBody<B> = CallBaseArgs & { body: B };

export type Result<T, E> =
	| { ok: true; value: T; error?: undefined }
	| { ok: false; error: E; value?: undefined };

export type HttpError =
	| { kind: "network"; message: string }
	| { kind: "timeout"; message: string }
	| { kind: "http"; status: number; message: string; body?: unknown }
	| { kind: "decode"; message: string };

/* ============================================================
 * Schema/ApiResult runtime shapes (structural, 0 any)
 * ============================================================ */

export type Health = Readonly<{
	ok: boolean;
	perfect: boolean;
	errors: number;
	warnings: number;
}>;

export type Issue = Readonly<{
	code: string;
	path: readonly (string | number)[];
	severity: "error" | "warn";
	message: string;
	actual?: unknown;
	expected?: string;
}>;

export type ParsedLike<T> = Readonly<{
	value: T;
	lean: Readonly<{
		value: T;
		health: Health;
		error: Readonly<{ list: readonly Issue[] }>;
	}>;
	health: Health;
	error: Readonly<{ list: readonly Issue[] }>;
}>;

export type SchemaLike<T> = Readonly<{
	parse(input: unknown): ParsedLike<T>;
	readonly infer: T;
}>;

export type ApiResult<Raw, Data, Validation> = Readonly<{
	raw: Raw | undefined;
	data: Data | undefined;
	errors: readonly Issue[];
	meta: Readonly<{
		adapted: boolean;
		validation: Validation;
	}>;
}>;

/* ============================================================
 * Internal tokens (used by runtime http engine)
 * ============================================================ */

export type ResponseToken<T> =
	| {
			kind: "response";
			as: "json";
			schema?: SchemaLike<unknown>;
			__t?: T;
	  }
	| { kind: "response"; as: "text" }
	| { kind: "response"; as: "raw" }
	| { kind: "response"; as: "blob" };

export type BodyToken<B> =
	| { kind: "body"; as: "json"; schema?: SchemaLike<unknown>; __b?: B }
	| { kind: "body"; as: "formData" }
	| { kind: "body"; as: "text" }
	| { kind: "body"; as: "blob" };

export type RequestToken =
	| { kind: "headers"; headers: Headers }
	| { kind: "auth"; mode: AuthMode }
	| { kind: "timeout"; timeoutMs: number }
	| { kind: "credentials"; value: RequestCredentials };

export type VerbConfig = {
	readonly response?: ResponseToken<unknown>;
	readonly body?: BodyToken<unknown>;
	readonly request: readonly RequestToken[];
};

/* ============================================================
 * We store factories (instantiation expressions) in the endpoint defs.
 * ============================================================ */

export type JsonFactory<T> = () => {
	as: "json";
	__t?: T;
	schema?: SchemaLike<T>;
};

export type TextFactory = () => { as: "text" };
export type RawFactory = () => { as: "raw" };
export type BlobFactory = () => { as: "blob" };
export type FormDataFactory = () => { as: "formData" };

export type PayloadFactory<T = unknown> =
	| JsonFactory<T>
	| TextFactory
	| RawFactory
	| BlobFactory;

export type BodyFactory<T = unknown> =
	| JsonFactory<T>
	| TextFactory
	| BlobFactory
	| FormDataFactory;

export type VerbDef = {
	headers?: Headers;
	auth?: AuthMode;
	timeoutMs?: number;
	credentials?: RequestCredentials;

	body?: BodyFactory<unknown>;
	payload: PayloadFactory<unknown>;
};

export type EndpointDef = {
	path?: string;
	query?: string;
} & Partial<Record<LowerMethod, VerbDef>>;

export type NamespaceConfig<
	E extends Record<string, EndpointDef> = Record<string, EndpointDef>,
> = {
	readonly baseUrl?: string;
	readonly pathPrefix?: string;
	readonly defaults: readonly RequestToken[];
	readonly endpoints: E;
};

export type ApiSpec = Record<string, NamespaceConfig>;

/* ============================================================
 * Params inference from full path (path + query)
 * Optional query param key syntax: KEY?=:param
 * ============================================================ */

type ParamChar =
	| "a"
	| "b"
	| "c"
	| "d"
	| "e"
	| "f"
	| "g"
	| "h"
	| "i"
	| "j"
	| "k"
	| "l"
	| "m"
	| "n"
	| "o"
	| "p"
	| "q"
	| "r"
	| "s"
	| "t"
	| "u"
	| "v"
	| "w"
	| "x"
	| "y"
	| "z"
	| "A"
	| "B"
	| "C"
	| "D"
	| "E"
	| "F"
	| "G"
	| "H"
	| "I"
	| "J"
	| "K"
	| "L"
	| "M"
	| "N"
	| "O"
	| "P"
	| "Q"
	| "R"
	| "S"
	| "T"
	| "U"
	| "V"
	| "W"
	| "X"
	| "Y"
	| "Z"
	| "0"
	| "1"
	| "2"
	| "3"
	| "4"
	| "5"
	| "6"
	| "7"
	| "8"
	| "9"
	| "_";

type TakeIdent<
	S extends string,
	Acc extends string = "",
> = S extends `${infer C}${infer Rest}`
	? C extends ParamChar
		? TakeIdent<Rest, `${Acc}${C}`>
		: [Acc, `${C}${Rest}`]
	: [Acc, ""];

type ExtractOptionalParams<
	S extends string,
	Out extends string = never,
> = S extends `${infer _Before}?=:${infer After}`
	? TakeIdent<After> extends [infer Name, infer Rest]
		? Name extends string
			? Rest extends string
				? ExtractOptionalParams<Rest, Out | Name>
				: Out | Name
			: Out
		: Out
	: Out;

type ExtractAllParams<
	S extends string,
	Out extends string = never,
> = S extends `${infer _Before}:${infer After}`
	? TakeIdent<After> extends [infer Name, infer Rest]
		? Name extends string
			? Rest extends string
				? ExtractAllParams<Rest, Out | Name>
				: Out | Name
			: Out
		: Out
	: Out;

type RequiredParams<P extends string> = Exclude<
	ExtractAllParams<P>,
	ExtractOptionalParams<P>
>;

type OptionalParams<P extends string> = ExtractOptionalParams<P>;

type CallBaseArgsForPath<P extends string> =
	ExtractAllParams<P> extends never
		? CallBaseArgs
		: RequiredParams<P> extends never
			? CallBaseArgs & {
					params?: Readonly<
						Partial<Record<OptionalParams<P>, ParamsValue>>
					>;
				}
			: CallBaseArgs & {
					params: Readonly<
						Record<RequiredParams<P>, ParamsValue> &
							Partial<Record<OptionalParams<P>, ParamsValue>>
					>;
				};

type ParamsShape<P extends string> = {
	params: Record<ExtractAllParams<P>, ParamsValue>;
};

type EnsureParams<P extends string> = RequiredParams<P> extends never
	? CallBaseArgs
	: CallBaseArgs & ParamsShape<P>;

type EnsureParamsOptional<P extends string> =
	ExtractAllParams<P> extends never
		? CallBaseArgs
		: CallBaseArgs &
				ParamsShape<P> &
				Partial<Record<OptionalParams<P>, ParamsValue>>;

type EnsureRequiredParams<P extends string> =
	ExtractAllParams<P> extends never
		? CallBaseArgs
		: CallBaseArgs & ParamsShape<P>;

type CallBaseArgsForPath2<P extends string> =
	ExtractAllParams<P> extends never
		? CallBaseArgs
		: CallBaseArgs & ParamsShape<P>;

type EnsureQuery<Q extends string> = Q extends ""
	? ""
	: Q extends `?${string}` | `&${string}`
		? Q
		: `?${Q}`;

type PathOf<E> = E extends { path: infer P }
	? P extends string
		? P
		: ""
	: "";
type QueryOf<E> = E extends { query: infer Q }
	? Q extends string
		? Q
		: ""
	: "";

type FullPath<E> = `${PathOf<E>}${EnsureQuery<QueryOf<E>>}`;

/* ============================================================
 * Extract body/payload value types from factories
 * ============================================================ */

type JsonPayload<C> = C extends {
	as: "json";
	schema: SchemaLike<infer T>;
}
	? T
	: C extends { as: "json"; __t?: infer T }
		? T
		: unknown;

type PayloadValue<F> = F extends () => infer C
	? C extends { as: "json" }
		? JsonPayload<C>
		: C extends { as: "text" }
			? string
			: C extends { as: "raw" }
				? Response
				: C extends { as: "blob" }
					? Blob
					: unknown
	: unknown;

type BodyValue<F> = F extends () => infer C
	? C extends { as: "json" }
		? JsonPayload<C>
		: C extends { as: "text" }
			? string
			: C extends { as: "blob" }
				? Blob
				: C extends { as: "formData" }
					? FormData
					: unknown
	: unknown;

type BodyOf<Cfg> = Cfg extends { body?: infer B }
	? B extends BodyFactory<unknown>
		? BodyValue<B>
		: never
	: never;

type RespOf<Cfg> = Cfg extends { payload: infer P }
	? P extends PayloadFactory<unknown>
		? PayloadValue<P>
		: unknown
	: unknown;

type HasRequiredParams<P extends string> =
	RequiredParams<P> extends never ? false : true;

type EndpointCall<
	P extends string,
	Cfg extends VerbDef,
> = BodyOf<Cfg> extends never
	? HasRequiredParams<P> extends true
		? (
				args: CallBaseArgsForPath<P>,
			) => Promise<Result<RespOf<Cfg>, HttpError>>
		: (
				args?: CallBaseArgsForPath<P>,
			) => Promise<Result<RespOf<Cfg>, HttpError>>
	: (
			args: CallBaseArgsForPath<P> & CallArgsWithBody<BodyOf<Cfg>>,
		) => Promise<Result<RespOf<Cfg>, HttpError>>;

type VerbsOfEndpoint<E> = keyof E & LowerMethod;

type VerbsUsed<N extends NamespaceConfig<Record<string, EndpointDef>>> =
	{
		[K in keyof N["endpoints"] & string]: VerbsOfEndpoint<
			N["endpoints"][K]
		>;
	}[keyof N["endpoints"] & string];

type VerbCfgFor<E, V extends LowerMethod> = E extends Record<V, infer C>
	? C extends VerbDef
		? C
		: never
	: never;

type VerbGroup<
	N extends NamespaceConfig<Record<string, EndpointDef>>,
	V extends LowerMethod,
> = {
	[K in keyof N["endpoints"] & string as VerbCfgFor<
		N["endpoints"][K],
		V
	> extends never
		? never
		: K]: EndpointCall<
		FullPath<N["endpoints"][K]>,
		VerbCfgFor<N["endpoints"][K], V>
	>;
};

export type GeneratedNamespace<
	N extends NamespaceConfig<Record<string, EndpointDef>>,
> = {
	[V in VerbsUsed<N>]: VerbGroup<N, V>;
};

export type GeneratedApi<S extends ApiSpec> = {
	[NS in keyof S & string]: GeneratedNamespace<S[NS]>;
};

export type AdaptedPostValidation = Readonly<{
	in: Health;
	out: Health;
}>;

/* ============================================================
 * Adapt builder (types only)
 * This is what types legacy in api.adapt.* callbacks.
 * ============================================================ */

type EmptyObj = Record<never, never>;

type EndpointVerbDef<
	E extends EndpointDef,
	V extends LowerMethod,
> = E extends Record<V, infer C>
	? C extends VerbDef
		? C
		: never
	: never;

type PayloadT<E extends EndpointDef, V extends LowerMethod> = RespOf<
	EndpointVerbDef<E, V>
>;

type BodyT<E extends EndpointDef, V extends LowerMethod> = BodyOf<
	EndpointVerbDef<E, V>
>;

export type AdapterBody<In, Body> = Readonly<{
	schema: SchemaLike<In>;
	map: (input: In) => Body;
}>;

export type AdapterPayload<LegacyOut, Out> = Readonly<{
	schema: SchemaLike<Out>;
	map: (legacy: LegacyOut) => Out;
}>;

export type AdapterPost<In, Body, LegacyOut, Out> = Readonly<{
	body?: AdapterBody<In, Body>;
	payload?: AdapterPayload<LegacyOut, Out>;
}>;

export type AdapterGet<LegacyOut, Out> = Readonly<{
	schema: SchemaLike<Out>;
	map: (legacy: LegacyOut) => Out;
}>;

type GetUnit<
	NS extends string,
	EP extends string,
	Legacy,
	Out,
> = Readonly<{
	[ns in NS]: Readonly<{
		[ep in EP]: Readonly<{
			get: AdapterGet<Legacy, Out>;
		}>;
	}>;
}>;

type PostUnit<
	NS extends string,
	EP extends string,
	In,
	Body,
	Legacy,
	Out,
> = Readonly<{
	[ns in NS]: Readonly<{
		[ep in EP]: Readonly<{
			post: AdapterPost<In, Body, Legacy, Out>;
		}>;
	}>;
}>;

type AdaptEndpoint<
	NS extends string,
	EP extends string,
	E extends EndpointDef,
> = (E extends { get: VerbDef }
	? {
			get: <Out>(
				schema: SchemaLike<Out>,
				map: (legacy: PayloadT<E, "get">, rawPayload?: unknown) => Out,
			) => GetUnit<NS, EP, PayloadT<E, "get">, Out>;
		}
	: EmptyObj) &
	(E extends { post: VerbDef }
		? {
				post: <In, Out>(
					cfg: Readonly<{
						body?: AdapterBody<In, BodyT<E, "post">>;
						payload?: AdapterPayload<PayloadT<E, "post">, Out>;
					}>,
				) => PostUnit<
					NS,
					EP,
					In,
					BodyT<E, "post">,
					PayloadT<E, "post">,
					Out
				>;
			}
		: EmptyObj);

type AdaptNamespace<
	NS extends string,
	N extends NamespaceConfig<Record<string, EndpointDef>>,
> = {
	[EP in keyof N["endpoints"] & string]: AdaptEndpoint<
		NS,
		EP,
		N["endpoints"][EP]
	>;
};

export type AdaptBuilder<S extends ApiSpec> = {
	[NS in keyof S & string]: AdaptNamespace<NS, S[NS]>;
};

// ------------------------------------------------------------
// Adapter units typing (for withAdapters)
// ------------------------------------------------------------
export type AdapterUnitFor<S extends ApiSpec> = Readonly<{
	[NS in keyof S & string]?: Readonly<{
		[EP in keyof S[NS]["endpoints"] & string]?: Partial<
			Record<LowerMethod, unknown>
		>;
	}>;
}>;

// helper: extract adapter value at a given ns/ep/verb from a union of units
type AdapterAt<
	S extends ApiSpec,
	Units extends readonly AdapterUnitFor<S>[],
	NS extends keyof S & string,
	EP extends keyof S[NS]["endpoints"] & string,
	V extends LowerMethod,
> = Units[number] extends infer U
	? U extends Readonly<Record<NS, infer NSV>>
		? NSV extends Readonly<Record<EP, infer EPV>>
			? EPV extends Partial<Record<V, infer A>>
				? A
				: never
			: never
		: never
	: never;

type AdapterGetOut<Raw, A> = A extends {
	schema: SchemaLike<infer Out>;
	map: (legacy: Raw) => infer Out2;
}
	? Out & Out2
	: Raw;

type AdapterPostOut<Raw, A> = A extends {
	payload?: {
		schema: SchemaLike<infer Out>;
		map: (legacy: Raw) => infer Out2;
	};
}
	? Out & Out2
	: Raw;

type AdapterPostIn<Raw, A> = A extends {
	body?: {
		schema: SchemaLike<infer In>;
		map: (input: infer In2) => unknown;
	};
}
	? In & In2
	: Raw;

// decide validation payload type: post => AdaptedPostValidation, else Health
type ValidationForVerb<V extends LowerMethod> = V extends "post"
	? AdaptedPostValidation
	: Health;

type ApiResultFor<Raw, Data, V extends LowerMethod> = ApiResult<
	Raw,
	Data,
	ValidationForVerb<V>
>;

// Build adapted endpoint call signature for a given path+verb config
type AdaptedEndpointCall<
	P extends string,
	Cfg extends VerbDef,
	V extends LowerMethod,
	Body,
	Raw,
	Data,
> = [Body] extends [never]
	? HasRequiredParams<P> extends true
		? (
				args: CallBaseArgsForPath<P>,
			) => Promise<Result<ApiResultFor<Raw, Data, V>, HttpError>>
		: (
				args?: CallBaseArgsForPath<P>,
			) => Promise<Result<ApiResultFor<Raw, Data, V>, HttpError>>
	: (
			args: CallBaseArgsForPath<P> & CallArgsWithBody<Body>,
		) => Promise<Result<ApiResultFor<Raw, Data, V>, HttpError>>;

// For a given endpoint+verb, compute Data based on adapters
type DataForVerb<
	S extends ApiSpec,
	Units extends readonly AdapterUnitFor<S>[],
	NS extends keyof S & string,
	EP extends keyof S[NS]["endpoints"] & string,
	V extends LowerMethod,
	E extends EndpointDef,
> = V extends "get"
	? AdapterGetOut<
			PayloadT<E, "get">,
			AdapterAt<S, Units, NS, EP, "get">
		>
	: V extends "post"
		? AdapterPostOut<
				PayloadT<E, "post">,
				AdapterAt<S, Units, NS, EP, "post">
			>
		: PayloadT<E, V>;

type BodyForVerb<
	S extends ApiSpec,
	Units extends readonly AdapterUnitFor<S>[],
	NS extends keyof S & string,
	EP extends keyof S[NS]["endpoints"] & string,
	V extends LowerMethod,
	E extends EndpointDef,
> = V extends "post"
	? AdapterPostIn<BodyT<E, "post">, AdapterAt<S, Units, NS, EP, "post">>
	: BodyT<E, V>;

// Adapted VerbGroup
type AdaptedVerbGroup<
	S extends ApiSpec,
	Units extends readonly AdapterUnitFor<S>[],
	NS extends keyof S & string,
	N extends NamespaceConfig<Record<string, EndpointDef>>,
	V extends LowerMethod,
> = {
	[K in keyof N["endpoints"] & string as VerbCfgFor<
		N["endpoints"][K],
		V
	> extends never
		? never
		: K]: AdaptedEndpointCall<
		FullPath<N["endpoints"][K]>,
		VerbCfgFor<N["endpoints"][K], V>,
		V,
		BodyForVerb<S, Units, NS, K, V, N["endpoints"][K]>,
		PayloadT<N["endpoints"][K], V>,
		DataForVerb<S, Units, NS, K, V, N["endpoints"][K]>
	>;
};

type AdaptedNamespace<
	S extends ApiSpec,
	Units extends readonly AdapterUnitFor<S>[],
	NS extends keyof S & string,
	N extends NamespaceConfig<Record<string, EndpointDef>>,
> = {
	[V in VerbsUsed<N>]: AdaptedVerbGroup<S, Units, NS, N, V>;
};

export type AdaptedApi<
	S extends ApiSpec,
	Units extends readonly AdapterUnitFor<S>[],
> = {
	[NS in keyof S & string]: AdaptedNamespace<S, Units, NS, S[NS]>;
} & {
	withAdapters: <const Next extends readonly AdapterUnitFor<S>[]>(
		...args: [...Next, Readonly<{ withoutSanitize?: boolean }>?]
	) => AdaptedApi<S, Next> & { adapt: AdaptBuilder<S> };
	adapt: AdaptBuilder<S>;
};
