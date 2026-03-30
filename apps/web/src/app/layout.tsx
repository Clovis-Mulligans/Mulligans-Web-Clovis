import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import '@mulligans/ui/globals.css';

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Mulligans — Buy & Sell Golf Equipment',
  description:
    'The marketplace for buying and selling new and pre-owned golf equipment and clothing. Golf-specific search filters no other marketplace offers.',
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
        {/* Top navigation bar */}
        <header className="sticky top-0 z-50 border-b border-gray-300 bg-white shadow-sm">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
            <a href="/" className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 280 50"
                width={160}
                height={32}
                aria-label="Mulligans"
              >
                <text
                  x="0"
                  y="38"
                  fontFamily="'Montserrat', sans-serif"
                  fontWeight="700"
                  fontSize="36"
                  fill="#1DC690"
                  letterSpacing="3"
                >
                  MULLIGANS
                </text>
              </svg>
            </a>

            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <input
                type="text"
                placeholder="Search golf equipment..."
                className="w-full rounded-full border border-gray-300 bg-[#EAEAE0] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1DC690] focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-3">
              <a
                href="/login"
                className="rounded-md px-4 py-2 text-sm font-medium text-[#1C4670] hover:bg-gray-100 transition-colors"
              >
                Sign In
              </a>
              <a
                href="/login"
                className="rounded-md bg-[#1DC690] px-4 py-2 text-sm font-semibold text-white hover:bg-[#19b07f] transition-colors"
              >
                Sign Up
              </a>
            </div>
          </div>
        </header>

        <main>{children}</main>

        {/* Footer */}
        <footer className="border-t border-gray-300 bg-white mt-12">
          <div className="mx-auto max-w-7xl px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-500">
                &copy; {new Date().getFullYear()} Mulligans Golf Limited. All
                rights reserved.
              </p>
              <div className="flex gap-6 text-sm text-gray-500">
                <a href="#" className="hover:text-[#1DC690]">
                  Terms
                </a>
                <a href="#" className="hover:text-[#1DC690]">
                  Privacy
                </a>
                <a href="#" className="hover:text-[#1DC690]">
                  Help
                </a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
