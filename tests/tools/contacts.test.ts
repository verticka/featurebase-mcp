// tests/tools/contacts.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeaturebaseClient } from '../../src/client.ts';
import { CONTACTS_TOOLS, handleContacts } from '../../src/tools/contacts.ts';

const mockClient = {
  get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn(),
} as unknown as FeaturebaseClient;
beforeEach(() => vi.resetAllMocks());

describe('CONTACTS_TOOLS', () => {
  it('exposes 8 tools', () => { expect(CONTACTS_TOOLS).toHaveLength(8); });
});

describe('handleContacts', () => {
  it('list_contacts calls GET /v2/contacts', async () => {
    mockClient.get = vi.fn().mockResolvedValue({ data: [] });
    await handleContacts('list_contacts', {}, mockClient);
    expect(mockClient.get).toHaveBeenCalledWith('/v2/contacts', {});
  });

  it('create_or_update_contact calls POST /v2/contacts', async () => {
    mockClient.post = vi.fn().mockResolvedValue({ id: 'c1' });
    await handleContacts('create_or_update_contact', { email: 'test@test.com', name: 'Test' }, mockClient);
    expect(mockClient.post).toHaveBeenCalledWith('/v2/contacts', { email: 'test@test.com', name: 'Test' });
  });

  it('get_contact calls GET /v2/contacts/:id', async () => {
    mockClient.get = vi.fn().mockResolvedValue({ id: 'c1' });
    await handleContacts('get_contact', { id: 'c1' }, mockClient);
    expect(mockClient.get).toHaveBeenCalledWith('/v2/contacts/c1', {});
  });

  it('delete_contact calls DELETE /v2/contacts/:id', async () => {
    mockClient.delete = vi.fn().mockResolvedValue(undefined);
    await handleContacts('delete_contact', { id: 'c1' }, mockClient);
    expect(mockClient.delete).toHaveBeenCalledWith('/v2/contacts/c1');
  });

  it('get_contact_by_user_id calls GET /v2/contacts/by-user-id/:userId', async () => {
    mockClient.get = vi.fn().mockResolvedValue({ id: 'c1' });
    await handleContacts('get_contact_by_user_id', { userId: 'u1' }, mockClient);
    expect(mockClient.get).toHaveBeenCalledWith('/v2/contacts/by-user-id/u1', {});
  });

  it('block_contact calls POST /v2/contacts/:id/block', async () => {
    mockClient.post = vi.fn().mockResolvedValue({});
    await handleContacts('block_contact', { id: 'c1' }, mockClient);
    expect(mockClient.post).toHaveBeenCalledWith('/v2/contacts/c1/block', {});
  });

  it('unblock_contact calls POST /v2/contacts/:id/unblock', async () => {
    mockClient.post = vi.fn().mockResolvedValue({});
    await handleContacts('unblock_contact', { id: 'c1' }, mockClient);
    expect(mockClient.post).toHaveBeenCalledWith('/v2/contacts/c1/unblock', {});
  });
});
