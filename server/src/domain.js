/**
 * Ghana-first reference data. Kept in one place so the API and the web app
 * validate against exactly the same lists.
 */

export const REGIONS = [
  { code: 'AH', name: 'Ashanti', capital: 'Kumasi' },
  { code: 'BA', name: 'Bono', capital: 'Sunyani' },
  { code: 'BE', name: 'Bono East', capital: 'Techiman' },
  { code: 'BO', name: 'Bono (Ahafo)', capital: 'Goaso' },
  { code: 'CE', name: 'Central', capital: 'Cape Coast' },
  { code: 'EA', name: 'Eastern', capital: 'Koforidua' },
  { code: 'GA', name: 'Greater Accra', capital: 'Accra' },
  { code: 'NE', name: 'North East', capital: 'Nalerigu' },
  { code: 'NO', name: 'Northern', capital: 'Tamale' },
  { code: 'OT', name: 'Oti', capital: 'Dambai' },
  { code: 'SA', name: 'Savannah', capital: 'Damongo' },
  { code: 'UE', name: 'Upper East', capital: 'Bolgatanga' },
  { code: 'UW', name: 'Upper West', capital: 'Wa' },
  { code: 'VO', name: 'Volta', capital: 'Ho' },
  { code: 'WE', name: 'Western', capital: 'Sekondi-Takoradi' },
  { code: 'WN', name: 'Western North', capital: 'Sefwi Wiawso' },
];

export const REGION_NAMES = REGIONS.map((r) => r.name);

export const CROPS = [
  { slug: 'cocoa', name: 'Cocoa', unit: 'kg', category: 'Cash crop' },
  { slug: 'cashew', name: 'Cashew', unit: 'kg', category: 'Cash crop' },
  { slug: 'shea-nut', name: 'Shea nut', unit: 'kg', category: 'Cash crop' },
  { slug: 'maize', name: 'Maize', unit: 'kg', category: 'Cereal' },
  { slug: 'rice-paddy', name: 'Rice paddy', unit: 'kg', category: 'Cereal' },
  { slug: 'soya-bean', name: 'Soya bean', unit: 'kg', category: 'Legume' },
  { slug: 'cassava', name: 'Cassava', unit: 'kg', category: 'Tuber' },
  { slug: 'yam', name: 'Yam', unit: 'kg', category: 'Tuber' },
  { slug: 'tomato', name: 'Tomato', unit: 'kg', category: 'Vegetable' },
  { slug: 'onion', name: 'Onion', unit: 'kg', category: 'Vegetable' },
  { slug: 'palm-fruit', name: 'Oil palm fruit', unit: 'kg', category: 'Cash crop' },
  { slug: 'groundnut', name: 'Groundnut', unit: 'kg', category: 'Legume' },
];

export const CROP_SLUGS = CROPS.map((c) => c.slug);

export const GRADES = ['A', 'B', 'C'];

export const USER_ROLES = ['farmer', 'processor', 'exporter'];

export const ORG_TYPES = ['farm', 'cooperative', 'processor', 'exporter'];

/** Entities a processor/exporter can buy produce as. */
export const BUYER_ROLES = ['processor', 'exporter'];

export const LISTING_STATUSES = ['active', 'reserved', 'sold', 'archived'];

export const REQUEST_STATUSES = ['open', 'in_progress', 'fulfilled', 'cancelled'];

export const INQUIRY_STATUSES = ['pending', 'accepted', 'declined', 'completed'];

export const CURRENCY = 'GHS';

export const QUANTITY_UNITS = ['kg', 'tonne', 'bag(50kg)'];
