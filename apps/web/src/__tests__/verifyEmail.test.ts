// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

  async function renderPage() {
    const mod = await import('../app/verify-email/page');
    const Page = mod.default;
    return render(React.createElement(Page));
  }

  it('renders code input field and verify button', async () => {
    await renderPage();
    const inputs = screen.getAllByPlaceholderText('Enter verification code');
    expect(inputs.length).toBeGreaterThanOrEqual(1);
    const buttons = screen.getAllByRole('button', { name: 'Verify Email' });
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('displays the user email from search params', async () => {
    await renderPage();
    const emailElements = screen.getAllByText('test@example.com');
    expect(emailElements.length).toBeGreaterThanOrEqual(1);
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

    const inputs = screen.getAllByPlaceholderText('Enter verification code');
    fireEvent.change(inputs[0], { target: { value: '123456' } });

    const buttons = screen.getAllByRole('button', { name: 'Verify Email' });
    fireEvent.click(buttons[0]);

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

  it('displays error message on invalid code', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid verification code. Please check and try again.' }),
    });

    await renderPage();

    const inputs = screen.getAllByPlaceholderText('Enter verification code');
    fireEvent.change(inputs[0], { target: { value: '000000' } });

    const buttons = screen.getAllByRole('button', { name: 'Verify Email' });
    fireEvent.click(buttons[0]);

    await waitFor(() => {
      expect(screen.getAllByText('Invalid verification code. Please check and try again.').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('calls resend-verification endpoint when resend button is clicked', async () => {
    fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    await renderPage();

    const resendButtons = screen.getAllByRole('button', { name: 'Resend Code' });
    fireEvent.click(resendButtons[0]);

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
