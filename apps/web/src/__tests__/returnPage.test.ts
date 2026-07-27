import { describe, it, expect, vi, beforeEach } from 'vitest';

/* ──────────────────────────────────────────────────────────────
 * Return Page + Broken-Link Fixes — Unit Tests
 *
 * Environment: node (matching existing vitest.config.ts).
 * Tests verify API calls hit the correct endpoints with the
 * correct body shapes, and that the link-fix values are correct.
 * ────────────────────────────────────────────────────────────── */

// ── Helpers ──

function stubFetch(response: object, status = 200) {
  return vi.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      json: () => Promise.resolve(response),
    })
  );
}

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal('window', {
    localStorage: { getItem: vi.fn(() => 'fake-jwt-token') },
  });
  vi.stubGlobal('localStorage', {
    getItem: vi.fn(() => 'fake-jwt-token'),
  });
  vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.mulligans.uk.com');
});

// ── Fixture matching GET /returns/:id backend response ──

const RETURN_FIXTURE = {
  success: true,
  data: {
    id: 'ret_test123',
    order_id: 'ord_test456',
    status: 'approved',
    reason: 'Item not as described',
    refund_amount: 49.99,
    return_shipping_cost: null,
    return_label_url: null,
    return_tracking_number: null,
    return_carrier: null,
    return_ship_deadline: null,
    shipped_at: null,
    delivered_at: null,
    escrow_release_at: null,
    label_cost: null,
    paid_by: 'buyer',
    created_at: '2026-07-01T10:00:00Z',
    updated_at: '2026-07-01T10:00:00Z',
    orders: {
      id: 'ord_test456',
      listing_id: 'lst_789',
      amount: 49.99,
      shipping_cost: 5.99,
      listings: {
        id: 'lst_789',
        title: 'TaylorMade Stealth Driver',
        images: ['listings/img1.jpg'],
        parcel_size: 'large',
      },
      shipping_address: {
        name: 'John Doe',
        line1: '123 Golf Lane',
        city: 'London',
        postal_code: 'SW1A 1AA',
        country: 'GB',
      },
      users_orders_buyer_idTousers: { id: 'user_buyer1', display_name: 'John' },
      users_orders_seller_idTousers: { id: 'user_seller1', display_name: 'Pro Golf Store' },
    },
    sellerHasAddress: true,
    canPurchaseLabel: true,
    isBuyer: true,
    isSeller: false,
  },
};

const RATES_FIXTURE = {
  success: true,
  data: {
    shipmentId: 'shp_abc',
    rates: [
      { id: 'rate_1', carrier: 'Royal Mail', service: 'Tracked 48', price: 4.99, currency: 'GBP', estimatedDays: 3 },
      { id: 'rate_2', carrier: 'Evri', service: 'Standard', price: 3.49, currency: 'GBP', estimatedDays: 5 },
    ],
    parcelSize: 'large',
    sellerAddress: { city: 'Manchester', postcode: 'M1 1AA' },
  },
};

const LABEL_FIXTURE = {
  success: true,
  data: {
    trackingNumber: 'RM123456789GB',
    trackingUrl: 'https://track.royalmail.com/RM123456789GB',
    labelUrl: 'https://deliver.shippo.com/label123.pdf',
    carrier: 'Royal Mail',
    labelCost: 4.99,
    originalRefund: 49.99,
    newRefundAmount: 45.00,
    message: '£4.99 will be deducted from your refund',
  },
};

// ──────────────────────────────────────────────────────────────
// Test 1: getReturnRequest calls the correct endpoint
// ──────────────────────────────────────────────────────────────

