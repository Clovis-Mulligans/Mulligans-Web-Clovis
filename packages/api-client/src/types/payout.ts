/** Balance as returned by GET /api/stripe/connect/balance */
export interface Balance {
  available: number;
  pending: number;
  currency: string;
  total_earned: number;
  pending_escrow: number;
  completed_sales_count: number;
}

/** Stripe account status as returned by GET /api/stripe/connect/account-status */
export interface StripeAccountStatus {
  has_account: boolean;
  account_id?: string;
  status: string | null;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  requirements?: {
    currently_due: string[];
    eventually_due: string[];
    past_due: string[];
    disabled_reason: string | null;
  };
}

/** Stripe dashboard link response */
export interface StripeDashboardLink {
  url: string;
}

/** Stripe onboarding link response */
export interface StripeOnboardingLink {
  url: string;
}

/** Stripe create account response */
export interface StripeCreateAccountResponse {
  account_id: string;
  already_exists: boolean;
}
