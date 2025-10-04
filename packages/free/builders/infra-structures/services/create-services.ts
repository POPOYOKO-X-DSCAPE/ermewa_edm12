import type { Store } from "../../core/types";
import type { ApiConfiguration, ApiMethods, HttpMethod } from "../types";

function replaceParamsInString<T extends Record<string, string | number>>(
  input: string,
  params: T
): string {
  const [prefix, ...rest] = input.split("/");
  const urlBody = rest.join("/");

  const replaced = urlBody.replace(/:(?!\d+\b)[^/&$]+/g, (match) => {
    const paramName = match.slice(1);
    const descriptor = Object.getOwnPropertyDescriptor(params, paramName);

    if (descriptor) {
      const value = params[paramName];
      if (typeof value === "string" || typeof value === "number") {
        return value.toString();
      }
      console.error(`Invalid parameter type for :${paramName}`);
    } else {
      console.error(`Missing parameter: :${paramName}`);
    }

    return match;
  });

  const missingParams = Array.from(
    new Set(urlBody.match(/:(?!\d+\b)[^/&$]+/g) || [])
  )
    .map((m) => m.slice(1))
    .filter((key) => !Object.getOwnPropertyDescriptor(params, key));

  if (missingParams.length > 0) {
    console.error(`Missing parameters: ${missingParams.map(p => `:${p}`).join(", ")}`);
  }

  return [prefix, replaced].join("/");
}

function buildFullPath(base: string, path: string): string {
  const needsSlash =
    !base.endsWith("/") && !path.startsWith("/") && base !== "" && path !== "";
  return `${base}${needsSlash ? "/" : ""}${path}`;
}

const createServicesBuilder = <T extends Record<string, unknown>>(environment: Store<T>) => {
  function createServices<A extends Record<string, ApiConfiguration<T>>>(
    apis: A,
    _baseConfig: RequestInit | ((env: T) => RequestInit) = {}
  ) {
    const services = {} as { [K in keyof A]: ApiMethods<T, A[K]> };

    for (const apiName in apis) {
      const api = apis[apiName];
      const methods = new Set<HttpMethod>();

      for (const endpoint of Object.values(api.endpoints)) {
        for (const method of endpoint.methods) {
          methods.add(method);
        }
      }

      const methodsMap: Record<string, unknown> = {};

      for (const method of methods) {
        const methodEndpoints: Record<string, unknown> = {};

        for (const [endpointName, endpoint] of Object.entries(api.endpoints)) {
          if (!endpoint.methods.includes(method)) continue;

          const fullPath = buildFullPath(api.baseUrl, endpoint.path);

          methodEndpoints[endpointName] = async (options?: {
            body?: BodyInit;
            params?: Record<string, string | number>;
          }) => {
            const finalUrl = options?.params
              ? replaceParamsInString(fullPath, options.params)
              : fullPath;

            const baseConfig =
              typeof _baseConfig === "function"
                ? _baseConfig(environment.state)
                : _baseConfig;

            const serviceConfig =
              typeof api.config === "function"
                ? api.config(environment.state)
                : api.config || {};

            const endpointConfig =
              typeof endpoint.config === "function"
                ? endpoint.config(environment.state)
                : endpoint.config || {};

            const finalConfig: RequestInit = {
              ...baseConfig,
              ...serviceConfig,
              ...endpointConfig,
              method,
            };

            if (
              finalConfig.headers &&
              (finalConfig.headers as Record<string, string>)["Content-Type"] === "application/json" &&
              options?.body
            ) {
              options.body = JSON.stringify(options.body);
            }

            try {
              const response = await fetch(finalUrl, {
                ...finalConfig,
                body: options?.body,
              });

              return { data: response, setEnv: environment.patch };
            } catch (error: unknown) {
              return error;
            }
          };
        }

        methodsMap[method.toLowerCase()] = methodEndpoints;
      }

      services[apiName] = methodsMap as ApiMethods<T, A[typeof apiName]>;
    }

   // --- TYPES GLOBAUX FONCTION DÉPORTÉE ---
  type ServiceStructure<S> = {
    [N in keyof S]: {
      [M in keyof S[N]]: {
        [E in keyof S[N][M]]: {
          namespace: N;
          method: M;
          endpoint: E;
          fn: S[N][M][E];
          path: `${Extract<N, string>}.${Extract<M, string>}.${Extract<E, string>}`;
        };
      }[keyof S[N][M]];
    }[keyof S[N]];
  }[keyof S];

  type PathToServiceMap<S> = {
    [C in ServiceStructure<S> as C["path"]]: {
      fn: C["fn"] extends (...args: infer A) => infer R ? (...args: A) => R : never;
      namespace: C["namespace"];
      method: C["method"];
      endpoint: C["endpoint"];
    };
  };

  return services;
}

  return createServices;
};

export default createServicesBuilder;
