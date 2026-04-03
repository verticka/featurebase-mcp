// src/client.ts

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

const BASE_URL = 'https://do.featurebase.app';
const API_VERSION = '2026-01-01.nova';

const ERROR_MESSAGES: Record<number, string> = {
  400: 'Bad request (400)',
  401: 'Invalid API key (401)',
  403: 'Access denied (403)',
  404: 'Resource not found (404)',
  422: 'Validation error (422)',
  429: 'Rate limit exceeded (429)',
  500: 'Featurebase server error (500)',
};

export class FeaturebaseClient {
  constructor(private readonly apiKey: string) {}

  private buildUrl(path: string, params: Record<string, string> = {}): string {
    const url = new URL(path, BASE_URL);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    return url.toString();
  }

  private async request<T>(method: HttpMethod, path: string, params?: Record<string, string>, body?: unknown): Promise<T> {
    const url = this.buildUrl(path, params);
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Featurebase-Version': API_VERSION,
      'Accept': 'application/json',
    };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    const options: RequestInit = {
      method,
      headers,
    };
    if (body !== undefined) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const message = ERROR_MESSAGES[response.status] ?? `Unexpected error (${response.status})`;
      let detail = '';
      try {
        const errBody = await response.json() as Record<string, unknown>;
        if (errBody?.message) detail = `: ${errBody.message}`;
        else if (errBody?.error) detail = `: ${errBody.error}`;
      } catch { /* no JSON body */ }
      throw new Error(message + detail);
    }

    if (response.status === 204) return undefined as T;

    try {
      return await response.json() as T;
    } catch {
      throw new Error(`Non-JSON response from Featurebase (${response.status})`);
    }
  }

  get<T>(path: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>('GET', path, params);
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, undefined, body);
  }

  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, undefined, body);
  }

  delete<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('DELETE', path, undefined, body);
  }
}

export function createClient(): FeaturebaseClient {
  const key = process.env.FEATUREBASE_API_KEY;
  if (!key) {
    throw new Error(
      'Missing environment variable FEATUREBASE_API_KEY.\n' +
      'Find your API key in Featurebase settings under Integrations.'
    );
  }
  return new FeaturebaseClient(key);
}