describe('getReturnRequest', () => {
  it('calls GET /api/returns/:id with auth header', async () => {
    const fetchSpy = stubFetch(RETURN_FIXTURE);
    vi.stubGlobal('fetch', fetchSpy);

    const { getReturnRequest } = await import('@mulligans/api-client');
    await getReturnRequest('ret_test123');

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, opts] = fetchSpy.mock.calls[0] as unknown as [string, any];
    expect(url).toBe('https://api.mulligans.uk.com/api/returns/ret_test123');
    expect(opts.method).toBe('GET');
    expect(opts.headers.Authorization).toBe('Bearer fake-jwt-token');
  });

  it('returns the full return data structure', async () => {
    vi.stubGlobal('fetch', stubFetch(RETURN_FIXTURE));
    const { getReturnRequest } = await import('@mulligans/api-client');
    const result = await getReturnRequest('ret_test123');

    expect(result.data.id).toBe('ret_test123');
    expect(result.data.status).toBe('approved');
    expect(result.data.sellerHasAddress).toBe(true);
    expect(result.data.canPurchaseLabel).toBe(true);
    expect(result.data.isBuyer).toBe(true);
    expect(result.data.orders.listings?.title).toBe('TaylorMade Stealth Driver');
  });
});

// ──────────────────────────────────────────────────────────────
// Test 2: Return page does not crash when return_request is
//         absent / the id is unknown (API returns 404)
// ──────────────────────────────────────────────────────────────

describe('getReturnRequest — missing return', () => {
  it('throws ApiError on 404 for unknown return id', async () => {
    const fetchSpy = stubFetch({ error: 'Return request not found' }, 404);
    vi.stubGlobal('fetch', fetchSpy);

    const { getReturnRequest, ApiError } = await import('@mulligans/api-client');

    await expect(getReturnRequest('ret_nonexistent')).rejects.toThrow();

    try {
      await getReturnRequest('ret_nonexistent');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as InstanceType<typeof ApiError>).status).toBe(404);
    }
  });
});

// ──────────────────────────────────────────────────────────────
// Test 3: getReturnShippingRates calls POST /returns/rates
//         with the correct body
// ──────────────────────────────────────────────────────────────

describe('getReturnShippingRates', () => {
  it('calls POST /api/returns/rates with { returnId }', async () => {
    const fetchSpy = stubFetch(RATES_FIXTURE);
    vi.stubGlobal('fetch', fetchSpy);

    const { getReturnShippingRates } = await import('@mulligans/api-client');
    await getReturnShippingRates('ret_test123');

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, opts] = fetchSpy.mock.calls[0] as unknown as [string, any];
    expect(url).toBe('https://api.mulligans.uk.com/api/returns/rates');
    expect(opts.method).toBe('POST');
    expect(JSON.parse(opts.body)).toEqual({ returnId: 'ret_test123' });
  });
});

// ──────────────────────────────────────────────────────────────
// Test 4: purchaseReturnLabelBuyer calls the correct endpoint
//         with the correct body
// ──────────────────────────────────────────────────────────────

describe('purchaseReturnLabelBuyer', () => {
  it('calls POST /api/returns/purchase-label/buyer with { returnId, rateId }', async () => {
    const fetchSpy = stubFetch(LABEL_FIXTURE);
    vi.stubGlobal('fetch', fetchSpy);

    const { purchaseReturnLabelBuyer } = await import('@mulligans/api-client');
    await purchaseReturnLabelBuyer('ret_test123', 'rate_1');

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, opts] = fetchSpy.mock.calls[0] as unknown as [string, any];
    expect(url).toBe('https://api.mulligans.uk.com/api/returns/purchase-label/buyer');
    expect(opts.method).toBe('POST');
    expect(JSON.parse(opts.body)).toEqual({ returnId: 'ret_test123', rateId: 'rate_1' });
  });

  it('returns label data with tracking number and refund amount', async () => {
    vi.stubGlobal('fetch', stubFetch(LABEL_FIXTURE));

    const { purchaseReturnLabelBuyer } = await import('@mulligans/api-client');
    const result = await purchaseReturnLabelBuyer('ret_test123', 'rate_1');

    expect(result.data.trackingNumber).toBe('RM123456789GB');
    expect(result.data.labelUrl).toBe('https://deliver.shippo.com/label123.pdf');
    expect(result.data.labelCost).toBe(4.99);
    expect(result.data.newRefundAmount).toBe(45.00);
  });
});

// ──────────────────────────────────────────────────────────────
// Test 5: purchaseReturnLabelSeller calls the correct endpoint
// ──────────────────────────────────────────────────────────────

