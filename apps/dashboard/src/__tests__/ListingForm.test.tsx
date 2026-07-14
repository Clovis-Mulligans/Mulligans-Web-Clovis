import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, act, fireEvent, cleanup } from '@testing-library/react';

// ---- Mocks ----

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('next/link', () => ({
  default: ({ children, ...props }: { children: React.ReactNode; href: string }) =>
    React.createElement('a', props, children),
}));

const mockCreateListing = vi.fn();
const mockUpdateListing = vi.fn();
const mockUploadListingImage = vi.fn();
const mockDeleteListingImage = vi.fn();

vi.mock('@mulligans/api-client', () => ({
  createListing: (...args: unknown[]) => mockCreateListing(...args),
  updateListing: (...args: unknown[]) => mockUpdateListing(...args),
  uploadListingImage: (...args: unknown[]) => mockUploadListingImage(...args),
  deleteListingImage: (...args: unknown[]) => mockDeleteListingImage(...args),
}));

// ---- Fixtures ----

/** Mobile-shaped Clubs listing: camelCase specs, top-level brand/model/subcategory.
 *  Matches the real dev listing cited in the brief (lst_1783523515513_a4xlyrqpk). */
function makeMobileClubsListing() {
  return {
    id: 'lst_mobile_clubs_001',
    title: 'TaylorMade Qi4D Driver — Stiff — Like New',
    description: 'Barely used, comes with headcover.',
    category: 'Clubs',
    brand: 'TaylorMade',
    model: 'Qi4D (2026)',
    subcategory: 'Drivers',
    condition_overall: 4,
    price: '449.00',
    is_negotiable: true,
    parcel_size: 'large',
    status: 'active',
    specifications: {
      loft: '8',
      model: 'Qi4D (2026)',
      gender: 'Male',
      length: 'Standard',
      gripSize: 'Undersize',
      lieAngle: 'Standard',
      dexterity: 'Right Handed',
      shaftFlex: 'Stiff',
      shaftModel: 'Fujikura Ventus Blue',
      headcoverIncluded: false,
    },
    images: [
      { id: 'img_001', image_url: 'https://images.mulligans.uk.com/test.jpg', s3_key: 'listings/test.jpg', display_order: 0 },
    ],
  } as any;
}

/** Mobile-shaped Shafts listing for non-Clubs category coverage. */
function makeMobileShaftListing() {
  return {
    id: 'lst_mobile_shaft_001',
    title: 'KBS Tour 120 Stiff Shaft',
    description: 'Pulled from a set of Mizuno JPX 923.',
    category: 'Shafts, Grips & Heads',
    brand: 'KBS',
    model: 'Tour 120',
    subcategory: 'Shaft',
    condition_overall: 3,
    price: '35.00',
    is_negotiable: false,
    parcel_size: 'medium',
    status: 'active',
    specifications: {
      model: 'Tour 120',
      shaftFlex: 'Stiff',
      shaftMaterial: 'Steel',
      shaftLength: '37',
      adapter: 'None',
    },
    images: [],
  } as any;
}

// ---- Tests ----

