import {
	ReactiveKeys,
	type ReactivePathSegment,
} from "../core/runtime/reactive-keys";

type SubscriberEngine = {
	beginModel(name: string): void;
	endModel(): void;
	track(source: string): void;
	subscribeModel(model: string, cb: () => void): () => void;
	isDirty(model: string): boolean;
	clearDirty(model: string): void;
};

type ModelDef = (ctx: {
	repositories: Record<string, unknown>;
	stores: Record<string, unknown>;
	models: Record<string, unknown>;
}) => unknown;

const TRACKED_PROXY_MARKER = Symbol("free.trackedProxy");

type ObjectLike = Record<PropertyKey, unknown>;

const isObjectLike = (value: unknown): value is object =>
	(typeof value === "object" && value !== null) ||
	typeof value === "function";

const isTrackableObject = (value: unknown): value is ObjectLike =>
	typeof value === "object" && value !== null;

const isEntityLike = (
	value: unknown,
): value is {
	meta: { id: string };
	state: unknown;
} => {
	if (!isTrackableObject(value)) {
		return false;
	}

	const meta = (value as Record<PropertyKey, unknown>).meta;
	return (
		isTrackableObject(meta) &&
		typeof (meta as Record<PropertyKey, unknown>).id === "string"
	);
};

const toPathSegment = (
	prop: PropertyKey,
): ReactivePathSegment | undefined => {
	if (typeof prop === "number") {
		return prop;
	}

	if (typeof prop !== "string") {
		return undefined;
	}

	if (/^(0|[1-9]\d*)$/.test(prop)) {
		return Number(prop);
	}

	return prop;
};

const createTrackedStoreValueFactory = (
	storeName: string,
	subscriber: SubscriberEngine,
) => {
	const proxyCache = new WeakMap<object, Map<string, object>>();

	const getCachedProxy = (source: object, key: string) =>
		proxyCache.get(source)?.get(key);

	const setCachedProxy = (
		source: object,
		key: string,
		proxy: object,
	) => {
		let byPath = proxyCache.get(source);
		if (!byPath) {
			byPath = new Map<string, object>();
			proxyCache.set(source, byPath);
		}

		byPath.set(key, proxy);
	};

	const proxify = (
		value: unknown,
		path: readonly ReactivePathSegment[] = [],
	): unknown => {
		if (!isTrackableObject(value)) {
			return value;
		}

		const reactiveKey = ReactiveKeys.store(storeName, ...path);
		const cached = getCachedProxy(value, reactiveKey);
		if (cached) {
			return cached;
		}

		const proxy = new Proxy(value, {
			get(target, prop, receiver) {
				if (prop === TRACKED_PROXY_MARKER) {
					return true;
				}

				const result = Reflect.get(target, prop, receiver);

				if (typeof result === "function") {
					subscriber.track(reactiveKey);
					return result.bind(target);
				}

				const segment = toPathSegment(prop);
				if (segment === undefined) {
					subscriber.track(reactiveKey);
					return result;
				}

				const nextPath = [...path, segment] as const;
				subscriber.track(ReactiveKeys.store(storeName, ...nextPath));
				return proxify(result, nextPath);
			},

			has(target, prop) {
				const segment = toPathSegment(prop);
				if (segment === undefined) {
					subscriber.track(reactiveKey);
				} else {
					subscriber.track(
						ReactiveKeys.store(storeName, ...path, segment),
					);
				}

				return Reflect.has(target, prop);
			},

			ownKeys(target) {
				subscriber.track(reactiveKey);
				return Reflect.ownKeys(target);
			},

			getOwnPropertyDescriptor(target, prop) {
				subscriber.track(reactiveKey);
				return Reflect.getOwnPropertyDescriptor(target, prop);
			},

			set() {
				return false;
			},

			deleteProperty() {
				return false;
			},

			defineProperty() {
				return false;
			},

			setPrototypeOf() {
				return false;
			},
		});

		setCachedProxy(value, reactiveKey, proxy);
		return proxy;
	};

	return {
		proxify,
	};
};

