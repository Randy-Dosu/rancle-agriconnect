import { hashPassword } from './auth.js';
import { countUsers, createDemandRequest, createInquiry, createListing, createUser, updateInquiryStatus } from './store.js';

/**
 * Demo dataset tuned for Ghana: Ashanti/Bono maize, cocoa from Western North,
 * shea from the north, cashew from Bono East, plus the processors and exporters
 * that buy them.
 *
 * Every seeded account shares the password below so reviewers can log in fast.
 */
export const DEMO_PASSWORD = 'AgriConnect123';

const FARMERS = [
  {
    email: 'ama.mensah@agriconnect.gh',
    full_name: 'Ama Mensah',
    role: 'farmer',
    phone: '+233 24 111 2233',
    region: 'Ashanti',
    organisation: 'Ejisu Farmers Cooperative',
    bio: 'Maize and soya bean grower supplying feed mills around Kumasi since 2016.',
  },
  {
    email: 'kwame.owusu@agriconnect.gh',
    full_name: 'Kwame Owusu',
    role: 'farmer',
    phone: '+233 20 445 7788',
    region: 'Western North',
    organisation: 'Sefwi Cocoa Growers Union',
    bio: 'Cocoa farmer with 18 acres in Sefwi Wiawso, certified since 2019.',
  },
  {
    email: 'abena.nkrumah@agriconnect.gh',
    full_name: 'Abena Nkrumah',
    role: 'farmer',
    phone: '+233 55 909 1122',
    region: 'Bono East',
    organisation: 'Techiman Cashew Association',
    bio: 'Cashew and yam producer working with 40 smallholder members.',
  },
  {
    email: 'yaw.baffour@agriconnect.gh',
    full_name: 'Yaw Baffour',
    role: 'farmer',
    phone: '+233 27 330 4455',
    region: 'Northern',
    organisation: 'Tamale Shea Collective',
    bio: 'Shea nut and soya bean aggregator for women-led cooperatives in Tamale.',
  },
  {
    email: 'fatima.abdulai@agriconnect.gh',
    full_name: 'Fatima Abdulai',
    role: 'farmer',
    phone: '+233 24 776 8899',
    region: 'Volta',
    organisation: 'Keta Rice Growers',
    bio: 'Rice paddy and tomato farmer in the Volta region with irrigation access.',
  },
];

const BUYERS = [
  {
    email: 'purchasing@goldenharvest.gh',
    full_name: 'Nana Yeboah',
    role: 'processor',
    phone: '+233 30 222 5566',
    region: 'Ashanti',
    organisation: 'Golden Harvest Feed Mills',
    bio: 'Feed mill in Kumasi processing 400 tonnes of maize and soya monthly.',
  },
  {
    email: 'sourcing@atlanticcocoa.gh',
    full_name: 'Esi Boateng',
    role: 'exporter',
    phone: '+233 30 277 3344',
    region: 'Greater Accra',
    organisation: 'Atlantic Cocoa Exports Ltd',
    bio: 'Licensed cocoa exporter shipping to European chocolate manufacturers.',
  },
  {
    email: 'procurement@savannahoils.gh',
    full_name: 'Ibrahim Musah',
    role: 'processor',
    phone: '+233 37 220 1199',
    region: 'Northern',
    organisation: 'Savannah Shea Oils',
    bio: 'Shea butter processor in Tamale supplying cosmetics manufacturers.',
  },
  {
    email: 'trade@accracashew.gh',
    full_name: 'Kwesi Appiah',
    role: 'exporter',
    phone: '+233 30 244 8877',
    region: 'Greater Accra',
    organisation: 'Accra Cashew Trading',
    bio: 'Cashew kernel exporter sourcing raw nuts from Bono East and Savannah.',
  },
];

