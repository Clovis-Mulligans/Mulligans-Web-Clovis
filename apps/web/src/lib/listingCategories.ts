/**
 * Categories, subcategories, and per-subcategory spec field definitions
 * for the /sell wizard. Single source of truth for the form's dynamic step 2.
 *
 * "Everything Else" is intentionally NOT included — backend `category` enum
 * does not accept it (see audit §3 + brief rule 14).
 */

export interface CategoryOption {
  value: string;
  label: string;
}

export type SpecFieldType =
  | 'select'        // dropdown — single value
  | 'buttons'       // single-select button row
  | 'multiSelect'   // multi-select button grid (e.g. set makeup)
  | 'text'          // free text
  | 'number';       // numeric input

export interface SpecField {
  /** Key written into specifications object */
  key: string;
  label: string;
  type: SpecFieldType;
  options?: string[];
  /** Show only when this predicate matches the current values */
  when?: (ctx: { subcategory?: string | null; clubType?: string | null }) => boolean;
  placeholder?: string;
}

export const CATEGORIES: CategoryOption[] = [
  { value: 'Clubs', label: 'Clubs' },
  { value: 'Shafts, Grips & Heads', label: 'Shafts, Grips & Heads' },
  { value: 'Clothing', label: 'Clothing' },
  { value: 'Shoes', label: 'Shoes' },
  { value: 'Accessories', label: 'Accessories' },
  { value: 'Balls', label: 'Balls' },
  { value: 'Training Aids', label: 'Training Aids' },
];

export const SUBCATEGORIES: Record<string, string[]> = {
  'Clubs': ['Drivers', 'Fairway Woods', 'Hybrids', 'Irons', 'Wedges', 'Putters', 'Other'],
  'Shafts, Grips & Heads': ['Shafts', 'Grips', 'Heads', 'Other'],
  'Clothing': [
    'Jackets', 'Polo Shirts', 'Trousers', 'Shorts', 'Hoodies', 'Knitwear',
    'Gilets', 'Mid-Layers', 'Waterproofs', 'Hats & Caps', 'Sunglasses',
    'Gloves', 'Other',
  ],
  'Shoes': ['Golf Shoes', 'Other'],
  'Accessories': [
    'Bags', 'Headcovers', 'Tees', 'Rangefinders', 'Launch Monitors',
    'GPS Devices', 'Towels', 'Golf Trolleys', 'Other',
  ],
  'Balls': ['New', 'Used/Lake', 'Other'],
  'Training Aids': ['Swing Trainer', 'Putting Aid', 'Net', 'Mat', 'GPS Watch', 'Other'],
};

// ───── Shared option lists ─────

const GENDER = ['Male', 'Female', 'Junior'];
const DEXTERITY = ['Right Handed', 'Left Handed'];
const SHAFT_FLEX = ['Extra Stiff', 'Stiff', 'Regular', 'Senior', 'Wedge', 'Ladies', 'Junior'];
const SHAFT_MATERIAL = ['Steel', 'Graphite'];
const GRIP_SIZE = ['Junior', 'Undersize', 'Standard', 'Midsize', 'Jumbo', 'Plus 4'];
const PUTTER_HEAD_TYPE = ['Blade', 'Mid-Mallet', 'Mallet'];
const PUTTER_TYPE = ['Traditional', 'Arm Lock', 'Broomstick'];
const SET_MAKEUP = ['3', '4', '5', '6', '7', '8', '9', 'PW', 'GW', 'AW', 'SW', 'LW'];
const COLOURS = [
  'Black', 'White', 'Grey', 'Navy', 'Red', 'Blue', 'Green', 'Yellow',
  'Pink', 'Orange', 'Brown', 'Beige', 'Multi',
];
const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Various'];
const SHOE_SIZES = [
  '4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5',
  '10', '10.5', '11', '11.5', '12', '13', 'Various',
];
const WAIST_SIZES = Array.from({ length: 19 }, (_, i) => `${24 + i}"`);
const JACKET_TYPE = ['Down', 'Hybrid', 'Lightweight', 'Waterproof'];
const GLOVE_SIZES = ['S', 'M', 'LM', 'L', 'XL', 'XXL'];
const BAG_TYPE = ['Stand', 'Cart', 'Tour', 'Pencil', 'Travel'];
const HEADCOVER_TYPE = [
  'Driver', 'Fairway', 'Hybrid', 'Irons', 'Putter - Blade', 'Putter - Mallet',
  'Alignment Cover', 'Rangefinder Cover', 'Full Set',
];
const TEE_MATERIAL = ['Wood', 'Plastic'];
const TEE_STYLE = ['Traditional', 'Castle'];
const TROLLEY_TYPE = ['Push', 'Electric', 'Electric Remote'];
const ADAPTER = ['None', 'TaylorMade', 'Callaway', 'Titleist', 'Ping', 'Cobra', 'Mizuno', 'Srixon', 'Other'];
const HEAD_CLUB_TYPE = ['Driver', 'Fairway Wood', 'Hybrid', 'Iron', 'Wedge', 'Putter'];

