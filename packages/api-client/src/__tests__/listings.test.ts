import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('listing endpoint unwrapping', () => {
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

  describe('getListing', () => {
    it('unwraps the { listing } envelope and returns the inner object', async () => {
      const innerListing = {
        id: 'lst_abc123',
        title: 'Titleist TSR2 Driver',
        price: '299.99',
        category: 'Clubs',
        condition_overall: 4,
        images: [],
      };

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ listing: innerListing }),
      });

      const { getListing } = await import('../endpoints/listings');
      const result = await getListing('lst_abc123');

      expect(result.title).toBe('Titleist TSR2 Driver');
      expect(result.id).toBe('lst_abc123');
      expect((result as Record<string, unknown>).listing).toBeUndefined();
    });
  });

  describe('createListing', () => {
    it('unwraps the { listing } envelope and returns the created listing with id', async () => {
      const innerListing = {
        id: 'lst_new456',
        title: 'Callaway Rogue ST Max',
        price: '199.99',
        category: 'Clubs',
        status: 'draft',
      };

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ listing: innerListing }),
      });

      const { createListing } = await import('../endpoints/listings');
      const result = await createListing({
        title: 'Callaway Rogue ST Max',
        category: 'Clubs',
        price: 199.99,
      });

      expect(result.id).toBe('lst_new456');
      expect(result.title).toBe('Callaway Rogue ST Max');
      expect((result as Record<string, unknown>).listing).toBeUndefined();
    });
  });

  describe('updateListing', () => {
    it('unwraps the { listing } envelope and returns the updated listing', async () => {
      const innerListing = {
        id: 'lst_upd789',
        title: 'Updated Title',
        price: '149.99',
        category: 'Clubs',
        status: 'active',
      };

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ listing: innerListing }),
      });

      const { updateListing } = await import('../endpoints/listings');
      const result = await updateListing('lst_upd789', { title: 'Updated Title' });

      expect(result.id).toBe('lst_upd789');
      expect(result.title).toBe('Updated Title');
      expect((result as Record<string, unknown>).listing).toBeUndefined();
    });
  });

  describe('uploadListingImage', () => {
    it('throws ApiError with status code on non-ok response', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 413,
        statusText: 'Payload Too Large',
        json: () => Promise.resolve({ message: 'File too large' }),
      });

      const { uploadListingImage } = await import('../endpoints/listings');
      const file = new File(['x'], 'big.jpg', { type: 'image/jpeg' });

      try {
        await uploadListingImage('lst_test', file);
        expect.fail('Should have thrown');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(Error);
        expect((err as { status: number }).status).toBe(413);
        expect((err as { statusText: string }).statusText).toBe('Payload Too Large');
      }
    });
  });
});
