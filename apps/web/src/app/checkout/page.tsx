'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function CheckoutPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/cart');
  }, [router]);

  return null;
}
