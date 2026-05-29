import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Legal & Policies | Mulligans',
  description: 'Mulligans Golf Limited legal documents, including Terms of Service, Privacy Policy, Buyer Protection, Prohibited Items, and Acceptable Use policies.',
  robots: { index: true, follow: true },
};

const LEGAL_DOCUMENTS = [
  {
    title: 'Terms of Service',
    description: 'The contract that governs your use of Mulligans, including buyer and seller obligations, fees, and dispute resolution.',
    href: '/terms',
  },
  {
    title: 'Privacy Policy',
    description: 'How we collect, use, store, and protect your personal data in accordance with the UK GDPR.',
    href: '/privacy',
  },
  {
    title: 'Buyer Protection Policy',
    description: "What's covered when something goes wrong with an order, how to raise a claim, and how disputes are resolved.",
    href: '/buyer-protection',
  },
  {
    title: 'Prohibited Items Policy',
    description: 'Items that may not be listed or sold on Mulligans, and the conditions for items permitted with restrictions.',
    href: '/prohibited-items',
  },
  {
    title: 'Acceptable Use Policy',
    description: 'Rules for behaviour and conduct on the platform, including community standards and enforcement.',
    href: '/acceptable-use',
  },
];

export default function LegalHubPage() {
  return (
    <article className="mx-auto max-w-[800px] px-4 py-8 sm:px-6 sm:py-12 lg:py-16">
      <header className="mb-10 border-b border-gray-200 pb-8">
        <h1 className="text-3xl font-bold text-[#06070A] sm:text-4xl">
          Legal &amp; Policies
        </h1>
        <p className="mt-4 text-base text-gray-700">
          The documents below set out the rules and protections that apply when you use Mulligans.
          They are written to be clear and accessible. If anything is unclear, contact us at{' '}
          <a
            href="mailto:info@mulligans.uk.com"
            className="text-[#1DC690] underline hover:text-[#16a574]"
          >
            info@mulligans.uk.com
          </a>
          .
        </p>
      </header>

      <div className="space-y-4">
        {LEGAL_DOCUMENTS.map((doc) => (
          <Link
            key={doc.href}
            href={doc.href}
            className="block rounded-lg border border-gray-200 bg-white p-6 transition-all hover:border-[#1DC690] hover:shadow-md"
          >
            <h2 className="text-xl font-semibold text-[#06070A]">
              {doc.title}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {doc.description}
            </p>
            <span className="mt-3 inline-block text-sm font-medium text-[#1DC690]">
              Read &rarr;
            </span>
          </Link>
        ))}
      </div>

      <footer className="mt-12 border-t border-gray-200 pt-6 text-sm text-gray-600">
        <p>
          Mulligans Golf Limited &middot; Company number 16647100 &middot; Registered in England and Wales
        </p>
      </footer>
    </article>
  );
}
