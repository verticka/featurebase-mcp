// tests/tools/posts.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeaturebaseClient } from '../../src/client.ts';
import { POSTS_TOOLS, handlePosts } from '../../src/tools/posts.ts';

const mockClient = {
  get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn(),
} as unknown as FeaturebaseClient;
beforeEach(() => vi.resetAllMocks());

describe('POSTS_TOOLS', () => {
  it('exposes 8 tools', () => { expect(POSTS_TOOLS).toHaveLength(8); });
});

describe('handlePosts', () => {
  it('list_posts calls GET /v2/posts with filters', async () => {
    mockClient.get = vi.fn().mockResolvedValue({ data: [] });
    await handlePosts('list_posts', { boardId: 'b1', limit: 20 }, mockClient);
    expect(mockClient.get).toHaveBeenCalledWith('/v2/posts', { boardId: 'b1', limit: '20' });
  });

  it('create_post calls POST /v2/posts', async () => {
    mockClient.post = vi.fn().mockResolvedValue({ id: 'p1' });
    await handlePosts('create_post', { title: 'New feature', boardId: 'b1' }, mockClient);
    expect(mockClient.post).toHaveBeenCalledWith('/v2/posts', { title: 'New feature', boardId: 'b1' });
  });

  it('get_post calls GET /v2/posts/:id', async () => {
    mockClient.get = vi.fn().mockResolvedValue({ id: 'p1' });
    await handlePosts('get_post', { id: 'p1' }, mockClient);
    expect(mockClient.get).toHaveBeenCalledWith('/v2/posts/p1', {});
  });

  it('update_post calls PATCH /v2/posts/:id', async () => {
    mockClient.patch = vi.fn().mockResolvedValue({ id: 'p1' });
    await handlePosts('update_post', { id: 'p1', title: 'Updated' }, mockClient);
    expect(mockClient.patch).toHaveBeenCalledWith('/v2/posts/p1', { title: 'Updated' });
  });

  it('delete_post calls DELETE /v2/posts/:id', async () => {
    mockClient.delete = vi.fn().mockResolvedValue(undefined);
    await handlePosts('delete_post', { id: 'p1' }, mockClient);
    expect(mockClient.delete).toHaveBeenCalledWith('/v2/posts/p1');
  });

  it('add_post_voter calls POST /v2/posts/:id/voters', async () => {
    mockClient.post = vi.fn().mockResolvedValue({});
    await handlePosts('add_post_voter', { id: 'p1', userId: 'u1' }, mockClient);
    expect(mockClient.post).toHaveBeenCalledWith('/v2/posts/p1/voters', { userId: 'u1' });
  });
});
