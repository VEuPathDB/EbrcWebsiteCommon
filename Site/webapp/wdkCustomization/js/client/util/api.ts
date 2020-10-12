import { Decoder } from 'wdk-client/Utils/Json';

/*
 * An "Api" is an abstraction for interacting with resources.
 *
 * There are two primary interfaces: `ApiRequest` and `ApiRequestHandler`.
 *
 * An `ApiRequest` represents a HTTP-like request for a resource.
 *
 * An `ApiRequestHandler` represents an implentation that can handle a request.
 * Typically this will be based on the `fetch` API.
 */

export type ApiMethod = 'GET' | 'PUT' | 'POST' | 'DELETE' | 'PATCH';

export interface ApiRequestInit<T> {
  path: string;
  method: ApiMethod;
  body?: unknown;
  headers?: Record<string, string>;
  transformResponse: (body: unknown) => Promise<T>;
}

export interface ApiRequest<T> extends ApiRequestInit<T> {
  headers: Record<string, string>;
}

// XXX Not sure if these belong here, since they are specific to an ApiRequestHandler

export function createJsonRequest<T>(init: ApiRequestInit<T>): ApiRequest<T> {
  return {
    ...init,
    headers: {
      ...init.headers,
      'Content-Type': 'application/json'
    }
  }
}

export function createPlainTextRequest<T>(init: ApiRequestInit<T>): ApiRequest<T> {
  return {
    ...init,
    headers: {
      ...init.headers,
      'Content-Type': 'text/plain'
    }
  }
}

export function standardTransformer<T>(decoder: Decoder<T>) {
  return async function transform(body: unknown): Promise<T> {
    const result = decoder(body);
    if (result.status === 'ok') return result.value;
    const report = `Expected ${result.expected}${result.context ? ('at _' + result.context) : ''}, but got ${JSON.stringify(result.value)}.`;
    throw new Error("Could not decode response.\n" + report);
}
}

export interface ApiRequestHandler {
  <T>(request: ApiRequest<T>): Promise<T>;
}

export interface FetchApiOptions {
  baseUrl: string;
  headers?: Record<string, string>;
  init?: RequestInit;
  fetchApi?: Window['fetch'];
}

export function createFetchApiRequestHandler(options: FetchApiOptions): ApiRequestHandler {
  const { baseUrl, headers, fetchApi = window.fetch } = options;
  return async function fetchApiRequestHandler<T>(apiRequest: ApiRequest<T>): Promise<T> {
    const { transformResponse, path, body, ...init } = apiRequest;
    const request = new Request(baseUrl + path, {
      ...init,
      body: JSON.stringify(body),
      headers: {
        ...init.headers,
        ...headers
      }
    });
    const response = await fetchApi(request);
    if (response.ok) {
      const responseBody = response.headers.get('Content-Type')?.startsWith('application/json')
        ? await response.json()
        : await response.text();
        return await transformResponse(responseBody);
    }
    throw new Error(`${response.status} ${response.statusText}${'\n'}${await response.text()}`);
  }
}
