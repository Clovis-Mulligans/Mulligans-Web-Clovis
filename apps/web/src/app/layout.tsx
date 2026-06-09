import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import '@mulligans/ui/globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AuthProvider } from '@/components/AuthProvider';

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.mulligans.uk.com'),
  title: {
    default: 'Mulligans — Buy & Sell Golf Equipment | UK Golf Marketplace',
    template: '%s | Mulligans',
  },
  description:
    'Buy and sell new and used golf clubs, clothing and gear in the UK. Golf-specific search filters that no other marketplace offers — find equipment by shaft flex, loft, lie angle and more.',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Mulligans — Buy & Sell Golf Equipment | UK Golf Marketplace',
    description:
      'Buy and sell new and used golf clubs, clothing and gear in the UK. Golf-specific search filters no other marketplace offers.',
    type: 'website',
    url: 'https://www.mulligans.uk.com',
    siteName: 'Mulligans',
  },
  icons: {
    icon: 'https://mulligans-golf-images-mvp.s3.eu-west-2.amazonaws.com/email-assets/Asset+21x+transparent.png',
    apple: 'https://mulligans-golf-images-mvp.s3.eu-west-2.amazonaws.com/email-assets/Asset+21x+transparent.png',
  },
  alternates: {
    canonical: 'https://www.mulligans.uk.com',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={montserrat.variable}>
      <body
        className="min-h-screen font-sans antialiased"
        style={{ fontFamily: 'var(--font-sans)', backgroundColor: '#FFFFFF' }}
      >
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}