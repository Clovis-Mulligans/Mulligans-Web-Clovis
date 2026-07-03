import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('importListingsCsv', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('window', {
      localStorage: { getItem: vi.fn(() => 'fake-jwt-token') },
    });
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => 'fake-jwt-token'),
    });
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.mulligans.uk.com');
  });

  it('sends a multipart POST to /api/listings/import with the file', async () => {
    const mockResponse = {
      created: [{ id: '1', title: 'Test Club', external_id: 'SKU-001' }],
      updated: [],
      skipped: [],
      failed: [],
      warnings: [],
    };

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    const { importListingsCsv } = await import('@mulligans/api-client');
    const file = new File(['title,price\nTest Club,99.99'], 'test.csv', { type: 'text/csv' });
    const result = await importListingsCsv(file);

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, options] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://api.mulligans.uk.com/api/listings/import');
    expect(options.method).toBe('POST');
    expect(options.headers.Authorization).toBe('Bearer fake-jwt-token');
    expect(options.body).toBeInstanceOf(FormData);
    expect(options.body.get('file')).toBeInstanceOf(File);
    expect(result.created).toHaveLength(1);
    expect(result.created[0].external_id).toBe('SKU-001');
  });

  it('throws ApiError on server error', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: () => Promise.resolve({ error: 'CSV too large' }),
    });

    const { importListingsCsv } = await import('@mulligans/api-client');
    const file = new File(['bad'], 'test.csv', { type: 'text/csv' });

    await expect(importListingsCsv(file)).rejects.toThrow('400');
  });
});

describe('publishListing', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('window', {
      localStorage: { getItem: vi.fn(() => 'fake-jwt-token') },
    });
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => 'fake-jwt-token'),
    });
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.mulligans.uk.com');
  });

  it('sends PUT to /api/listings/:id/publish', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: 'listing-1', status: 'active' }),
    });

    const { publishListing } = await import('@mulligans/api-client');
    const result = await publishListing('listing-1');

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, options] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://api.mulligans.uk.com/api/listings/listing-1/publish');
    expect(options.method).toBe('PUT');
    expect(result.status).toBe('active');
  });

  it('throws ApiError on 409 (missing images)', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 409,
      statusText: 'Conflict',
      json: () => Promise.resolve({ error: 'Listing must have at least 1 image' }),
    });

    const { publishListing } = await import('@mulligans/api-client');
    await expect(publishListing('listing-1')).rejects.toThrow('409');
  });
});

describe('publishListingsBulk', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('window', {
      localStorage: { getItem: vi.fn(() => 'fake-jwt-token') },
    });
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => 'fake-jwt-token'),
    });
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.mulligans.uk.com');
  });

  it('sends PUT to /api/listings/publish-bulk with listing_ids', async () => {
    const mockResponse = {
      published: ['id-1', 'id-2'],
      skipped: [{ id: 'id-3', reason: 'Listing must have at least 1 image' }],
    };

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    const { publishListingsBulk } = await import('@mulligans/api-client');
    const result = await publishListingsBulk(['id-1', 'id-2', 'id-3']);

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, options] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://api.mulligans.uk.com/api/listings/publish-bulk');
    expect(options.method).toBe('PUT');
    expect(JSON.parse(options.body)).toEqual({ listing_ids: ['id-1', 'id-2', 'id-3'] });
    expect(result.published).toHaveLength(2);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0].reason).toContain('image');
  });
});
