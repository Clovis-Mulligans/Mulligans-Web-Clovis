// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement('a', { href }, children),
}));

describe('ForgotPasswordPage', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;
  let sessionSetItem: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    mockPush.mockReset();
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    sessionSetItem = vi.fn();
    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn(),
      setItem: sessionSetItem,
      removeItem: vi.fn(),
    });
  });

  afterEach(cleanup);

  async function renderPage() {
    const mod = await import('../app/forgot-password/page');
    const Page = mod.default;
    return render(React.createElement(Page));
  }

  async function submitEmailAndGetCodeView() {
    fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    await renderPage();
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'user@test.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send Reset Code' }));
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter reset code')).toBeDefined();
    });
  }

  it('shows code entry field after successful email submit', async () => {
    await submitEmailAndGetCodeView();
    expect(screen.getByPlaceholderText('Enter reset code')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDefined();
  });

  it('stores code in sessionStorage and navigates without URL params', async () => {
    await submitEmailAndGetCodeView();
    fireEvent.change(screen.getByPlaceholderText('Enter reset code'), { target: { value: '654321' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(sessionSetItem).toHaveBeenCalledWith('mulligans_reset_email', 'user@test.com');
    expect(sessionSetItem).toHaveBeenCalledWith('mulligans_reset_code', '654321');
    expect(mockPush).toHaveBeenCalledWith('/reset-password');
  });

  it('does not navigate when code is empty or whitespace', async () => {
    await submitEmailAndGetCodeView();

    fireEvent.change(screen.getByPlaceholderText('Enter reset code'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(mockPush).not.toHaveBeenCalled();

    fireEvent.change(screen.getByPlaceholderText('Enter reset code'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(mockPush).not.toHaveBeenCalled();
  });
});
