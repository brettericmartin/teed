import { ApiError } from './errors';

type RequestOptions = {
  signal?: AbortSignal;
  headers?: Record<string, string>;
};

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: RequestOptions
): Promise<T> {
  const init: RequestInit = {
    method,
    headers: { ...options?.headers },
    signal: options?.signal,
  };

  if (body !== undefined && body !== null) {
    if (body instanceof FormData) {
      init.body = body;
    } else {
      init.body = JSON.stringify(body);
      (init.headers as Record<string, string>)['Content-Type'] = 'application/json';
    }
  }

  const res = await fetch(path, init);

  if (!res.ok) {
    let errorData: any = {};
    try { errorData = await res.json(); } catch {}
    throw new ApiError(res.status, errorData.error || res.statusText, errorData);
  }

  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>('GET', path, undefined, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('POST', path, body, opts),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('PUT', path, body, opts),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('PATCH', path, body, opts),
  del: <T>(path: string, opts?: RequestOptions) => request<T>('DELETE', path, undefined, opts),

  /** Fire-and-forget — swallows errors, for analytics/telemetry */
  fire: (path: string, body?: unknown) => {
    request('POST', path, body).catch(() => {});
  },
};
