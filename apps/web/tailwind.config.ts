import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        mulligans: {
          primary: '#1DC690',
          blue: '#278AB0',
          'dark-blue': '#1C4670',
          dark: '#06070A',
          ivory: '#EAEAE0',
        },
      },
      fontFamily: {
        sans: ['"Montserrat"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
