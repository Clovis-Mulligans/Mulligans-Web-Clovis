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
  title: 'Mulligans — Buy & Sell Golf Equipment',
  description:
    'The UK marketplace for buying and selling new and pre-owned golf equipment and clothing. Golf-specific search filters no other marketplace offers.',
  openGraph: {
    title: 'Mulligans — Buy & Sell Golf Equipment',
    description:
      'The UK marketplace for buying and selling new and pre-owned golf equipment and clothing.',
    type: 'website',
    url: 'https://mulligans.uk.com',
  },
  icons: {
    icon: 'https://mulligans-golf-images-mvp.s3.eu-west-2.amazonaws.com/email-assets/Asset+21x+transparent.png',
    apple: 'https://mulligans-golf-images-mvp.s3.eu-west-2.amazonaws.com/email-assets/Asset+21x+transparent.png',
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
        style={{ fontFamily: 'var(--font-sans)', backgroundColor: '#EAEAE0' }}
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