const createTrackedRepoValueFactory = (
	repoName: string,
	subscriber: SubscriberEngine,
) => {
	const proxyCache = new WeakMap<object, Map<string, object>>();
	const collectionKey = ReactiveKeys.repo(repoName, "ids");

	const getCachedProxy = (source: object, key: string) =>
		proxyCache.get(source)?.get(key);

	const setCachedProxy = (
		source: object,
		key: string,
		proxy: object,
	) => {
		let byPath = proxyCache.get(source);
		if (!byPath) {
			byPath = new Map<string, object>();
			proxyCache.set(source, byPath);
		}

		byPath.set(key, proxy);
	};

	const proxifyEntityValue = (
		value: unknown,
		path: readonly ReactivePathSegment[],
	): unknown => {
		if (!isTrackableObject(value)) {
			return value;
		}

		const reactiveKey = ReactiveKeys.repo(repoName, ...path);
		const cached = getCachedProxy(value, reactiveKey);
		if (cached) {
			return cached;
		}

		const proxy = new Proxy(value, {
			get(target, prop, receiver) {
				if (prop === TRACKED_PROXY_MARKER) {
					return true;
				}

				const result = Reflect.get(target, prop, receiver);

				if (typeof result === "function") {
					subscriber.track(reactiveKey);
					return (...args: readonly unknown[]) =>
						Reflect.apply(
							result as (...args: readonly unknown[]) => unknown,
							Array.isArray(target) ? proxy : target,
							args,
						);
				}

				const segment = toPathSegment(prop);
				if (segment === undefined) {
					subscriber.track(reactiveKey);
					return result;
				}

				const nextPath = [...path, segment] as const;
				subscriber.track(ReactiveKeys.repo(repoName, ...nextPath));
				return proxifyEntityValue(result, nextPath);
			},

			has(target, prop) {
				const segment = toPathSegment(prop);
				if (segment === undefined) {
					subscriber.track(reactiveKey);
				} else {
					subscriber.track(
						ReactiveKeys.repo(repoName, ...path, segment),
					);
				}

				return Reflect.has(target, prop);
			},

			ownKeys(target) {
				subscriber.track(reactiveKey);
				return Reflect.ownKeys(target);
			},

			getOwnPropertyDescriptor(target, prop) {
				subscriber.track(reactiveKey);
				return Reflect.getOwnPropertyDescriptor(target, prop);
			},

			set() {
				return false;
			},

			deleteProperty() {
				return false;
			},

			defineProperty() {
				return false;
			},

			setPrototypeOf() {
				return false;
			},
		});

		setCachedProxy(value, reactiveKey, proxy);
		return proxy;
	};

	const proxifyEntity = (value: unknown): unknown => {
		if (!isEntityLike(value)) {
			return value;
		}

		return proxifyEntityValue(value, ["byId", value.meta.id]);
	};

	const proxifyCollection = (value: unknown): unknown => {
		if (!Array.isArray(value)) {
			return value;
		}

		const cached = getCachedProxy(value, collectionKey);
		if (cached) {
			return cached;
		}

		const proxy = new Proxy(value, {
			get(target, prop, receiver) {
				if (prop === TRACKED_PROXY_MARKER) {
					return true;
				}

				if (prop === Symbol.iterator) {
					subscriber.track(collectionKey);
					return function* () {
						for (let index = 0; index < target.length; index += 1) {
							yield proxifyEntity(target[index]);
						}
					};
				}

				const result = Reflect.get(target, prop, receiver);

				if (typeof result === "function") {
					subscriber.track(collectionKey);
					return (...args: readonly unknown[]) =>
						Reflect.apply(
							result as (...args: readonly unknown[]) => unknown,
							proxy,
							args,
						);
				}

				const segment = toPathSegment(prop);
				if (segment === undefined) {
					subscriber.track(collectionKey);
					return result;
				}

				subscriber.track(collectionKey);
				if (typeof segment === "number") {
					return proxifyEntity(result);
				}

				return result;
			},

			has(target, prop) {
				subscriber.track(collectionKey);
				return Reflect.has(target, prop);
			},

			ownKeys(target) {
				subscriber.track(collectionKey);
				return Reflect.ownKeys(target);
			},

			getOwnPropertyDescriptor(target, prop) {
				subscriber.track(collectionKey);
				return Reflect.getOwnPropertyDescriptor(target, prop);
			},

			set() {
				return false;
			},

			deleteProperty() {
				return false;
			},

			defineProperty() {
				return false;
			},

			setPrototypeOf() {
				return false;
			},
		});

		setCachedProxy(value, collectionKey, proxy);
		return proxy;
	};

	return {
		proxifyCollection,
		proxifyEntity,
	};
};

const wrapRepositories = <R extends Record<string, unknown>>(
	repos: R,
	subscriber: SubscriberEngine,
): R => {
	const out = {} as R;

	for (const k in repos) {
		const repo = repos[k] as {
			read: (...args: readonly unknown[]) => unknown;
			getById?: (id: string) => unknown;
		};
		const tracked = createTrackedRepoValueFactory(k, subscriber);

		out[k] = {
			...repo,

			read(...args: readonly unknown[]) {
				if (!args.length) {
					return tracked.proxifyCollection(repo.read());
				}

				const [select] = args;
				if (typeof select === "function") {
					const entities = tracked.proxifyCollection(repo.read());
					return select(entities);
				}

				return repo.read(...args);
			},

			getById(id: string) {
				subscriber.track(ReactiveKeys.repo(k, "lookup", id));
				return tracked.proxifyEntity(repo.getById?.(id));
			},
		} as R[typeof k];
	}

	return out;
};