describe('ListingForm', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockCreateListing.mockReset();
    mockUpdateListing.mockReset();
    mockUploadListingImage.mockReset();
    mockDeleteListingImage.mockReset();
    mockPush.mockReset();

    mockUpdateListing.mockResolvedValue({ id: 'lst_mobile_clubs_001' });
    mockCreateListing.mockResolvedValue({ id: 'lst_new_001' });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  async function renderForm(props: Record<string, unknown> = {}) {
    const mod = await import('@/components/ListingForm');
    const ListingForm = mod.default;
    return render(React.createElement(ListingForm, props));
  }

  // ---------- §2b: Mobile-shaped data populates every field ----------

  it('renders populated fields from a mobile-shaped Clubs listing (camelCase specs + top-level brand/subcategory)', async () => {
    const listing = makeMobileClubsListing();
    await renderForm({ initialData: listing, isEditing: true });

    const titleInput = screen.getByPlaceholderText(/Titleist TSR2|TaylorMade/i) as HTMLInputElement;
    expect(titleInput.value).toBe('TaylorMade Qi4D Driver — Stiff — Like New');

    const brandInput = screen.getByPlaceholderText('e.g. Titleist') as HTMLInputElement;
    expect(brandInput.value).toBe('TaylorMade');

    const modelInput = screen.getByPlaceholderText('e.g. TSR2') as HTMLInputElement;
    expect(modelInput.value).toBe('Qi4D (2026)');

    const clubTypeSelect = screen.getByDisplayValue('Drivers') as HTMLSelectElement;
    expect(clubTypeSelect.value).toBe('Drivers');

    const dexteritySelect = screen.getByDisplayValue('Right Handed') as HTMLSelectElement;
    expect(dexteritySelect.value).toBe('Right Handed');

    const shaftFlexSelect = screen.getByDisplayValue('Stiff') as HTMLSelectElement;
    expect(shaftFlexSelect.value).toBe('Stiff');

    const loftInput = screen.getByPlaceholderText('e.g. 10.5') as HTMLInputElement;
    expect(loftInput.value).toBe('8');
  });

  // ---------- §2b: Round-trip data-loss guard ----------

  it('round-trip: changing only the title preserves all original specs, brand, and subcategory', async () => {
    const listing = makeMobileClubsListing();
    await renderForm({ initialData: listing, isEditing: true });

    const titleInput = screen.getByPlaceholderText(/Titleist TSR2|TaylorMade/i) as HTMLInputElement;
    await act(async () => {
      fireEvent.change(titleInput, { target: { value: 'Title Changed For Test' } });
    });

    const updateButtons = screen.getAllByText('Update Listing');
    const updateButton = updateButtons.find((el) => el.tagName === 'BUTTON')!;
    await act(async () => {
      fireEvent.click(updateButton);
      await Promise.resolve();
      await Promise.resolve();
      vi.advanceTimersByTime(0);
      await Promise.resolve();
    });

    expect(mockUpdateListing).toHaveBeenCalledTimes(1);
    const [id, payload] = mockUpdateListing.mock.calls[0];
    expect(id).toBe('lst_mobile_clubs_001');
    expect(payload.title).toBe('Title Changed For Test');

    // Top-level fields preserved
    expect(payload.brand).toBe('TaylorMade');
    expect(payload.model).toBe('Qi4D (2026)');
    expect(payload.subcategory).toBe('Drivers');

    // Specifications preserved (camelCase keys survive round-trip)
    const specs = payload.specifications;
    expect(specs.shaftFlex).toBe('Stiff');
    expect(specs.dexterity).toBe('Right Handed');
    expect(specs.loft).toBe('8');
    expect(specs.lieAngle).toBe('Standard');
    expect(specs.length).toBe('Standard');
    expect(specs.gripSize).toBe('Undersize');
    expect(specs.gender).toBe('Male');
    expect(specs.shaftModel).toBe('Fujikura Ventus Blue');
    expect(specs.model).toBe('Qi4D (2026)');

    // brand and subcategory must NOT be in specifications (they are top-level)
    expect(specs.brand).toBeUndefined();
    expect(specs.subcategory).toBeUndefined();
  });

  // ---------- §2b: Non-Clubs category (Shafts) ----------

  it('renders Shafts listing with camelCase specs and preserves them on save', async () => {
    const listing = makeMobileShaftListing();
    mockUpdateListing.mockResolvedValue({ id: listing.id });
    await renderForm({ initialData: listing, isEditing: true });

    const brandInput = screen.getByPlaceholderText('e.g. KBS') as HTMLInputElement;
    expect(brandInput.value).toBe('KBS');

    const modelInput = screen.getByPlaceholderText('e.g. Tour 90') as HTMLInputElement;
    expect(modelInput.value).toBe('Tour 120');

    const subSelect = screen.getByDisplayValue('Shaft') as HTMLSelectElement;
    expect(subSelect.value).toBe('Shaft');

    const flexSelect = screen.getByDisplayValue('Stiff') as HTMLSelectElement;
    expect(flexSelect.value).toBe('Stiff');

    const lengthInput = screen.getByPlaceholderText('e.g. 45') as HTMLInputElement;
    expect(lengthInput.value).toBe('37');

    // Save and verify round-trip
    const titleInput = screen.getByPlaceholderText(/Titleist TSR2/i) as HTMLInputElement;
    await act(async () => {
      fireEvent.change(titleInput, { target: { value: 'Changed Shaft Title' } });
    });

    const updateButtons = screen.getAllByText('Update Listing');
    const updateButton = updateButtons.find((el) => el.tagName === 'BUTTON')!;
    await act(async () => {
      fireEvent.click(updateButton);
      await Promise.resolve();
      await Promise.resolve();
      vi.advanceTimersByTime(0);
      await Promise.resolve();
    });

    expect(mockUpdateListing).toHaveBeenCalledTimes(1);
    const [, payload] = mockUpdateListing.mock.calls[0];
    expect(payload.brand).toBe('KBS');
    expect(payload.subcategory).toBe('Shaft');
    expect(payload.specifications.shaftFlex).toBe('Stiff');
    expect(payload.specifications.shaftMaterial).toBe('Steel');
    expect(payload.specifications.shaftLength).toBe('37');
  });

  // ---------- Existing tests (updated fixture) ----------

  it('does NOT auto-save on mount (P0 regression: isDirty must not fire on mount)', async () => {
    const listing = makeMobileClubsListing();
    await renderForm({ initialData: listing, isEditing: true });

    await act(async () => {
      vi.advanceTimersByTime(120_000);
    });

    expect(mockUpdateListing).not.toHaveBeenCalled();
    expect(mockCreateListing).not.toHaveBeenCalled();
  });

  it('auto-saves after a genuine user edit + 60s', async () => {
    const listing = makeMobileClubsListing();
    await renderForm({ initialData: listing, isEditing: true });

    const titleInput = screen.getByPlaceholderText(/Titleist TSR2|TaylorMade/i) as HTMLInputElement;
    await act(async () => {
      fireEvent.change(titleInput, { target: { value: 'Changed Title' } });
    });

    await act(async () => {
      vi.advanceTimersByTime(60_000);
    });

    expect(mockUpdateListing).toHaveBeenCalledTimes(1);
    const [id, payload] = mockUpdateListing.mock.calls[0];
    expect(id).toBe('lst_mobile_clubs_001');
    expect(payload.title).toBe('Changed Title');
    expect(payload.status).toBe('draft');
  });

  it('surfaces image-upload failures to the user', async () => {
    mockCreateListing.mockResolvedValue({ id: 'lst_img_test' });
    mockUploadListingImage.mockRejectedValue(new Error('Network error'));

    await renderForm({});

    const titleInput = screen.getByPlaceholderText(/Titleist TSR2/i) as HTMLInputElement;
    const descInput = screen.getByPlaceholderText(/condition, history/i) as HTMLTextAreaElement;
    const priceInputs = screen.getAllByPlaceholderText('0.00') as HTMLInputElement[];
    const priceInput = priceInputs[0];

    await act(async () => {
      fireEvent.change(titleInput, { target: { value: 'Test Listing' } });
      fireEvent.change(descInput, { target: { value: 'A description' } });
      fireEvent.change(priceInput, { target: { value: '50.00' } });
    });

    const categorySelect = screen.getByDisplayValue('Select a category') as HTMLSelectElement;
    await act(async () => {
      fireEvent.change(categorySelect, { target: { value: 'Everything Else' } });
    });

    const conditionSelect = screen.getByDisplayValue('Select condition') as HTMLSelectElement;
    await act(async () => {
      fireEvent.change(conditionSelect, { target: { value: 'Good' } });
    });

    const largeButton = screen.getByText('Large').closest('button')!;
    await act(async () => {
      fireEvent.click(largeButton);
    });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const testFile = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [testFile] } });
    });

    const publishButtons = screen.getAllByText('Publish Listing');
    const publishButton = publishButtons.find((el) => el.tagName === 'BUTTON')!;
    await act(async () => {
      fireEvent.click(publishButton);
      await Promise.resolve();
      await Promise.resolve();
      vi.advanceTimersByTime(0);
      await Promise.resolve();
    });

    expect(mockCreateListing).toHaveBeenCalled();
    const errorEl = screen.getByText(/failed to upload/i);
    expect(errorEl).toBeTruthy();
  });

  // ---------- §3: 413 shows size-specific message ----------

  it('413 from image upload produces a file-size-specific error message', async () => {
    mockCreateListing.mockResolvedValue({ id: 'lst_413_test' });
    const err413 = Object.assign(new Error('Payload Too Large'), { status: 413, statusText: 'Payload Too Large' });
    mockUploadListingImage.mockRejectedValue(err413);

    await renderForm({});

    const titleInput = screen.getByPlaceholderText(/Titleist TSR2/i) as HTMLInputElement;
    const descInput = screen.getByPlaceholderText(/condition, history/i) as HTMLTextAreaElement;
    const priceInputs = screen.getAllByPlaceholderText('0.00') as HTMLInputElement[];

    await act(async () => {
      fireEvent.change(titleInput, { target: { value: 'Big Photo Test' } });
      fireEvent.change(descInput, { target: { value: 'Testing 413' } });
      fireEvent.change(priceInputs[0], { target: { value: '10.00' } });
    });

    const categorySelect = screen.getByDisplayValue('Select a category') as HTMLSelectElement;
    await act(async () => {
      fireEvent.change(categorySelect, { target: { value: 'Everything Else' } });
    });

    const conditionSelect = screen.getByDisplayValue('Select condition') as HTMLSelectElement;
    await act(async () => {
      fireEvent.change(conditionSelect, { target: { value: 'Good' } });
    });

    const largeButton = screen.getByText('Large').closest('button')!;
    await act(async () => {
      fireEvent.click(largeButton);
    });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const bigFile = new File(['x'.repeat(1024)], 'huge-photo.jpg', { type: 'image/jpeg' });
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [bigFile] } });
    });

    const publishButtons = screen.getAllByText('Publish Listing');
    const publishButton = publishButtons.find((el) => el.tagName === 'BUTTON')!;
    await act(async () => {
      fireEvent.click(publishButton);
      await Promise.resolve();
      await Promise.resolve();
      vi.advanceTimersByTime(0);
      await Promise.resolve();
    });

    expect(mockCreateListing).toHaveBeenCalled();
    const sizeError = screen.getByText(/too large to upload/i);
    expect(sizeError).toBeTruthy();
    expect(sizeError.textContent).toContain('huge-photo.jpg');
  });
});
