import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, act, fireEvent, cleanup } from '@testing-library/react';
import { readSpec, optionsWithCurrent, normalizeDexterity } from '@/components/ListingForm';

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

function makeMobileClubListing() {
  return {
    id: 'lst_mobile_001',
    title: 'Titleist TSR2 Driver — Stiff — Very Good',
    description: 'Excellent condition driver with headcover.',
    category: 'Clubs',
    subcategory: 'Drivers',
    condition_overall: 4,
    price: '299.99',
    is_negotiable: true,
    parcel_size: 'large',
    status: 'active',
    quantity: 1,
    specifications: {
      brand: 'Titleist',
      model: 'TSR2',
      dexterity: 'Right Handed',
      shaftFlex: 'Stiff',
      shaftMaterial: 'Graphite',
      length: 'Standard',
      gripSize: 'Standard',
    },
    images: [],
  } as any;
}

function makeCsvClubListing() {
  return {
    id: 'lst_csv_001',
    title: 'TaylorMade Stealth 2 Driver — Regular — New',
    description: 'Brand new in packaging.',
    category: 'Clubs',
    subcategory: '',
    condition_overall: 5,
    price: '349.99',
    is_negotiable: false,
    parcel_size: 'large',
    status: 'draft',
    quantity: 1,
    specifications: {
      club_type: 'Driver',
      brand: 'TaylorMade',
      model: 'Stealth 2',
      dexterity: 'Right-Handed',
      shaft_flex: 'Regular',
      shaft_material: 'Graphite',
    },
    images: [],
  } as any;
}

function makeMobileShoesListing() {
  return {
    id: 'lst_mobile_shoes_001',
    title: 'FootJoy Pro SL — Size 9 — Like New',
    description: 'Worn once on the range.',
    category: 'Shoes',
    subcategory: '',
    condition_overall: 4,
    price: '89.99',
    is_negotiable: false,
    parcel_size: 'medium',
    status: 'active',
    quantity: 1,
    specifications: {
      brand: 'FootJoy',
      shoeSize: '9',
      gender: 'Male',
      spikes: 'No',
      color: 'White',
    },
    images: [],
  } as any;
}

function makeMobileBallsListing() {
  return {
    id: 'lst_mobile_balls_001',
    title: 'Titleist Pro V1 — Dozen',
    description: 'Brand new box of 12.',
    category: 'Balls',
    subcategory: '',
    condition_overall: 5,
    price: '45.99',
    is_negotiable: false,
    parcel_size: 'small',
    status: 'active',
    quantity: 12,
    specifications: {
      brand: 'Titleist',
      model: 'Pro V1',
    },
    images: [],
  } as any;
}

function makeIncompleteListing() {
  return {
    id: 'lst_incomplete_001',
    title: '',
    description: '',
    category: 'Clubs',
    subcategory: '',
    condition_overall: null,
    price: '0',
    is_negotiable: false,
    parcel_size: '',
    status: 'draft',
    quantity: 1,
    specifications: {},
    images: [],
  } as any;
}

function makeClothingListing() {
  return {
    id: 'lst_clothing_001',
    title: 'Nike Polo — M — Like New',
    description: 'Great polo.',
    category: 'Clothing',
    subcategory: '',
    condition_overall: 4,
    price: '29.99',
    is_negotiable: false,
    parcel_size: 'small',
    status: 'active',
    quantity: 1,
    specifications: {
      brand: 'Nike',
      subcategory: 'Polo Shirts',
      size: 'M',
      gender: 'Male',
      color: 'Navy',
    },
    images: [],
  } as any;
}

function makeCsvShoesListing() {
  return {
    id: 'lst_csv_shoes_001',
    title: 'Adidas Spiked Shoes — Size 9',
    description: 'Good condition.',
    category: 'Shoes',
    subcategory: '',
    condition_overall: 3,
    price: '49.99',
    is_negotiable: false,
    parcel_size: 'medium',
    status: 'draft',
    quantity: 1,
    specifications: {
      brand: 'Adidas',
      size: '9',
      gender: 'Male',
      shoe_type: 'Spiked',
      colour: 'White',
    },
    images: [],
  } as any;
}

