import type { Store } from '../core/types';

export type ApiConfiguration<T extends Record<string, unknown>> = {
  baseUrl: string;
  config?: RequestInit | ((environment: T) => RequestInit)
  endpoints: {
    [key: string]: {
      path: string;
      config?: RequestInit | ((environment: T) => RequestInit)
      methods: HttpMethod[];
      responseType?: 'json' | 'text' | 'blob';
    };
  };
};

type FilterEndpoints<T extends ApiConfiguration<any>, K extends HttpMethod> = {
  [EndpointName in keyof T['endpoints']]: K extends T['endpoints'][EndpointName]['methods'][number]
    ? EndpointName
    : never;
}[keyof T['endpoints']];



export type ApiMethods<T extends Record<string, unknown>, A extends ApiConfiguration<T>> = {
  [K in Lowercase<A['endpoints'][keyof A['endpoints']]['methods'][number]>]: Record<
    FilterEndpoints<A, Uppercase<K>>, <R extends Record<string, unknown>>(options?: { body?: BodyInit, params?: Record<string, string | number> }) => Promise<{ data: R, setEnv: Store<T>['patch'] }>
  >
};

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTION';

export type HttpStatusCode =
  | 100 | 'Continue'
  | 101 | 'Switching Protocols'
  | 102 | 'Processing'
  | 103 | 'Early Hints'
  | 200 | 'OK'
  | 201 | 'Created'
  | 202 | 'Accepted'
  | 203 | 'Non-Authoritative Information'
  | 204 | 'No Content'
  | 205 | 'Reset Content'
  | 206 | 'Partial Content'
  | 207 | 'Multi-Status'
  | 208 | 'Already Reported'
  | 226 | 'IM Used'
  | 300 | 'Multiple Choices'
  | 301 | 'Moved Permanently'
  | 302 | 'Found'
  | 303 | 'See Other'
  | 304 | 'Not Modified'
  | 305 | 'Use Proxy'
  | 307 | 'Temporary Redirect'
  | 308 | 'Permanent Redirect'
  | 400 | 'Bad Request'
  | 401 | 'Unauthorized'
  | 402 | 'Payment Required'
  | 403 | 'Forbidden'
  | 404 | 'Not Found'
  | 405 | 'Method Not Allowed'
  | 406 | 'Not Acceptable'
  | 407 | 'Proxy Authentication Required'
  | 408 | 'Request Timeout'
  | 409 | 'Conflict'
  | 410 | 'Gone'
  | 411 | 'Length Required'
  | 412 | 'Precondition Failed'
  | 413 | 'Payload Too Large'
  | 414 | 'URI Too Long'
  | 415 | 'Unsupported Media Type'
  | 416 | 'Range Not Satisfiable'
  | 417 | 'Expectation Failed'
  | 418 | `I'm a Teapot`
  | 421 | 'Misdirected Request'
  | 422 | 'Unprocessable Entity'
  | 423 | 'Locked'
  | 424 | 'Failed Dependency'
  | 425 | 'Too Early'
  | 426 | 'Upgrade Required'
  | 428 | 'Precondition Required'
  | 429 | 'Too Many Requests'
  | 431 | 'Request Header Fields Too Large'
  | 451 | 'Unavailable For Legal Reasons'
  | 500 | 'Internal Server Error'
  | 501 | 'Not Implemented'
  | 502 | 'Bad Gateway'
  | 503 | 'Service Unavailable'
  | 504 | 'Gateway Timeout'
  | 505 | 'HTTP Version Not Supported'
  | 506 | 'Variant Also Negotiates'
  | 507 | 'Insufficient Storage'
  | 508 | 'Loop Detected'
  | 510 | 'Not Extended'
  | 511 | 'Network Authentication Required';
