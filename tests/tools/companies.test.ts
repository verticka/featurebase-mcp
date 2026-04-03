// tests/tools/companies.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeaturebaseClient } from '../../src/client.ts';
import { COMPANIES_TOOLS, handleCompanies } from '../../src/tools/companies.ts';

const mockClient = {
  get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn(),
} as unknown as FeaturebaseClient;
beforeEach(() => vi.resetAllMocks());

describe('COMPANIES_TOOLS', () => {
  it('exposes 8 tools', () => { expect(COMPANIES_TOOLS).toHaveLength(8); });
});

describe('handleCompanies', () => {
  it('list_companies calls GET /v2/companies', async () => {
    mockClient.get = vi.fn().mockResolvedValue({ data: [] });
    await handleCompanies('list_companies', {}, mockClient);
    expect(mockClient.get).toHaveBeenCalledWith('/v2/companies', {});
  });

  it('create_or_update_company calls POST /v2/companies', async () => {
    mockClient.post = vi.fn().mockResolvedValue({ id: 'co1' });
    await handleCompanies('create_or_update_company', { companyId: 'ext-1', name: 'Acme' }, mockClient);
    expect(mockClient.post).toHaveBeenCalledWith('/v2/companies', { companyId: 'ext-1', name: 'Acme' });
  });

  it('get_company calls GET /v2/companies/:id', async () => {
    mockClient.get = vi.fn().mockResolvedValue({ id: 'co1' });
    await handleCompanies('get_company', { id: 'co1' }, mockClient);
    expect(mockClient.get).toHaveBeenCalledWith('/v2/companies/co1', {});
  });

  it('delete_company calls DELETE /v2/companies/:id', async () => {
    mockClient.delete = vi.fn().mockResolvedValue(undefined);
    await handleCompanies('delete_company', { id: 'co1' }, mockClient);
    expect(mockClient.delete).toHaveBeenCalledWith('/v2/companies/co1');
  });

  it('attach_contact_to_company calls POST /v2/companies/:id/contacts', async () => {
    mockClient.post = vi.fn().mockResolvedValue({});
    await handleCompanies('attach_contact_to_company', { id: 'co1', contactId: 'ct1' }, mockClient);
    expect(mockClient.post).toHaveBeenCalledWith('/v2/companies/co1/contacts', { contactId: 'ct1' });
  });

  it('remove_contact_from_company calls DELETE /v2/companies/:id/contacts/:contactId', async () => {
    mockClient.delete = vi.fn().mockResolvedValue(undefined);
    await handleCompanies('remove_contact_from_company', { id: 'co1', contactId: 'ct1' }, mockClient);
    expect(mockClient.delete).toHaveBeenCalledWith('/v2/companies/co1/contacts/ct1');
  });
});
