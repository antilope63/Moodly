import { STRAPI_API_TOKEN, STRAPI_URL } from '@/constants/config';
import type { StrapiErrorPayload } from '@/types/strapi';

type RequestOptions = RequestInit & {
  query?: Record<string, string | number | boolean | undefined>;
};

const buildUrl = (path: string, query?: RequestOptions['query']) => {
  const url = new URL(path, STRAPI_URL.endsWith('/') ? STRAPI_URL : `${STRAPI_URL}/`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
};

const buildHeaders = (headers?: HeadersInit): HeadersInit => {
  const defaultHeaders: HeadersInit = {
    Accept: 'application/json',
  };

  if (STRAPI_API_TOKEN) {
    defaultHeaders.Authorization = `Bearer ${STRAPI_API_TOKEN}`;
  }

  if (!headers || (headers && !(headers as Record<string, string>)['Content-Type'])) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  return {
    ...defaultHeaders,
    ...(headers ?? {}),
  };
};

export const apiFetch = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const { query, headers, ...rest } = options;

  const response = await fetch(buildUrl(path, query), {
    ...rest,
    headers: buildHeaders(headers),
  });

  if (!response.ok) {
    const errorPayload: StrapiErrorPayload | undefined = await response
      .json()
      .catch(() => undefined);
    const message =
      errorPayload?.message ?? `Strapi request failed with status ${response.status}.`;
    const error = new Error(message);
    Object.assign(error, { details: errorPayload });
    throw error;
  }

  return (await response.json()) as T;
};
