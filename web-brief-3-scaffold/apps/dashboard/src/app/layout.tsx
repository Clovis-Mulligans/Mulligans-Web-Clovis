import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import '@mulligans/ui/globals.css';
import { AuthProvider } from '@/lib/auth-provider';

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Mulligans Pro Dashboard',
  description: 'Manage your pro store on Mulligans',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={montserrat.variable}>
      <body
        className="min-h-screen bg-[#EAEAE0] font-sans antialiased"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