const wrapStores = <S extends Record<string, unknown>>(
	stores: S,
	subscriber: SubscriberEngine,
): S => {
	const out = {} as S;

	for (const k in stores) {
		const store = stores[k] as { state: unknown };
		const tracked = createTrackedStoreValueFactory(k, subscriber);

		out[k] = new Proxy(store, {
			get(target, prop, receiver) {
				if (prop === "state") {
					return tracked.proxify(Reflect.get(target, prop, receiver));
				}

				return Reflect.get(target, prop, receiver);
			},
		}) as S[typeof k];
	}

	return out;
};

const isTrackedProxy = (value: unknown): boolean =>
	isObjectLike(value) &&
	(value as Record<PropertyKey, unknown>)[TRACKED_PROXY_MARKER] ===
		true;

const freezeModelValue = (value: unknown): unknown => {
	if (!isObjectLike(value)) {
		return value;
	}

	if (isTrackedProxy(value) || Object.isFrozen(value)) {
		return value;
	}

	return Object.freeze(value);
};

export const baseModelsFactory =
	({ subscriber }: { subscriber: SubscriberEngine }) =>
	<
		R extends Record<string, unknown>,
		S extends Record<string, unknown>,
	>(deps: {
		repositories: R;
		stores: S;
	}) => {
		const repositories = wrapRepositories(
			deps.repositories,
			subscriber,
		);
		const stores = wrapStores(deps.stores, subscriber);

		const definitions = new Map<string, ModelDef>();
		const cache = new Map<string, unknown>();

		const models: Record<string, unknown> = Object.create(null);

		const compute = (name: string) => {
			const def = definitions.get(name);
			if (!def) return;

			const source = ReactiveKeys.model(name);

			subscriber.beginModel(source);

			try {
				const value = freezeModelValue(
					def({
						repositories,
						stores,
						models,
					}),
				);

				subscriber.clearDirty(source);
				cache.set(name, value);

				return value;
			} finally {
				subscriber.endModel();
			}
		};

		const defineModel = (name: string) => {
			Object.defineProperty(models, name, {
				enumerable: true,
				configurable: true,

				get() {
					const source = ReactiveKeys.model(name);

					subscriber.track(source);

					if (subscriber.isDirty(source) || !cache.has(name)) {
						return compute(name);
					}

					return cache.get(name);
				},
			});
		};

		const register = (defs: Record<string, ModelDef>) => {
			if ("refine" in defs) {
				throw new Error("`refine` is a reserved model name");
			}

			for (const k in defs) {
				const source = ReactiveKeys.model(k);

				definitions.set(k, defs[k]);

				defineModel(k);

				cache.delete(k);

				subscriber.subscribeModel(source, () => {
					cache.delete(k);
				});
			}
		};

		const createModels = <T extends Record<string, ModelDef>>(
			builder: (ctx: {
				repositories: R;
				stores: S;
			}) => T,
		) => {
			const defs = builder({
				repositories,
				stores,
			});

			register(defs);

			type ValuesOf<TDefs extends Record<string, ModelDef>> = {
				[K in keyof TDefs]: ReturnType<TDefs[K]>;
			};

			type Chain<TDefs extends Record<string, ModelDef>> =
				ValuesOf<TDefs> & {
					refine<U extends Record<string, ModelDef>>(
						builder: (ctx: {
							repositories: R;
							stores: S;
							models: ValuesOf<TDefs>;
						}) => U,
					): Chain<TDefs & U>;
				};

			const refine =
				<TCurrent extends Record<string, ModelDef>>(
					_current?: TCurrent,
				) =>
				<U extends Record<string, ModelDef>>(
					builder: (ctx: {
						repositories: R;
						stores: S;
						models: ValuesOf<
							TCurrent extends Record<string, ModelDef> ? TCurrent : T
						>;
					}) => U,
				) => {
					const defs = builder({
						repositories,
						stores,
						models: models as ValuesOf<
							TCurrent extends Record<string, ModelDef> ? TCurrent : T
						>,
					});

					register(defs);

					return models as Chain<
						(TCurrent extends Record<string, ModelDef> ? TCurrent : T) &
							U
					>;
				};

			Object.defineProperty(models, "refine", {
				value: refine(defs),
				enumerable: false,
				configurable: true,
				writable: false,
			});

			return models as Chain<T>;
		};

		return createModels;
	};
