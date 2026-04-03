// tests/tools/changelogs.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeaturebaseClient } from '../../src/client.ts';
import { CHANGELOGS_TOOLS, handleChangelogs } from '../../src/tools/changelogs.ts';

const mockClient = {
  get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn(),
} as unknown as FeaturebaseClient;
beforeEach(() => vi.resetAllMocks());

describe('CHANGELOGS_TOOLS', () => {
  it('exposes 9 tools', () => { expect(CHANGELOGS_TOOLS).toHaveLength(9); });
});

describe('handleChangelogs', () => {
  it('list_changelogs calls GET /v2/changelogs', async () => {
    mockClient.get = vi.fn().mockResolvedValue({ data: [] });
    await handleChangelogs('list_changelogs', {}, mockClient);
    expect(mockClient.get).toHaveBeenCalledWith('/v2/changelogs', {});
  });

  it('create_changelog calls POST /v2/changelogs', async () => {
    mockClient.post = vi.fn().mockResolvedValue({ id: 'c1' });
    await handleChangelogs('create_changelog', { title: 'v2.0', markdownContent: '# Changes' }, mockClient);
    expect(mockClient.post).toHaveBeenCalledWith('/v2/changelogs', { title: 'v2.0', markdownContent: '# Changes' });
  });

  it('publish_changelog calls POST /v2/changelogs/:id/publish', async () => {
    mockClient.post = vi.fn().mockResolvedValue({});
    await handleChangelogs('publish_changelog', { id: 'c1' }, mockClient);
    expect(mockClient.post).toHaveBeenCalledWith('/v2/changelogs/c1/publish', {});
  });

  it('unpublish_changelog calls POST /v2/changelogs/:id/unpublish', async () => {
    mockClient.post = vi.fn().mockResolvedValue({});
    await handleChangelogs('unpublish_changelog', { id: 'c1' }, mockClient);
    expect(mockClient.post).toHaveBeenCalledWith('/v2/changelogs/c1/unpublish', {});
  });

  it('add_changelog_subscribers calls POST /v2/changelogs/subscribers', async () => {
    mockClient.post = vi.fn().mockResolvedValue({});
    await handleChangelogs('add_changelog_subscribers', { emails: ['a@test.com'] }, mockClient);
    expect(mockClient.post).toHaveBeenCalledWith('/v2/changelogs/subscribers', { emails: ['a@test.com'] });
  });

  it('update_changelog calls PATCH /v2/changelogs/:id', async () => {
    mockClient.patch = vi.fn().mockResolvedValue({ id: 'c1' });
    await handleChangelogs('update_changelog', { id: 'c1', title: 'Updated' }, mockClient);
    expect(mockClient.patch).toHaveBeenCalledWith('/v2/changelogs/c1', { title: 'Updated' });
  });

  it('delete_changelog calls DELETE /v2/changelogs/:id', async () => {
    mockClient.delete = vi.fn().mockResolvedValue(undefined);
    await handleChangelogs('delete_changelog', { id: 'c1' }, mockClient);
    expect(mockClient.delete).toHaveBeenCalledWith('/v2/changelogs/c1');
  });

  it('get_changelog calls GET /v2/changelogs/:id', async () => {
    mockClient.get = vi.fn().mockResolvedValue({ id: 'c1' });
    await handleChangelogs('get_changelog', { id: 'c1' }, mockClient);
    expect(mockClient.get).toHaveBeenCalledWith('/v2/changelogs/c1', {});
  });

  it('remove_changelog_subscribers calls DELETE /v2/changelogs/subscribers with body', async () => {
    mockClient.delete = vi.fn().mockResolvedValue({});
    await handleChangelogs('remove_changelog_subscribers', { emails: ['a@test.com'] }, mockClient);
    expect(mockClient.delete).toHaveBeenCalledWith('/v2/changelogs/subscribers', { emails: ['a@test.com'] });
  });
});
