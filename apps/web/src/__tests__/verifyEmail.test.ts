// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('email=test@example.com'),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement('a', { href }, children),
}));

describe('VerifyEmailPage', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  afterEach(cleanup);

  async function renderPage() {
    const mod = await import('../app/verify-email/page');
    const Page = mod.default;
    return render(React.createElement(Page));
  }

  it('renders code input field and verify button', async () => {
    await renderPage();
    expect(screen.getByPlaceholderText('Enter verification code')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Verify Email' })).toBeDefined();
  });

  it('displays the user email from search params', async () => {
    await renderPage();
    expect(screen.getByText('test@example.com')).toBeDefined();
  });

  it('submits code to verify-email endpoint and stores token on success', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'Email verified successfully!',
        accessToken: 'jwt-token-123',
        user: { id: '1', email: 'test@example.com', display_name: 'Test' },
      }),
    });

    await renderPage();

    fireEvent.change(screen.getByPlaceholderText('Enter verification code'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verify Email' }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.mulligans.uk.com/api/auth/verify-email',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com', code: '123456' }),
        })
      );
    });

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith('mulligans_auth_token', 'jwt-token-123');
    });
  });

  it('shows error when verification succeeds but no token is returned', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Email verified successfully!' }),
    });

    await renderPage();

    fireEvent.change(screen.getByPlaceholderText('Enter verification code'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verify Email' }));

    await waitFor(() => {
      expect(screen.getByText('Verification succeeded but no session was returned. Please sign in manually.')).toBeDefined();
    });
  });

  it('displays error message on invalid code', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid verification code. Please check and try again.' }),
    });

    await renderPage();

    fireEvent.change(screen.getByPlaceholderText('Enter verification code'), { target: { value: '000000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verify Email' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid verification code. Please check and try again.')).toBeDefined();
    });
  });

  it('calls resend-verification endpoint when resend button is clicked', async () => {
    fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    await renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Resend Code' }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.mulligans.uk.com/api/auth/resend-verification',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com' }),
        })
      );
    });
  });
});
