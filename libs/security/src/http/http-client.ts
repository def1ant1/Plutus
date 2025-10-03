import axios, { AxiosInstance } from 'axios';

/**
 * Minimal HTTP client wrapper so the security library can be reused inside
 * non-Nest runtimes (e.g. background workers) while still allowing callers to
 * stub requests in unit tests without monkey-patching global fetch.
 */
export class HttpClient {
  private readonly client: AxiosInstance;

  constructor(baseConfig?: { timeoutMs?: number }) {
    this.client = axios.create({
      timeout: baseConfig?.timeoutMs ?? 5_000,
      headers: {
        'User-Agent': 'plutus-security/0.1 (+https://example.com)',
        Accept: 'application/json',
      },
    });
  }

  async getJson<T>(url: string): Promise<T> {
    const response = await this.client.get<T>(url);
    return response.data;
  }
}
