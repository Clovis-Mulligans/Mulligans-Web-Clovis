import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, act, fireEvent, cleanup } from '@testing-library/react';
import { readSpec } from '@/components/ListingForm';

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

    const updateButtons = screen.getAllByText('Update Listing');
    const updateButton = updateButtons.find((el) => el.tagName === 'BUTTON')!;
    await act(async () => {
      fireEvent.click(updateButton);
      await Promise.resolve();
      await Promise.resolve();
      vi.advanceTimersByTime(0);
      await Promise.resolve();
    });

    expect(mockUpdateListing).toHaveBeenCalled();
  });

  it('validate() passes on a CSV-shaped listing (snake_case specs)', async () => {
    const listing = makeCsvClubListing();
    mockUpdateListing.mockResolvedValue({ id: listing.id });
    await renderForm({ initialData: listing, isEditing: true });

    const updateButtons = screen.getAllByText('Update Listing');
    const updateButton = updateButtons.find((el) => el.tagName === 'BUTTON')!;
    await act(async () => {
      fireEvent.click(updateButton);
      await Promise.resolve();
      await Promise.resolve();
      vi.advanceTimersByTime(0);
      await Promise.resolve();
    });

    expect(mockUpdateListing).toHaveBeenCalled();
  });

  it('validate() fails on genuinely incomplete listing and shows error banner', async () => {
    const listing = makeIncompleteListing();
    await renderForm({ initialData: listing, isEditing: true });

    const updateButtons = screen.getAllByText('Update Listing');
    const updateButton = updateButtons.find((el) => el.tagName === 'BUTTON')!;
    await act(async () => {
      fireEvent.click(updateButton);
      await Promise.resolve();
      vi.advanceTimersByTime(0);
      await Promise.resolve();
    });

    expect(mockUpdateListing).not.toHaveBeenCalled();
    const errorBanner = screen.getByText(/Please fix the highlighted errors/i);
    expect(errorBanner).toBeTruthy();
  });

  it('payload contains camelCase keys, never snake_case', async () => {
    const listing = makeCsvClubListing();
    mockUpdateListing.mockResolvedValue({ id: listing.id });
    await renderForm({ initialData: listing, isEditing: true });

    const updateButtons = screen.getAllByText('Update Listing');
    const updateButton = updateButtons.find((el) => el.tagName === 'BUTTON')!;
    await act(async () => {
      fireEvent.click(updateButton);
      await Promise.resolve();
      await Promise.resolve();
      vi.advanceTimersByTime(0);
      await Promise.resolve();
    });

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

    const updateButtons = screen.getAllByText('Update Listing');
    const updateButton = updateButtons.find((el) => el.tagName === 'BUTTON')!;
    await act(async () => {
      fireEvent.click(updateButton);
      await Promise.resolve();
      await Promise.resolve();
      vi.advanceTimersByTime(0);
      await Promise.resolve();
    });

    expect(mockUpdateListing).toHaveBeenCalled();
  });

  it('balls listing writes quantity as top-level number', async () => {
    const listing = makeMobileBallsListing();
    mockUpdateListing.mockResolvedValue({ id: listing.id });
    await renderForm({ initialData: listing, isEditing: true });

    const updateButtons = screen.getAllByText('Update Listing');
    const updateButton = updateButtons.find((el) => el.tagName === 'BUTTON')!;
    await act(async () => {
      fireEvent.click(updateButton);
      await Promise.resolve();
      await Promise.resolve();
      vi.advanceTimersByTime(0);
      await Promise.resolve();
    });

    expect(mockUpdateListing).toHaveBeenCalled();
    const [, payload] = mockUpdateListing.mock.calls[0];
    expect(payload.quantity).toBe(12);
    expect(typeof payload.quantity).toBe('number');
  });

  it('clubs listing writes subcategory as top-level field', async () => {
    const listing = makeMobileClubListing();
    mockUpdateListing.mockResolvedValue({ id: listing.id });
    await renderForm({ initialData: listing, isEditing: true });

    const updateButtons = screen.getAllByText('Update Listing');
    const updateButton = updateButtons.find((el) => el.tagName === 'BUTTON')!;
    await act(async () => {
      fireEvent.click(updateButton);
      await Promise.resolve();
      await Promise.resolve();
      vi.advanceTimersByTime(0);
      await Promise.resolve();
    });

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
});
