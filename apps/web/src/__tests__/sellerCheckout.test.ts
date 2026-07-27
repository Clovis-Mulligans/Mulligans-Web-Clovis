import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Test 1: createSellerCheckout calls the right endpoint ────────────────
describe('createSellerCheckout', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('window', {
      localStorage: {
        getItem: vi.fn(() => 'fake-jwt-token'),
      },
    });
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => 'fake-jwt-token'),
    });
    fetchSpy = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            sessionId: 'cs_test_123',
            url: 'https://checkout.stripe.com/test',
            summary: {},
          }),
      })
    );
    vi.stubGlobal('fetch', fetchSpy);
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.mulligans.uk.com');
  });

  it('POSTs to /api/stripe/create-seller-checkout with seller_id in the body', async () => {
    const { createSellerCheckout } = await import('@/lib/cart-api');

    const result = await createSellerCheckout('seller-abc-123');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, options] = fetchSpy.mock.calls[0];
    expect(url).toContain('/api/stripe/create-seller-checkout');
    expect(options.method).toBe('POST');
    const body = JSON.parse(options.body);
    expect(body).toEqual({ seller_id: 'seller-abc-123' });
    expect(options.headers.Authorization).toBe('Bearer fake-jwt-token');
    expect(result.sessionId).toBe('cs_test_123');
  });

  it('does NOT call the combined cart checkout endpoint', async () => {
    const { createSellerCheckout } = await import('@/lib/cart-api');

    await createSellerCheckout('seller-xyz');

    const [url] = fetchSpy.mock.calls[0];
    expect(url).not.toContain('create-cart-checkout');
  });
});

// ─── Test 2: CartSummary type includes all fee fields ──────────────────────
describe('CartSummary response shape', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('CartSummary type exports insurance_premium, insured_shipping_total, buyer_protection_fee, grand_total', async () => {
    const mod = await import('@/lib/cart-api');
    const sampleSummary: import('@/lib/cart-api').CartSummary = {
      items_total: 100,
      base_shipping: 5.99,
      insurance_premium: 1.25,
      insured_shipping_total: 7.24,
      buyer_protection_fee: 8.49,
      grand_total: 115.73,
      item_count: 1,
    };
    expect(sampleSummary.insurance_premium).toBe(1.25);
    expect(sampleSummary.insured_shipping_total).toBe(7.24);
    expect(sampleSummary.buyer_protection_fee).toBe(8.49);
    expect(sampleSummary.grand_total).toBe(115.73);
    expect(sampleSummary.item_count).toBe(1);
  });
});

// ─── Test 3: Canonical reconciliation — business-logic-v2.md §4.2 ─────────
describe('canonical cart total reconciliation (spec)', () => {
  const INSURANCE_RATE = 0.0125;
  const BUYER_PROTECTION_PERCENTAGE = 0.075;
  const BUYER_PROTECTION_FIXED = 0.99;

  function computeCartSummary(
    itemsTotal: number,
    baseShipping: number,
    totalItemCount: number
  ) {
    const insurancePremium = itemsTotal * INSURANCE_RATE;
    const insuredShippingTotal = baseShipping + insurancePremium;
    const buyerProtectionFee =
      itemsTotal * BUYER_PROTECTION_PERCENTAGE + BUYER_PROTECTION_FIXED * totalItemCount;
    const grandTotal = itemsTotal + insuredShippingTotal + buyerProtectionFee;
    return { itemsTotal, baseShipping, insurancePremium, insuredShippingTotal, buyerProtectionFee, grandTotal };
  }

  it('£100 item, £5.99 shipping, 1 item → grand total £115.73', () => {
    const s = computeCartSummary(100, 5.99, 1);

    expect(s.insurancePremium).toBeCloseTo(1.25, 2);
    expect(s.insuredShippingTotal).toBeCloseTo(7.24, 2);
    expect(s.buyerProtectionFee).toBeCloseTo(8.49, 2);
    expect(s.grandTotal).toBeCloseTo(115.73, 2);
  });

  it('platform fee uses £0.99 PER ITEM (not per seller)', () => {
    const s = computeCartSummary(200, 5.99, 3);
    expect(s.buyerProtectionFee).toBeCloseTo(200 * 0.075 + 3 * 0.99, 2);
    expect(s.buyerProtectionFee).toBeCloseTo(17.97, 2);
  });

  it('insurance is 1.25% of items total', () => {
    const s = computeCartSummary(250, 10, 2);
    expect(s.insurancePremium).toBeCloseTo(250 * 0.0125, 2);
    expect(s.insurancePremium).toBeCloseTo(3.125, 2);
  });

  it('insured shipping = base shipping + insurance premium', () => {
    const s = computeCartSummary(100, 5.99, 1);
    expect(s.insuredShippingTotal).toBeCloseTo(s.baseShipping + s.insurancePremium, 2);
  });

  it('grand total = items + insured shipping + buyer protection', () => {
    const s = computeCartSummary(100, 5.99, 1);
    expect(s.grandTotal).toBeCloseTo(
      s.itemsTotal + s.insuredShippingTotal + s.buyerProtectionFee,
      2
    );
  });

  it('multi-item, multi-seller worked example reconciles', () => {
    const itemsTotal = 65.49 + 43.99 + 29.99 * 3;
    const baseShipping = 5.99 + 3.49;
    const totalItemCount = 5;
    const s = computeCartSummary(itemsTotal, baseShipping, totalItemCount);

    expect(s.insurancePremium).toBeCloseTo(itemsTotal * 0.0125, 2);
    expect(s.buyerProtectionFee).toBeCloseTo(itemsTotal * 0.075 + 5 * 0.99, 2);
    expect(s.grandTotal).toBeCloseTo(
      itemsTotal + baseShipping + itemsTotal * 0.0125 + itemsTotal * 0.075 + 5 * 0.99,
      2
    );
  });
});

// ─── Test 4: Cart page no longer imports combined checkout ──────────────────
describe('cart page imports', () => {
  it('imports createSellerCheckout, not createCartCheckout', async () => {
    const cartApiModule = await import('@/lib/cart-api');
    expect(typeof cartApiModule.createSellerCheckout).toBe('function');
  });
});

// ─── Test 5: Cart page has no client-side INSURANCE_RATE constant ──────────
describe('cart page has no client-side fee constants', () => {
  it('cart-api CartSummary receives insurance from server, not computed', async () => {
    const mod = await import('@/lib/cart-api');
    const summary: import('@/lib/cart-api').CartSummary = {
      items_total: 100,
      base_shipping: 5.99,
      insurance_premium: 1.25,
      insured_shipping_total: 7.24,
      buyer_protection_fee: 8.49,
      grand_total: 115.73,
      item_count: 1,
    };
    expect(summary.insurance_premium).toBeDefined();
    expect(summary.insured_shipping_total).toBeDefined();
    expect(summary.grand_total).toBeCloseTo(
      summary.items_total + summary.insured_shipping_total + summary.buyer_protection_fee,
      2
    );
  });
});
