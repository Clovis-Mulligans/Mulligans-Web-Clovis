/** Mulligans Brand Colour Palette */
export const colors = {
  /** Primary brand green — #1DC690 */
  primary: '#1DC690',
  /** Secondary blue — #278AB0 */
  blue: '#278AB0',
  /** Dark blue — #1C4670 */
  darkBlue: '#1C4670',
  /** Dark background — #06070A */
  dark: '#06070A',
  /** Ivory / light background — #EAEAE0 */
  ivory: '#EAEAE0',
  /** White */
  white: '#FFFFFF',
  /** Error red */
  error: '#EF4444',
  /** Warning amber */
  warning: '#F59E0B',
  /** Success — uses primary green */
  success: '#1DC690',
} as const;

/** Montserrat font family configuration */
export const fonts = {
  sans: '"Montserrat", sans-serif',
  heading: '"Montserrat", sans-serif',
} as const;

export type BrandColor = keyof typeof colors;
