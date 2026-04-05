import { apiClient } from '../client';
import type {
  Balance,
  StripeAccountStatus,
  StripeDashboardLink,
  StripeOnboardingLink,
  StripeCreateAccountResponse,
} from '../types/payout';
import type { SoldOrder } from '../types/order';

/** GET /api/stripe/connect/balance */
export function getBalance() {
  return apiClient.get<Balance>('/api/stripe/connect/balance');
}

/** GET /api/stripe/connect/account-status */
export function getStripeAccountStatus() {
  return apiClient.get<StripeAccountStatus>('/api/stripe/connect/account-status');
}

/** GET /api/stripe/connect/dashboard-link */
export function getStripeDashboardLink() {
  return apiClient.get<StripeDashboardLink>('/api/stripe/connect/dashboard-link');
}

/** POST /api/stripe/connect/create-account */
export function createStripeAccount() {
  return apiClient.post<StripeCreateAccountResponse>('/api/stripe/connect/create-account');
}

/** POST /api/stripe/connect/onboarding-link */
export function createOnboardingLink(data: { return_url: string; refresh_url: string }) {
  return apiClient.post<StripeOnboardingLink>('/api/stripe/connect/onboarding-link', data);
}

/** GET /api/orders/my-sales — payout transactions (all statuses) */
export function getPayoutTransactions() {
  return apiClient.get<{ orders: SoldOrder[] }>('/api/orders/my-sales');
}
