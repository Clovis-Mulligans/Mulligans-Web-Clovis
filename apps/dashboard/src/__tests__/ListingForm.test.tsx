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

function makeListingData() {
  return {
    id: 'lst_test_001',
    title: 'Titleist TSR2 Driver — Stiff — Very Good',
    description: 'Excellent condition driver with headcover.',
    category: 'Clubs',
    condition_overall: 4,
    price: '299.99',
    is_negotiable: true,
    parcel_size: 'large',
    status: 'active',
    specifications: {
      club_type: 'Driver',
      brand: 'Titleist',
      model: 'TSR2',
      dexterity: 'Right-Handed',
      shaft_flex: 'Stiff',
      shaft_material: 'Graphite',
    },
    images: [
      {
        id: 'img_001',
        image_url: 'https://images.mulligans.uk.com/test.jpg',
        s3_key: 'listings/test.jpg',
        display_order: 0,
      },
    ],
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
    const listing = makeListingData();
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

    const conditionSelect = screen.getByDisplayValue('Like New') as HTMLSelectElement;
    expect(conditionSelect.value).toBe('Like New');

    const activeButton = screen.getAllByRole('button').find(
      (btn) => btn.textContent === 'Active' && btn.style.backgroundColor === 'rgb(29, 198, 144)'
    );
    expect(activeButton).toBeTruthy();
  });

  it('does NOT auto-save on mount (P0 regression: isDirty must not fire on mount)', async () => {
    const listing = makeListingData();
    await renderForm({ initialData: listing, isEditing: true });

    await act(async () => {
      vi.advanceTimersByTime(120_000);
    });

    expect(mockUpdateListing).not.toHaveBeenCalled();
    expect(mockCreateListing).not.toHaveBeenCalled();
  });

  it('auto-saves after a genuine user edit + 60s', async () => {
    const listing = makeListingData();
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
    expect(id).toBe('lst_test_001');
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

    const itemNameInput = screen.getByPlaceholderText('Describe the item') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(itemNameInput, { target: { value: 'Test Item' } });
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