function makeGripsListing() {
  return {
    id: 'lst_grips_001',
    title: 'Golf Pride Grip — Midsize',
    description: 'Brand new.',
    category: 'Shafts, Grips & Heads',
    subcategory: '',
    condition_overall: 5,
    price: '12.99',
    is_negotiable: false,
    parcel_size: 'small',
    status: 'active',
    quantity: 1,
    specifications: {
      brand: 'Golf Pride',
      model: 'MCC',
      subcategory: 'Grip',
      grip_size: 'Midsize',
      grip_material: 'Rubber',
    },
    images: [],
  } as any;
}

// ---- Helper to click Update and flush ----

async function clickUpdate() {
  const updateButtons = screen.getAllByText('Update Listing');
  const updateButton = updateButtons.find((el) => el.tagName === 'BUTTON')!;
  await act(async () => {
    fireEvent.click(updateButton);
    await Promise.resolve();
    await Promise.resolve();
    vi.advanceTimersByTime(0);
    await Promise.resolve();
  });
}

// ---- Tests ----

describe('readSpec helper', () => {
  it('returns camelCase value when present', () => {
    const specs = { shaftFlex: 'Stiff', shaft_flex: 'Regular' };
    expect(readSpec(specs, 'shaftFlex', 'shaft_flex')).toBe('Stiff');
  });

  it('falls back to snake_case when camelCase is absent', () => {
    const specs = { shaft_flex: 'Regular' };
    expect(readSpec(specs, 'shaftFlex', 'shaft_flex')).toBe('Regular');
  });

  it('falls back to snake_case when camelCase is empty string', () => {
    const specs = { shaftFlex: '', shaft_flex: 'Stiff' };
    expect(readSpec(specs, 'shaftFlex', 'shaft_flex')).toBe('Stiff');
  });

  it('returns undefined when neither key exists', () => {
    const specs = { brand: 'Titleist' };
    expect(readSpec(specs, 'shaftFlex', 'shaft_flex')).toBeUndefined();
  });

  it('returns camelCase when both present and camelCase wins', () => {
    const specs = { shaftFlex: 'Extra Stiff', shaft_flex: 'Stiff' };
    expect(readSpec(specs, 'shaftFlex', 'shaft_flex')).toBe('Extra Stiff');
  });

  it('works without a snake_case key', () => {
    const specs = { brand: 'Callaway' };
    expect(readSpec(specs, 'brand')).toBe('Callaway');
  });
});

describe('optionsWithCurrent', () => {
  it('returns options unchanged when value is in the list', () => {
    const opts = ['A', 'B', 'C'];
    expect(optionsWithCurrent(opts, 'B')).toEqual(['A', 'B', 'C']);
  });

  it('prepends value when absent from the list', () => {
    const opts = ['A', 'B', 'C'];
    expect(optionsWithCurrent(opts, 'X')).toEqual(['X', 'A', 'B', 'C']);
  });

  it('returns options unchanged when value is empty', () => {
    const opts = ['A', 'B'];
    expect(optionsWithCurrent(opts, '')).toEqual(['A', 'B']);
    expect(optionsWithCurrent(opts, undefined)).toEqual(['A', 'B']);
  });
});

describe('normalizeDexterity', () => {
  it('normalizes "Right Hand" to "Right Handed"', () => {
    expect(normalizeDexterity('Right Hand')).toBe('Right Handed');
  });

  it('normalizes "Left Hand" to "Left Handed"', () => {
    expect(normalizeDexterity('Left Hand')).toBe('Left Handed');
  });

  it('passes through already-canonical values', () => {
    expect(normalizeDexterity('Right Handed')).toBe('Right Handed');
    expect(normalizeDexterity('Left Handed')).toBe('Left Handed');
  });
});