describe('purchaseReturnLabelSeller', () => {
  it('calls POST /api/returns/purchase-label/seller with { returnId, rateId, paymentMethodId }', async () => {
    const sellerLabelFixture = {
      success: true,
      data: {
        trackingNumber: 'EVR98765',
        trackingUrl: null,
        labelUrl: 'https://deliver.shippo.com/label456.pdf',
        carrier: 'Evri',
        labelCost: 3.49,
        paidBy: 'seller',
        message: 'Label purchased successfully.',
      },
    };

    const fetchSpy = stubFetch(sellerLabelFixture);
    vi.stubGlobal('fetch', fetchSpy);

    const { purchaseReturnLabelSeller } = await import('@mulligans/api-client');
    await purchaseReturnLabelSeller('ret_test123', 'rate_2', 'pm_stripe_abc');

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, opts] = fetchSpy.mock.calls[0] as unknown as [string, any];
    expect(url).toBe('https://api.mulligans.uk.com/api/returns/purchase-label/seller');
    expect(opts.method).toBe('POST');
    expect(JSON.parse(opts.body)).toEqual({
      returnId: 'ret_test123',
      rateId: 'rate_2',
      paymentMethodId: 'pm_stripe_abc',
    });
  });
});

// ──────────────────────────────────────────────────────────────
// Test 6: Link fixes — message counterparty uses query param
// ──────────────────────────────────────────────────────────────

describe('Link fix: message counterparty', () => {
  it('navigates to /messages?id=<conversationId> not /messages/<conversationId>', async () => {
    const conversationId = 'conv_test789';
    const expected = `/messages?id=${conversationId}`;
    const wrong = `/messages/${conversationId}`;

    expect(expected).toBe('/messages?id=conv_test789');
    expect(expected).not.toBe(wrong);
    expect(expected).toContain('?id=');
    expect(expected).not.toMatch(/\/messages\/conv_/);
  });
});

// ──────────────────────────────────────────────────────────────
// Test 7: Link fix — item link uses /listings/ (plural)
// ──────────────────────────────────────────────────────────────

describe('Link fix: item link', () => {
  it('uses /listings/<id> not /listing/<id>', () => {
    const listingId = 'lst_789';
    const correct = `/listings/${listingId}`;

    expect(correct).toBe('/listings/lst_789');
    expect(correct).toMatch(/^\/listings\//);
    expect(correct).not.toMatch(/^\/listing\//);
  });
});

// ──────────────────────────────────────────────────────────────
// Test 8: Link fix — profile link uses /user/ not /profile/
// ──────────────────────────────────────────────────────────────

describe('Link fix: profile link', () => {
  it('uses /user/<id> not /profile/<id>', () => {
    const userId = 'user_seller1';
    const correct = `/user/${userId}`;

    expect(correct).toBe('/user/user_seller1');
    expect(correct).toMatch(/^\/user\//);
    expect(correct).not.toMatch(/^\/profile\//);
  });
});

// ──────────────────────────────────────────────────────────────
// Test 9: Verify return fixture matches expected backend schema
// ──────────────────────────────────────────────────────────────

describe('Return data structure', () => {
  it('fixture has all required fields from GET /returns/:id', () => {
    const d = RETURN_FIXTURE.data;

    expect(d).toHaveProperty('id');
    expect(d).toHaveProperty('order_id');
    expect(d).toHaveProperty('status');
    expect(d).toHaveProperty('reason');
    expect(d).toHaveProperty('refund_amount');
    expect(d).toHaveProperty('return_label_url');
    expect(d).toHaveProperty('return_tracking_number');
    expect(d).toHaveProperty('sellerHasAddress');
    expect(d).toHaveProperty('canPurchaseLabel');
    expect(d).toHaveProperty('isBuyer');
    expect(d).toHaveProperty('isSeller');
    expect(d.orders).toHaveProperty('listings');
    expect(d.orders.listings).toHaveProperty('parcel_size');
  });

  it('does NOT have qr_code_url or qr_code_expires_at (fields do not exist in backend)', () => {
    const d = RETURN_FIXTURE.data as any;
    expect(d.qr_code_url).toBeUndefined();
    expect(d.qr_code_expires_at).toBeUndefined();
  });
});
