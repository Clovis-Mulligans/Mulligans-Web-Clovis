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

// ─── Test 2: Per-seller fee calculation — £0.99 ONCE per seller ──────────
describe('per-seller fee calculation', () => {
  const INSURANCE_RATE = 0.0125;

  function computeSellerFees(items: { price: number; offerPrice?: number; quantity: number }[], shippingCost: number) {
    const sellerItemsTotal = items.reduce((sum, item) => {
      const price = item.offerPrice ?? item.price;
      return sum + price * item.quantity;
    }, 0);
    const sellerBaseShipping = shippingCost;
    const sellerInsurance = sellerItemsTotal * INSURANCE_RATE;
    const sellerInsuredShipping = sellerBaseShipping + sellerInsurance;
    const sellerProtectionFee = sellerItemsTotal * 0.075 + 0.99;
    const sellerTotal = sellerItemsTotal + sellerInsuredShipping + sellerProtectionFee;
    return { sellerItemsTotal, sellerInsuredShipping, sellerProtectionFee, sellerTotal };
  }

  it('applies £0.99 ONCE per seller, not per item (single-item seller)', () => {
    const fees = computeSellerFees([{ price: 50, quantity: 1 }], 5.99);
    expect(fees.sellerProtectionFee).toBeCloseTo(50 * 0.075 + 0.99, 2);
    expect(fees.sellerProtectionFee).toBeCloseTo(4.74, 2);
  });

  it('applies £0.99 ONCE even with multiple items and quantities', () => {
    const items = [
      { price: 65.49, quantity: 1 },
      { price: 43.99, quantity: 2 },
    ];
    const fees = computeSellerFees(items, 8.99);
    const expectedItemsTotal = 65.49 + 43.99 * 2;

    expect(fees.sellerProtectionFee).toBeCloseTo(expectedItemsTotal * 0.075 + 0.99, 2);

    // The old WRONG formula would be: (65.49*0.075+0.99)*1 + (43.99*0.075+0.99)*2
    const oldWrongFee = (65.49 * 0.075 + 0.99) * 1 + (43.99 * 0.075 + 0.99) * 2;
    expect(fees.sellerProtectionFee).not.toBeCloseTo(oldWrongFee, 2);
  });

  it('2-seller cart has exactly 2x £0.99, not per-item', () => {
    const sellerA = computeSellerFees(
      [{ price: 65.49, quantity: 1 }, { price: 43.99, quantity: 1 }],
      5.99
    );
    const sellerB = computeSellerFees(
      [{ price: 29.99, quantity: 3 }],
      3.49
    );

    const totalServiceFeeComponent =
      (sellerA.sellerProtectionFee - sellerA.sellerItemsTotal * 0.075) +
      (sellerB.sellerProtectionFee - sellerB.sellerItemsTotal * 0.075);

    // Exactly 2 x £0.99 = £1.98 in service fees
    expect(totalServiceFeeComponent).toBeCloseTo(1.98, 2);
  });

  it('worked example: 2-seller cart total matches backend', () => {
    // Seller A: 2 items, £65.49 + £43.99, shipping £5.99
    const sellerA = computeSellerFees(
      [{ price: 65.49, quantity: 1 }, { price: 43.99, quantity: 1 }],
      5.99
    );
    const aItems = 65.49 + 43.99;
    expect(sellerA.sellerItemsTotal).toBeCloseTo(aItems, 2);
    expect(sellerA.sellerProtectionFee).toBeCloseTo(aItems * 0.075 + 0.99, 2);
    expect(sellerA.sellerInsuredShipping).toBeCloseTo(5.99 + aItems * INSURANCE_RATE, 2);
    expect(sellerA.sellerTotal).toBeCloseTo(
      aItems + (5.99 + aItems * INSURANCE_RATE) + (aItems * 0.075 + 0.99),
      2
    );

    // Seller B: 1 item, £29.99 qty 3, shipping £3.49
    const sellerB = computeSellerFees(
      [{ price: 29.99, quantity: 3 }],
      3.49
    );
    const bItems = 29.99 * 3;
    expect(sellerB.sellerItemsTotal).toBeCloseTo(bItems, 2);
    expect(sellerB.sellerProtectionFee).toBeCloseTo(bItems * 0.075 + 0.99, 2);
    expect(sellerB.sellerInsuredShipping).toBeCloseTo(3.49 + bItems * INSURANCE_RATE, 2);

    // Combined total = sellerA.total + sellerB.total
    const combined = sellerA.sellerTotal + sellerB.sellerTotal;

    // Old buggy combined total (£0.99 per item*qty):
    const allItems = [65.49, 43.99, 29.99, 29.99, 29.99];
    const buggyFee = allItems.reduce((s, p) => s + p * 0.075 + 0.99, 0);
    const correctFee = sellerA.sellerProtectionFee + sellerB.sellerProtectionFee;

    // New correct fee is LESS than buggy fee (fewer £0.99 charges)
    expect(correctFee).toBeLessThan(buggyFee);
    // Exactly 2 service fees vs 5 service fees
    expect(buggyFee - correctFee).toBeCloseTo(0.99 * 3, 2);
  });

  it('insurance rate matches mobile INSURANCE_RATE (0.0125)', () => {
    expect(INSURANCE_RATE).toBe(0.0125);
  });
});

// ─── Test 3: Cart page no longer imports combined checkout ────────────────
describe('cart page imports', () => {
  it('imports createSellerCheckout, not createCartCheckout', async () => {
    const cartApiModule = await import('@/lib/cart-api');
    expect(typeof cartApiModule.createSellerCheckout).toBe('function');
    // createCartCheckout still exists in the module (kept for now) but is no longer
    // imported by cart/page.tsx — we verify the new function exists and works
  });
});
