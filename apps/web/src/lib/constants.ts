/** Condition badge colours — matches mobile app exactly */
export const CONDITION_COLOURS: Record<number, { bg: string; label: string; description: string }> = {
  5: { bg: '#10B981', label: 'New', description: 'Unused, in original condition' },
  4: { bg: '#8B5CF6', label: 'Excellent', description: 'Like new, minimal use' },
  3: { bg: '#3B82F6', label: 'Very Good', description: 'Light use, no major marks' },
  2: { bg: '#F59E0B', label: 'Good', description: 'Used, some visible wear' },
  1: { bg: '#EF4444', label: 'Fair', description: 'Heavy use, cosmetic damage' },
};

/** URL slug → exact DB category name */
export const CATEGORY_SLUG_TO_DB: Record<string, string> = {
  'clubs': 'Clubs',
  'clothing': 'Clothing',
  'shoes': 'Shoes',
  'accessories': 'Accessories',
  'balls': 'Balls',
  'training-aids': 'Training Aids',
  'shafts-grips': 'Shafts, Grips & Heads',
  'everything-else': 'Everything Else',
};

/** DB category name → URL slug */
export const CATEGORY_DB_TO_SLUG: Record<string, string> = {
  'Clubs': 'clubs',
  'Clothing': 'clothing',
  'Shoes': 'shoes',
  'Accessories': 'accessories',
  'Balls': 'balls',
  'Training Aids': 'training-aids',
  'Shafts, Grips & Heads': 'shafts-grips',
  'Everything Else': 'everything-else',
};
