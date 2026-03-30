'use client';

import React, { useState, useEffect } from 'react';
import {
  MulligansLogo,
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
} from '@mulligans/ui';
import {
  submitProStoreApplication,
  getApplicationStatus,
  type ProStoreApplication,
  type SubmitProStoreApplicationData,
  type SellerType,
  type EstimatedListings,
} from '@mulligans/api-client';
import { useAuth } from '@/lib/auth-provider';

const SELLER_TYPES: { value: SellerType; label: string }[] = [
  { value: 'pro_shop', label: 'Pro Shop' },
  { value: 'online_retailer', label: 'Online Retailer' },
  { value: 'brand', label: 'Brand' },
];

const LISTING_RANGES: { value: EstimatedListings; label: string }[] = [
  { value: '1-50', label: '1-50' },
  { value: '51-200', label: '51-200' },
  { value: '201-500', label: '201-500' },
  { value: '500+', label: '500+' },
];

export default function ApplyPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [existingApplication, setExistingApplication] =
    useState<ProStoreApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState<SubmitProStoreApplicationData>({
    business_name: '',
    business_email: '',
    business_phone: '',
    website: '',
    seller_type: 'pro_shop',
    description: '',
    estimated_listings: '1-50',
    instagram_handle: '',
    has_existing_store: false,
    existing_store_url: '',
  });

  useEffect(() => {
    async function checkExisting() {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }
      try {
        const app = await getApplicationStatus();
        setExistingApplication(app);
      } catch {
        // No existing application
      }
      setLoading(false);
    }
    if (!authLoading) {
      checkExisting();
    }
  }, [isAuthenticated, authLoading]);

  function updateForm(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const app = await submitProStoreApplication(form);
      setExistingApplication(app);
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to submit application'
      );
    } finally {
      setSubmitting(false);
    }
  }

  const statusColors: Record<string, 'default' | 'warning' | 'destructive' | 'secondary'> = {
    pending: 'warning',
    approved: 'default',
    rejected: 'destructive',
    info_requested: 'secondary',
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#06070A]">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  // Show application status if one exists
  if (existingApplication) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#06070A] px-4">
        <div className="w-full max-w-lg space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <MulligansLogo width={220} height={44} />
          </div>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Application Status</CardTitle>
              <CardDescription className="text-gray-400">
                Your pro store application for{' '}
                <strong className="text-white">
                  {existingApplication.business_name}
                </strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">Status:</span>
                <Badge variant={statusColors[existingApplication.status]}>
                  {existingApplication.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>

              {existingApplication.status === 'approved' && (
                <div className="rounded-md bg-[#1DC690]/10 border border-[#1DC690]/20 p-4">
                  <p className="text-sm text-[#1DC690]">
                    Your application has been approved! You can now access the
                    Pro Store Dashboard.
                  </p>
                  <Button
                    variant="primary"
                    className="mt-3"
                    onClick={() => (window.location.href = '/')}
                  >
                    Go to Dashboard
                  </Button>
                </div>
              )}

              {existingApplication.status === 'pending' && (
                <p className="text-sm text-gray-400">
                  Your application is being reviewed. We&apos;ll notify you by
                  email once a decision has been made.
                </p>
              )}

              {existingApplication.status === 'rejected' && (
                <p className="text-sm text-red-400">
                  Unfortunately your application was not approved at this time.
                  Please contact support for more information.
                </p>
              )}

              {existingApplication.status === 'info_requested' && (
                <p className="text-sm text-[#278AB0]">
                  We need some additional information. Please check your email
                  for details.
                </p>
              )}

              <p className="text-xs text-gray-500">
                Applied:{' '}
                {new Date(existingApplication.created_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#06070A] px-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <MulligansLogo width={220} height={44} />
          <h1 className="text-xl font-semibold text-white">
            Become a Pro Store
          </h1>
          <p className="text-gray-400">
            You need to sign in to your Mulligans account before applying.
          </p>
          <Button
            variant="primary"
            onClick={() => (window.location.href = '/login?redirect=/apply')}
          >
            Sign In to Apply
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#06070A] px-4 py-12">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <MulligansLogo width={220} height={44} />
          <h1 className="text-2xl font-bold text-white">
            Apply for a Pro Store
          </h1>
          <p className="text-gray-400 text-center max-w-md">
            Pro stores get desktop-grade tools to manage inventory, orders,
            offers, and analytics. Zero seller fees.
          </p>
        </div>

        {success && (
          <div className="rounded-md bg-[#1DC690]/10 border border-[#1DC690]/20 p-4 text-center">
            <p className="text-sm text-[#1DC690]">
              Application submitted successfully! We&apos;ll review it and get
              back to you shortly.
            </p>
          </div>
        )}

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Business Name *
                  </label>
                  <Input
                    value={form.business_name}
                    onChange={(e) =>
                      updateForm('business_name', e.target.value)
                    }
                    placeholder="Your Golf Pro Shop"
                    required
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Business Email *
                  </label>
                  <Input
                    type="email"
                    value={form.business_email}
                    onChange={(e) =>
                      updateForm('business_email', e.target.value)
                    }
                    placeholder="contact@yourshop.com"
                    required
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Business Phone *
                  </label>
                  <Input
                    type="tel"
                    value={form.business_phone}
                    onChange={(e) =>
                      updateForm('business_phone', e.target.value)
                    }
                    placeholder="+44 7700 900000"
                    required
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Website *
                  </label>
                  <Input
                    type="url"
                    value={form.website}
                    onChange={(e) => updateForm('website', e.target.value)}
                    placeholder="https://yourshop.com"
                    required
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Seller Type *
                  </label>
                  <select
                    value={form.seller_type}
                    onChange={(e) =>
                      updateForm('seller_type', e.target.value)
                    }
                    required
                    className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#1DC690] focus:border-transparent"
                  >
                    {SELLER_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Estimated Listings *
                  </label>
                  <select
                    value={form.estimated_listings}
                    onChange={(e) =>
                      updateForm('estimated_listings', e.target.value)
                    }
                    required
                    className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#1DC690] focus:border-transparent"
                  >
                    {LISTING_RANGES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  About Your Business *{' '}
                  <span className="text-gray-500">
                    ({form.description.length}/500)
                  </span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    updateForm('description', e.target.value.slice(0, 500))
                  }
                  placeholder="Tell us about your business, what you sell, and why you'd like to join Mulligans as a pro store..."
                  required
                  rows={4}
                  maxLength={500}
                  className="flex w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1DC690] focus:border-transparent resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Instagram Handle{' '}
                  <span className="text-gray-500">(optional)</span>
                </label>
                <Input
                  value={form.instagram_handle}
                  onChange={(e) =>
                    updateForm('instagram_handle', e.target.value)
                  }
                  placeholder="@yourgolfshop"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.has_existing_store}
                    onChange={(e) =>
                      updateForm('has_existing_store', e.target.checked)
                    }
                    className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-[#1DC690] focus:ring-[#1DC690]"
                  />
                  <span className="text-sm text-gray-300">
                    I have an existing online store
                  </span>
                </label>

                {form.has_existing_store && (
                  <div className="space-y-2 ml-7">
                    <label className="block text-sm font-medium text-gray-300">
                      Existing Store URL
                    </label>
                    <Input
                      type="url"
                      value={form.existing_store_url}
                      onChange={(e) =>
                        updateForm('existing_store_url', e.target.value)
                      }
                      placeholder="https://www.yourexistingstore.com"
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                    />
                  </div>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
