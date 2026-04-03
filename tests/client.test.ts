// tests/client.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeaturebaseClient } from '../src/client.ts';

describe('FeaturebaseClient', () => {
  const client = new FeaturebaseClient('test_api_key');

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('sends Bearer token and version header on GET', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await client.get('/v2/boards');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://do.featurebase.app/v2/boards',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test_api_key',
          'Featurebase-Version': '2026-01-01.nova',
        }),
      })
    );
  });

  it('throws English error on 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    }));

    await expect(client.get('/v2/boards')).rejects.toThrow('Invalid API key (401)');
  });

  it('throws English error on 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({}),
    }));

    await expect(client.get('/v2/posts/abc')).rejects.toThrow('Resource not found (404)');
  });

  it('sends POST with JSON body', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: '1' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await client.post('/v2/posts', { title: 'Test', boardId: 'abc' });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://do.featurebase.app/v2/posts',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: 'Test', boardId: 'abc' }),
      })
    );
  });

  it('throws on non-JSON response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => { throw new SyntaxError('Unexpected token'); },
    }));

    await expect(client.get('/v2/boards')).rejects.toThrow('Non-JSON response from Featurebase (200)');
  });

  it('appends query params correctly', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await client.get('/v2/posts', { limit: '10', boardId: 'abc' });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('limit=10');
    expect(calledUrl).toContain('boardId=abc');
  });
});