const LIE_ANGLE = ['Standard', '54°', '55°', '56°', '57°', '58°', '59°', '60°',
  '61°', '62°', '63°', '64°', '65°', '66°'];

// Length lists
const CLUB_LENGTH = ['Standard', '-2"', '-1.5"', '-1"', '-0.5"', '-0.25"',
  '+0.25"', '+0.5"', '+1"', '+1.5"', '+2"', 'Custom'];
const PUTTER_LENGTH = ['28', '29', '30', '31', '32', '33', '34', '35', '36',
  '37', '38', 'Custom'];

// Loft lists by club type
const LOFT_DRIVERS = ['8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '12.5', '13'];
const LOFT_FAIRWAY = Array.from({ length: 11 }, (_, i) => String(13 + i));
const LOFT_HYBRIDS = Array.from({ length: 12 }, (_, i) => String(17 + i));
const LOFT_WEDGES = ['48', '50', '52', '54', '56', '58', '60', '62', '64'];

function loftOptionsForSubcategory(sub?: string | null): string[] {
  switch (sub) {
    case 'Drivers': return LOFT_DRIVERS;
    case 'Fairway Woods': return LOFT_FAIRWAY;
    case 'Hybrids': return LOFT_HYBRIDS;
    case 'Wedges': return LOFT_WEDGES;
    default: return [];
  }
}

function lengthOptionsForSubcategory(sub?: string | null): string[] {
  if (sub === 'Putters') return PUTTER_LENGTH;
  return CLUB_LENGTH;
}

/**
 * Returns the set of spec fields to render given the chosen category +
 * subcategory. Brand and model are handled separately by the form.
 */
export function specFieldsFor(category: string, subcategory: string | null | undefined): SpecField[] {
  const sub = subcategory ?? null;

  if (category === 'Clubs') {
    const fields: SpecField[] = [
      { key: 'gender', label: 'Gender', type: 'buttons', options: GENDER },
      { key: 'dexterity', label: 'Dexterity', type: 'buttons', options: DEXTERITY },
      { key: 'shaftFlex', label: 'Shaft Flex', type: 'select', options: SHAFT_FLEX },
      { key: 'shaftModel', label: 'Shaft Model', type: 'text', placeholder: 'e.g. KBS Tour' },
    ];
    const lofts = loftOptionsForSubcategory(sub);
    if (lofts.length) {
      fields.push({ key: 'loft', label: 'Loft', type: 'select', options: lofts });
    }
    if (sub === 'Irons') {
      fields.push({ key: 'setMakeup', label: 'Set Makeup', type: 'multiSelect', options: SET_MAKEUP });
    }
    if (sub === 'Irons' || sub === 'Wedges') {
      fields.push({ key: 'shaftMaterial', label: 'Shaft Material', type: 'buttons', options: SHAFT_MATERIAL });
    }
    if (sub === 'Putters') {
      fields.push({ key: 'putterHeadType', label: 'Putter Head Type', type: 'buttons', options: PUTTER_HEAD_TYPE });
      fields.push({ key: 'putterType', label: 'Putter Type', type: 'buttons', options: PUTTER_TYPE });
    }
    fields.push({ key: 'gripSize', label: 'Grip Size', type: 'select', options: GRIP_SIZE });
    fields.push({ key: 'length', label: 'Length', type: 'select', options: lengthOptionsForSubcategory(sub) });
    fields.push({ key: 'lieAngle', label: 'Lie Angle', type: 'select', options: LIE_ANGLE });
    return fields;
  }

  if (category === 'Shafts, Grips & Heads') {
    if (sub === 'Shafts') {
      return [
        { key: 'shaftMaterial', label: 'Material', type: 'buttons', options: SHAFT_MATERIAL },
        { key: 'shaftFlex', label: 'Flex', type: 'select', options: SHAFT_FLEX },
        { key: 'length', label: 'Length', type: 'select', options: CLUB_LENGTH },
        { key: 'adapter', label: 'Adapter', type: 'select', options: ADAPTER },
        { key: 'gripSize', label: 'Grip Size', type: 'select', options: GRIP_SIZE },
      ];
    }
    if (sub === 'Grips') {
      return [
        { key: 'gripType', label: 'Grip Type', type: 'buttons', options: ['Wood/Iron', 'Putter'] },
        { key: 'gripSize', label: 'Grip Size', type: 'select', options: GRIP_SIZE },
      ];
    }
    if (sub === 'Heads') {
      return [
        { key: 'clubType', label: 'Club Type', type: 'select', options: HEAD_CLUB_TYPE },
        { key: 'loft', label: 'Loft (°)', type: 'number', placeholder: 'e.g. 10.5' },
        { key: 'lieAngle', label: 'Lie Angle (°)', type: 'number', placeholder: 'e.g. 60' },
      ];
    }
    return [];
  }

  if (category === 'Clothing') {
    if (sub === 'Gloves') {
      return [
        { key: 'dexterity', label: 'Dexterity', type: 'buttons', options: ['Left Hand', 'Right Hand'] },
        { key: 'gloveSize', label: 'Glove Size', type: 'buttons', options: GLOVE_SIZES },
        { key: 'color', label: 'Colour', type: 'select', options: COLOURS },
      ];
    }
    const fields: SpecField[] = [
      { key: 'gender', label: 'Gender', type: 'buttons', options: GENDER },
      { key: 'size', label: 'Size', type: 'select', options: CLOTHING_SIZES },
    ];
    if (sub === 'Trousers' || sub === 'Shorts') {
      fields.push({ key: 'waist', label: 'Waist', type: 'select', options: WAIST_SIZES });
    }
    if (sub === 'Jackets') {
      fields.push({ key: 'clothingType', label: 'Jacket Type', type: 'select', options: JACKET_TYPE });
    }
    fields.push({ key: 'color', label: 'Colour', type: 'select', options: COLOURS });
    return fields;
  }

  if (category === 'Shoes') {
    return [
      { key: 'gender', label: 'Gender', type: 'buttons', options: GENDER },
      { key: 'shoeSize', label: 'UK Size', type: 'select', options: SHOE_SIZES },
      { key: 'color', label: 'Colour', type: 'select', options: COLOURS },
      { key: 'spikes', label: 'Spikes', type: 'buttons', options: ['Yes', 'No'] },
    ];
  }

  if (category === 'Accessories') {
    if (sub === 'Bags') {
      return [
        { key: 'bagType', label: 'Bag Type', type: 'buttons', options: BAG_TYPE },
        { key: 'color', label: 'Colour', type: 'select', options: COLOURS },
      ];
    }
    if (sub === 'Headcovers') {
      return [
        { key: 'headcoverType', label: 'Headcover Type', type: 'select', options: HEADCOVER_TYPE },
        { key: 'color', label: 'Colour', type: 'select', options: COLOURS },
      ];
    }
    if (sub === 'Tees') {
      return [
        { key: 'teeMaterial', label: 'Material', type: 'buttons', options: TEE_MATERIAL },
        { key: 'teeStyle', label: 'Style', type: 'buttons', options: TEE_STYLE },
      ];
    }
    if (sub === 'Rangefinders') {
      return [
        { key: 'slopeAdjust', label: 'Slope Adjust', type: 'buttons', options: ['Yes', 'No'] },
      ];
    }
    if (sub === 'Towels') {
      return [{ key: 'color', label: 'Colour', type: 'select', options: COLOURS }];
    }
    if (sub === 'Golf Trolleys') {
      return [{ key: 'trolleyType', label: 'Trolley Type', type: 'buttons', options: TROLLEY_TYPE }];
    }
    return [];
  }

  return [];
}

/** Sizes used for the per-size quantity grid when "Various" is selected. */
export function variantSizesFor(category: string, subcategory: string | null | undefined): string[] {
  if (category === 'Clothing' && subcategory !== 'Gloves') return ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  if (category === 'Shoes') return SHOE_SIZES.filter(s => s !== 'Various');
  return [];
}

/** Parcel sizes — see audit §7. Shipping cost is locked to selection. */
export interface ParcelOption {
  id: 'small' | 'medium' | 'large' | 'extra_large' | 'oversized';
  name: string;
  description: string;
  price: number;
}

export const PARCEL_SIZES: ParcelOption[] = [
  { id: 'small', name: 'Small', description: 'Balls, gloves, small accessories', price: 3.49 },
  { id: 'medium', name: 'Medium', description: 'Single clubs, shoes, clothing', price: 5.99 },
  { id: 'large', name: 'Large', description: 'Sets of irons, drivers, stand bags', price: 9.99 },
  { id: 'extra_large', name: 'Extra Large', description: 'Full bags, travel covers', price: 14.99 },
  { id: 'oversized', name: 'Oversized', description: 'Large equipment or bulk', price: 19.99 },
];

/** Live buyer-price calculation matching mobile's calculateBuyerPrice. */
export function calculateBuyerPrice(price: number): number {
  return price * 1.075 + 0.99;
}

/** Condition slider labels (1–5). Matches mobile grading. */
export const CONDITION_LABELS: Record<number, string> = {
  1: 'Poor', 2: 'Good', 3: 'Very Good', 4: 'Excellent', 5: 'New',
};
