// tests/tools/boards.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeaturebaseClient } from '../../src/client.ts';
import { BOARDS_TOOLS, handleBoards } from '../../src/tools/boards.ts';
import { POST_STATUSES_TOOLS, handlePostStatuses } from '../../src/tools/post_statuses.ts';

const mockClient = {
  get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn(),
} as unknown as FeaturebaseClient;
beforeEach(() => vi.resetAllMocks());

describe('BOARDS_TOOLS', () => {
  it('exposes 2 tools', () => { expect(BOARDS_TOOLS).toHaveLength(2); });
});

describe('handleBoards', () => {
  it('list_boards calls GET /v2/boards', async () => {
    mockClient.get = vi.fn().mockResolvedValue({ data: [] });
    await handleBoards('list_boards', {}, mockClient);
    expect(mockClient.get).toHaveBeenCalledWith('/v2/boards', {});
  });

  it('get_board calls GET /v2/boards/:id', async () => {
    mockClient.get = vi.fn().mockResolvedValue({ id: 'abc' });
    await handleBoards('get_board', { id: 'abc' }, mockClient);
    expect(mockClient.get).toHaveBeenCalledWith('/v2/boards/abc', {});
  });
});

describe('POST_STATUSES_TOOLS', () => {
  it('exposes 2 tools', () => { expect(POST_STATUSES_TOOLS).toHaveLength(2); });
});

describe('handlePostStatuses', () => {
  it('list_post_statuses calls GET /v2/post_statuses', async () => {
    mockClient.get = vi.fn().mockResolvedValue({ data: [] });
    await handlePostStatuses('list_post_statuses', {}, mockClient);
    expect(mockClient.get).toHaveBeenCalledWith('/v2/post_statuses', {});
  });
});
