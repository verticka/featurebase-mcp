// tests/tools/help_center.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeaturebaseClient } from '../../src/client.ts';
import { HELP_CENTER_TOOLS, handleHelpCenter } from '../../src/tools/help_center.ts';

const mockClient = {
  get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn(),
} as unknown as FeaturebaseClient;
beforeEach(() => vi.resetAllMocks());

describe('HELP_CENTER_TOOLS', () => {
  it('exposes 18 tools', () => { expect(HELP_CENTER_TOOLS).toHaveLength(18); });
});

describe('handleHelpCenter', () => {
  it('list_help_centers calls GET /v2/help_center/help_centers', async () => {
    mockClient.get = vi.fn().mockResolvedValue({ data: [] });
    await handleHelpCenter('list_help_centers', {}, mockClient);
    expect(mockClient.get).toHaveBeenCalledWith('/v2/help_center/help_centers');
  });

  it('create_article calls POST /v2/help_center/articles', async () => {
    mockClient.post = vi.fn().mockResolvedValue({ id: 'a1' });
    await handleHelpCenter('create_article', { title: 'Getting started' }, mockClient);
    expect(mockClient.post).toHaveBeenCalledWith('/v2/help_center/articles', { title: 'Getting started' });
  });

  it('update_article calls PATCH /v2/help_center/articles/:id', async () => {
    mockClient.patch = vi.fn().mockResolvedValue({ id: 'a1' });
    await handleHelpCenter('update_article', { id: 'a1', title: 'Updated' }, mockClient);
    expect(mockClient.patch).toHaveBeenCalledWith('/v2/help_center/articles/a1', { title: 'Updated' });
  });

  it('create_collection calls POST /v2/help_center/collections', async () => {
    mockClient.post = vi.fn().mockResolvedValue({ id: 'col1' });
    await handleHelpCenter('create_collection', { name: 'Getting Started' }, mockClient);
    expect(mockClient.post).toHaveBeenCalledWith('/v2/help_center/collections', { name: 'Getting Started' });
  });

  it('delete_article calls DELETE /v2/help_center/articles/:id', async () => {
    mockClient.delete = vi.fn().mockResolvedValue(undefined);
    await handleHelpCenter('delete_article', { id: 'a1' }, mockClient);
    expect(mockClient.delete).toHaveBeenCalledWith('/v2/help_center/articles/a1');
  });

  it('get_redirect_rule_by_url calls GET with url param', async () => {
    mockClient.get = vi.fn().mockResolvedValue({ id: 'r1' });
    await handleHelpCenter('get_redirect_rule_by_url', { url: '/old-path' }, mockClient);
    expect(mockClient.get).toHaveBeenCalledWith('/v2/help_center/redirect_rules/by-url', { url: '/old-path' });
  });
});