const LISTINGS = [
  {
    farmer: 'ama.mensah@agriconnect.gh',
    crop: 'maize',
    grade: 'A',
    quantity_kg: 25000,
    price_per_kg: 2.4,
    region: 'Ashanti',
    town: 'Ejisu',
    harvest_date: '2026-10-20',
    available_from: '2026-11-20',
    description: 'Sun-dried yellow maize, moisture below 13%, bagged in 50kg sacks at the Ejisu warehouse.',
  },
  {
    farmer: 'ama.mensah@agriconnect.gh',
    crop: 'soya-bean',
    grade: 'A',
    quantity_kg: 12000,
    price_per_kg: 3.1,
    region: 'Ashanti',
    town: 'Ejisu',
    harvest_date: '2026-10-28',
    description: 'Cleaned soya bean, ready for feed mill delivery within Ashanti.',
  },
  {
    farmer: 'kwame.owusu@agriconnect.gh',
    crop: 'cocoa',
    grade: 'A',
    quantity_kg: 18000,
    price_per_kg: 42.5,
    region: 'Western North',
    town: 'Sefwi Wiawso',
    harvest_date: '2026-11-05',
    description: 'Fermented and thoroughly dried cocoa beans, licensed buying company receipts available.',
  },
  {
    farmer: 'kwame.owusu@agriconnect.gh',
    crop: 'cocoa',
    grade: 'B',
    quantity_kg: 6000,
    price_per_kg: 36.0,
    region: 'Western North',
    town: 'Bibiani',
    description: 'Grade B cocoa with slight bean count variance, good for local processing.',
  },
  {
    farmer: 'abena.nkrumah@agriconnect.gh',
    crop: 'cashew',
    grade: 'A',
    quantity_kg: 30000,
    price_per_kg: 9.8,
    region: 'Bono East',
    town: 'Techiman',
    harvest_date: '2026-09-30',
    available_from: '2026-11-25',
    description: 'Raw cashew nuts, out-turn 46 lbs, stored dry in Techiman for exporter inspection.',
  },
  {
    farmer: 'abena.nkrumah@agriconnect.gh',
    crop: 'yam',
    grade: 'A',
    quantity_kg: 15000,
    price_per_kg: 4.2,
    region: 'Bono East',
    town: 'Kintampo',
    description: 'Puna yam tubers, sorted and graded, loaded from farm gate.',
  },
  {
    farmer: 'yaw.baffour@agriconnect.gh',
    crop: 'shea-nut',
    grade: 'A',
    quantity_kg: 22000,
    price_per_kg: 5.5,
    region: 'Northern',
    town: 'Tamale',
    harvest_date: '2026-08-15',
    description: 'Hand-gathered shea nuts, kernel yield tested at 44%, aggregated from 6 cooperatives.',
  },
  {
    farmer: 'yaw.baffour@agriconnect.gh',
    crop: 'soya-bean',
    grade: 'B',
    quantity_kg: 9000,
    price_per_kg: 2.85,
    region: 'Northern',
    town: 'Savelugu',
    description: 'Soya bean from rain-fed farms, small foreign matter content, priced to clear.',
  },
  {
    farmer: 'fatima.abdulai@agriconnect.gh',
    crop: 'rice-paddy',
    grade: 'A',
    quantity_kg: 20000,
    price_per_kg: 4.9,
    region: 'Volta',
    town: 'Keta',
    harvest_date: '2026-11-10',
    available_from: '2026-12-05',
    description: 'Irrigated rice paddy, moisture 14%, mill-ready for Volta and Greater Accra mills.',
  },
  {
    farmer: 'fatima.abdulai@agriconnect.gh',
    crop: 'tomato',
    grade: 'B',
    quantity_kg: 3500,
    price_per_kg: 6.4,
    region: 'Volta',
    town: 'Agbozume',
    description: 'Fresh tomatoes in crates, harvested weekly, ideal for paste processors.',
  },
];

const DEMANDS = [
  {
    buyer: 'purchasing@goldenharvest.gh',
    crop: 'maize',
    grade: 'A',
    quantity_kg: 40000,
    max_price_per_kg: 2.65,
    needed_by: '2026-12-15',
    region: 'Ashanti',
    notes: 'Feed mill needs 40 tonnes of Grade A maize monthly. Aflatoxin test required on delivery.',
  },
  {
    buyer: 'purchasing@goldenharvest.gh',
    crop: 'soya-bean',
    grade: 'A',
    quantity_kg: 20000,
    max_price_per_kg: 3.3,
    needed_by: '2026-12-20',
    notes: 'Soya bean for feed formulation; delivery to our Kumasi plant.',
  },
  {
    buyer: 'sourcing@atlanticcocoa.gh',
    crop: 'cocoa',
    grade: 'A',
    quantity_kg: 50000,
    max_price_per_kg: 45,
    needed_by: '2027-01-15',
    region: 'Western North',
    notes: 'Main crop buying season. Must be fermented, dried and free of smoke taint.',
  },
  {
    buyer: 'procurement@savannahoils.gh',
    crop: 'shea-nut',
    grade: 'A',
    quantity_kg: 25000,
    max_price_per_kg: 6,
    needed_by: '2026-12-01',
    notes: 'Shea nuts for butter processing; kernel yield above 40% preferred.',
  },
  {
    buyer: 'trade@accracashew.gh',
    crop: 'cashew',
    grade: 'A',
    quantity_kg: 35000,
    max_price_per_kg: 10.5,
    needed_by: '2027-01-05',
    notes: 'Raw cashew nut export order; out-turn 46 lbs and above.',
  },
  {
    buyer: 'trade@accracashew.gh',
    crop: 'rice-paddy',
    grade: 'A',
    quantity_kg: 15000,
    max_price_per_kg: 5.2,
    needed_by: '2027-02-01',
    region: 'Volta',
    notes: 'Paddy rice for milling contract, moisture 14% or below.',
  },
];