describe('ListingForm', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockCreateListing.mockReset();
    mockUpdateListing.mockReset();
    mockUploadListingImage.mockReset();
    mockDeleteListingImage.mockReset();
    mockPush.mockReset();

    mockUpdateListing.mockResolvedValue({ id: 'lst_test_001' });
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

  it('renders populated fields from initialData', async () => {
    const listing = makeMobileClubListing();
    await renderForm({ initialData: listing, isEditing: true });

    const titleInput = screen.getByPlaceholderText(/Titleist TSR2/i) as HTMLInputElement;
    expect(titleInput.value).toBe('Titleist TSR2 Driver — Stiff — Very Good');

    const descInput = screen.getByPlaceholderText(/condition, history/i) as HTMLTextAreaElement;
    expect(descInput.value).toBe('Excellent condition driver with headcover.');

    const priceInputs = screen.getAllByPlaceholderText('0.00') as HTMLInputElement[];
    const priceInput = priceInputs[0];
    expect(priceInput.value).toBe('299.99');

    const categorySelect = screen.getByDisplayValue('Clubs') as HTMLSelectElement;
    expect(categorySelect.value).toBe('Clubs');
  });

  it('does NOT auto-save on mount (P0 regression: isDirty must not fire on mount)', async () => {
    const listing = makeMobileClubListing();
    await renderForm({ initialData: listing, isEditing: true });

    await act(async () => {
      vi.advanceTimersByTime(120_000);
    });

    expect(mockUpdateListing).not.toHaveBeenCalled();
    expect(mockCreateListing).not.toHaveBeenCalled();
  });

  it('auto-saves after a genuine user edit + 60s', async () => {
    const listing = makeMobileClubListing();
    await renderForm({ initialData: listing, isEditing: true });

    const titleInput = screen.getByPlaceholderText(/Titleist TSR2/i) as HTMLInputElement;
    await act(async () => {
      fireEvent.change(titleInput, { target: { value: 'Changed Title' } });
    });

    await act(async () => {
      vi.advanceTimersByTime(60_000);
    });

    expect(mockUpdateListing).toHaveBeenCalledTimes(1);
    const [id, payload] = mockUpdateListing.mock.calls[0];
    expect(id).toBe('lst_mobile_001');
    expect(payload.title).toBe('Changed Title');
    expect(payload.status).toBe('draft');
  });

  it('validate() passes on a mobile-shaped listing (camelCase specs)', async () => {
    const listing = makeMobileClubListing();
    mockUpdateListing.mockResolvedValue({ id: listing.id });
    await renderForm({ initialData: listing, isEditing: true });
    await clickUpdate();
    expect(mockUpdateListing).toHaveBeenCalled();
  });

  it('validate() passes on a CSV-shaped listing (snake_case specs)', async () => {
    const listing = makeCsvClubListing();
    mockUpdateListing.mockResolvedValue({ id: listing.id });
    await renderForm({ initialData: listing, isEditing: true });
    await clickUpdate();
    expect(mockUpdateListing).toHaveBeenCalled();
  });

  it('validate() fails on genuinely incomplete listing and shows error banner', async () => {
    const listing = makeIncompleteListing();
    await renderForm({ initialData: listing, isEditing: true });
    await clickUpdate();

    expect(mockUpdateListing).not.toHaveBeenCalled();
    const errorBanner = screen.getByText(/Please fix the highlighted errors/i);
    expect(errorBanner).toBeTruthy();
  });

  it('payload contains camelCase keys, never snake_case', async () => {
    const listing = makeCsvClubListing();
    mockUpdateListing.mockResolvedValue({ id: listing.id });
    await renderForm({ initialData: listing, isEditing: true });
    await clickUpdate();

    expect(mockUpdateListing).toHaveBeenCalled();
    const [, payload] = mockUpdateListing.mock.calls[0];
    const specKeys = Object.keys(payload.specifications);
    const snakeKeys = specKeys.filter((k: string) => k.includes('_') && k !== 'auto_decline_below');
    expect(snakeKeys).toEqual([]);
    expect(payload.specifications.shaftFlex).toBeDefined();
    expect(payload.specifications.shaftMaterial).toBeDefined();
  });

  it('mobile shoes listing passes validation with camelCase keys', async () => {
    const listing = makeMobileShoesListing();
    mockUpdateListing.mockResolvedValue({ id: listing.id });
    await renderForm({ initialData: listing, isEditing: true });
    await clickUpdate();
    expect(mockUpdateListing).toHaveBeenCalled();
  });

  it('clubs listing writes subcategory as top-level field', async () => {
    const listing = makeMobileClubListing();
    mockUpdateListing.mockResolvedValue({ id: listing.id });
    await renderForm({ initialData: listing, isEditing: true });
    await clickUpdate();

    expect(mockUpdateListing).toHaveBeenCalled();
    const [, payload] = mockUpdateListing.mock.calls[0];
    expect(payload.subcategory).toBe('Drivers');
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

  // ---- NEW TESTS (Brief A2 §5) ----

  // Test 1: Clothing listing retains size, does NOT produce shoeSize (§4.1 regression)
  it('clothing listing retains size in payload and does NOT produce shoeSize', async () => {
    const listing = makeClothingListing();
    mockUpdateListing.mockResolvedValue({ id: listing.id });
    await renderForm({ initialData: listing, isEditing: true });
    await clickUpdate();

    expect(mockUpdateListing).toHaveBeenCalled();
    const [, payload] = mockUpdateListing.mock.calls[0];
    expect(payload.specifications.size).toBe('M');
    expect(payload.specifications.shoeSize).toBeUndefined();
  });

  // Test 2: Shoes listing with size: "9" canonicalises to shoeSize
  it('shoes listing with size canonicalises to shoeSize', async () => {
    const listing = makeCsvShoesListing();
    mockUpdateListing.mockResolvedValue({ id: listing.id });
    await renderForm({ initialData: listing, isEditing: true });
    await clickUpdate();

    expect(mockUpdateListing).toHaveBeenCalled();
    const [, payload] = mockUpdateListing.mock.calls[0];
    expect(payload.specifications.shoeSize).toBe('9');
    expect(payload.specifications.size).toBeUndefined();
  });

  // Test 3: shoe_type: "Spiked" → spikes: "Yes"; "Waterproof" stays as shoe_type
  it('shoe_type "Spiked" maps to spikes "Yes"; "Waterproof" leaves shoe_type intact', async () => {
    const spikedListing = makeCsvShoesListing();
    mockUpdateListing.mockResolvedValue({ id: spikedListing.id });
    await renderForm({ initialData: spikedListing, isEditing: true });
    await clickUpdate();

    expect(mockUpdateListing).toHaveBeenCalled();
    const [, payload1] = mockUpdateListing.mock.calls[0];
    expect(payload1.specifications.spikes).toBe('Yes');
    expect(payload1.specifications.shoe_type).toBeUndefined();

    cleanup();
    mockUpdateListing.mockReset();
    mockUpdateListing.mockResolvedValue({ id: 'lst_wp_001' });

    const wpListing = {
      ...makeCsvShoesListing(),
      id: 'lst_wp_001',
      specifications: {
        ...makeCsvShoesListing().specifications,
        shoe_type: 'Waterproof',
      },
    };
    await renderForm({ initialData: wpListing, isEditing: true });
    await clickUpdate();

    expect(mockUpdateListing).toHaveBeenCalled();
    const [, payload2] = mockUpdateListing.mock.calls[0];
    expect(payload2.specifications.shoe_type).toBe('Waterproof');
    expect(payload2.specifications.spikes).toBeUndefined();
  });

  // Test 4: Balls payload contains no top-level quantity, and specifications.packSize is set
  it('balls payload contains no top-level quantity and specifications.packSize is set', async () => {
    const listing = makeMobileBallsListing();
    mockUpdateListing.mockResolvedValue({ id: listing.id });
    await renderForm({ initialData: listing, isEditing: true });
    await clickUpdate();

    expect(mockUpdateListing).toHaveBeenCalled();
    const [, payload] = mockUpdateListing.mock.calls[0];
    expect(payload.quantity).toBeUndefined();
    expect(payload.specifications.packSize).toBe(12);
  });

  // Test 5: Club listing produces length but NOT shaftLength
  it('club listing produces length but NOT shaftLength', async () => {
    const listing = makeMobileClubListing();
    mockUpdateListing.mockResolvedValue({ id: listing.id });
    await renderForm({ initialData: listing, isEditing: true });
    await clickUpdate();

    expect(mockUpdateListing).toHaveBeenCalled();
    const [, payload] = mockUpdateListing.mock.calls[0];
    expect(payload.specifications.length).toBe('Standard');
    expect(payload.specifications.shaftLength).toBeUndefined();
  });

  // Test 6: Grips listing with grip_size canonicalises to gripSize
  it('grips listing with grip_size canonicalises to gripSize', async () => {
    const listing = makeGripsListing();
    mockUpdateListing.mockResolvedValue({ id: listing.id });
    await renderForm({ initialData: listing, isEditing: true });
    await clickUpdate();

    expect(mockUpdateListing).toHaveBeenCalled();
    const [, payload] = mockUpdateListing.mock.calls[0];
    expect(payload.specifications.gripSize).toBe('Midsize');
    expect(payload.specifications.grip_size).toBeUndefined();
  });

  // Test 8: Listing with dexterity "Right Hand" displays "Right Handed"
  it('listing with dexterity "Right Hand" displays "Right Handed" as selected', async () => {
    const listing = makeMobileClubListing();
    listing.specifications.dexterity = 'Right Hand';
    await renderForm({ initialData: listing, isEditing: true });

    const dexSelect = screen.getByDisplayValue('Right Handed') as HTMLSelectElement;
    expect(dexSelect.value).toBe('Right Handed');
  });

  // Test 9: Listing with gender "Unisex" renders it as a selectable option and preserves on save
  it('listing with gender "Unisex" renders as selectable and preserves on save', async () => {
    const listing = makeClothingListing();
    listing.specifications.gender = 'Unisex';
    mockUpdateListing.mockResolvedValue({ id: listing.id });
    await renderForm({ initialData: listing, isEditing: true });

    const genderSelect = screen.getByDisplayValue('Unisex (existing)') as HTMLSelectElement;
    expect(genderSelect.value).toBe('Unisex');

    await clickUpdate();
    expect(mockUpdateListing).toHaveBeenCalled();
    const [, payload] = mockUpdateListing.mock.calls[0];
    expect(payload.specifications.gender).toBe('Unisex');
  });

  // Test 10: Validation failing on spec-only field finds a [data-field] scroll target
  it('validation failing on spec-only field finds a data-field scroll target', async () => {
    const listing = {
      ...makeMobileClubListing(),
      specifications: {
        brand: 'Titleist',
        model: 'TSR2',
        dexterity: 'Right Handed',
        shaftFlex: '',
        shaftMaterial: 'Graphite',
        length: 'Standard',
        gripSize: 'Standard',
      },
    };
    await renderForm({ initialData: listing, isEditing: true });

    const mockScrollIntoView = vi.fn();
    const specField = document.querySelector('[data-field="specs.shaftFlex"]');
    expect(specField).not.toBeNull();
    if (specField) {
      (specField as any).scrollIntoView = mockScrollIntoView;
      const input = specField.querySelector('select');
      if (input) (input as any).focus = vi.fn();
    }

    await clickUpdate();
    expect(mockUpdateListing).not.toHaveBeenCalled();
    expect(mockScrollIntoView).toHaveBeenCalled();
  });
});