/**
 * Populates an empty database. Safe to call repeatedly — it no-ops when users exist.
 * @returns {{seeded: boolean, users: number}}
 */
export function seedDatabase(db, { force = false } = {}) {
  if (!force && countUsers(db) > 0) {
    return { seeded: false, users: countUsers(db) };
  }

  const passwordHash = hashPassword(DEMO_PASSWORD);
  const usersByEmail = new Map();

  for (const person of [...FARMERS, ...BUYERS]) {
    const user = createUser(db, { ...person, password_hash: passwordHash });
    usersByEmail.set(person.email, user);
  }

  const listingsByKey = new Map();
  for (const { farmer, ...rest } of LISTINGS) {
    const owner = usersByEmail.get(farmer);
    const listing = createListing(db, owner.id, rest);
    listingsByKey.set(`${farmer}:${rest.crop}:${rest.grade}`, listing);
  }

  const requestsByKey = new Map();
  for (const { buyer, ...rest } of DEMANDS) {
    const owner = usersByEmail.get(buyer);
    const request = createDemandRequest(db, owner.id, rest);
    requestsByKey.set(`${buyer}:${rest.crop}`, request);
  }

  // A few conversations at various lifecycle stages so dashboards aren't empty.
  const feedMill = usersByEmail.get('purchasing@goldenharvest.gh');
  const cocoaExporter = usersByEmail.get('sourcing@atlanticcocoa.gh');
  const ama = usersByEmail.get('ama.mensah@agriconnect.gh');
  const kwame = usersByEmail.get('kwame.owusu@agriconnect.gh');
  const abena = usersByEmail.get('abena.nkrumah@agriconnect.gh');
  const cashewTrader = usersByEmail.get('trade@accracashew.gh');

  const maizeListing = listingsByKey.get('ama.mensah@agriconnect.gh:maize:A');
  const cocoaListing = listingsByKey.get('kwame.owusu@agriconnect.gh:cocoa:A');
  const cashewListing = listingsByKey.get('abena.nkrumah@agriconnect.gh:cashew:A');
  const maizeDemand = requestsByKey.get('purchasing@goldenharvest.gh:maize');
  const cocoaDemand = requestsByKey.get('sourcing@atlanticcocoa.gh:cocoa');
  const cashewDemand = requestsByKey.get('trade@accracashew.gh:cashew');

  const pending = createInquiry(db, {
    listing_id: maizeListing.id,
    buyer_id: feedMill.id,
    farmer_id: ama.id,
    quantity_kg: 20000,
    offer_price_per_kg: 2.5,
    message: 'We would like 20 tonnes delivered to our Kumasi plant before 10 December.',
  });

  const accepted = createInquiry(db, {
    listing_id: cocoaListing.id,
    buyer_id: cocoaExporter.id,
    farmer_id: kwame.id,
    quantity_kg: 15000,
    offer_price_per_kg: 43,
    message: 'Please confirm the bean count and we will arrange haulage from Sefwi Wiawso.',
  });
  updateInquiryStatus(db, accepted.id, 'accepted');

  const completed = createInquiry(db, {
    listing_id: cashewListing.id,
    buyer_id: cashewTrader.id,
    farmer_id: abena.id,
    quantity_kg: 10000,
    offer_price_per_kg: 10,
    message: 'Sample collected and approved. Proceeding with 10 tonnes.',
  });
  updateInquiryStatus(db, completed.id, 'accepted');
  updateInquiryStatus(db, completed.id, 'completed');

  // Farmer-initiated responses to buyer demand.
  createInquiry(db, {
    request_id: maizeDemand.id,
    buyer_id: feedMill.id,
    farmer_id: ama.id,
    quantity_kg: 25000,
    offer_price_per_kg: 2.4,
    message: 'We can supply 25 tonnes from our Ejisu warehouse immediately.',
  });
  createInquiry(db, {
    request_id: cocoaDemand.id,
    buyer_id: cocoaExporter.id,
    farmer_id: kwame.id,
    quantity_kg: 18000,
    offer_price_per_kg: 42.5,
    message: 'Grade A cocoa available for the main crop season.',
  });
  createInquiry(db, {
    request_id: cashewDemand.id,
    buyer_id: cashewTrader.id,
    farmer_id: abena.id,
    quantity_kg: 30000,
    offer_price_per_kg: 9.8,
    message: '30 tonnes raw cashew nuts, out-turn 46 lbs, stored in Techiman.',
  });

  void pending;

  return { seeded: true, users: countUsers(db) };
}
