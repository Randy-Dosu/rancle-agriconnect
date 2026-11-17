import { BUYER_ROLES } from './domain.js';

/* ------------------------------------------------------------------ */
/* Users                                                              */
/* ------------------------------------------------------------------ */

const PUBLIC_USER_COLUMNS = `id, email, full_name, role, phone, region, organisation, bio, created_at`;

export function createUser(db, user) {
  const stmt = db.prepare(`
    INSERT INTO users (email, password_hash, full_name, role, phone, region, organisation, bio)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    user.email,
    user.password_hash,
    user.full_name,
    user.role,
    user.phone ?? null,
    user.region ?? null,
    user.organisation ?? null,
    user.bio ?? null,
  );
  return findUserById(db, Number(result.lastInsertRowid));
}

export function findUserById(db, id) {
  return db.prepare(`SELECT ${PUBLIC_USER_COLUMNS} FROM users WHERE id = ?`).get(id) ?? null;
}

export function findUserByEmail(db, email) {
  return db.prepare(`SELECT * FROM users WHERE email = ?`).get(email) ?? null;
}

export function countUsers(db) {
  return db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
}

/* ------------------------------------------------------------------ */
/* Listings                                                           */
/* ------------------------------------------------------------------ */

const LISTING_SELECT = `
  SELECT l.*, u.full_name AS farmer_name, u.organisation AS farmer_organisation,
         u.phone AS farmer_phone, u.email AS farmer_email
  FROM listings l
  JOIN users u ON u.id = l.farmer_id
`;

export function createListing(db, farmerId, data) {
  const result = db.prepare(`
    INSERT INTO listings (farmer_id, crop, grade, quantity_kg, available_from, price_per_kg,
                          region, town, harvest_date, description, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    farmerId,
    data.crop,
    data.grade,
    data.quantity_kg,
    data.available_from ?? null,
    data.price_per_kg,
    data.region,
    data.town ?? null,
    data.harvest_date ?? null,
    data.description ?? null,
    data.status ?? 'active',
  );
  return findListingById(db, Number(result.lastInsertRowid));
}

export function findListingById(db, id) {
  return db.prepare(`${LISTING_SELECT} WHERE l.id = ?`).get(id) ?? null;
}

export function updateListing(db, id, data) {
  const current = db.prepare('SELECT * FROM listings WHERE id = ?').get(id);
  if (!current) return null;
  db.prepare(`
    UPDATE listings SET crop = ?, grade = ?, quantity_kg = ?, available_from = ?,
      price_per_kg = ?, region = ?, town = ?, harvest_date = ?, description = ?,
      status = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    data.crop ?? current.crop,
    data.grade ?? current.grade,
    data.quantity_kg ?? current.quantity_kg,
    data.available_from !== undefined ? data.available_from : current.available_from,
    data.price_per_kg ?? current.price_per_kg,
    data.region ?? current.region,
    data.town !== undefined ? data.town : current.town,
    data.harvest_date !== undefined ? data.harvest_date : current.harvest_date,
    data.description !== undefined ? data.description : current.description,
    data.status ?? current.status,
    id,
  );
  return findListingById(db, id);
}

export function deleteListing(db, id) {
  return db.prepare('DELETE FROM listings WHERE id = ?').run(id).changes > 0;
}

/** Builds a filtered, paginated listing query. */
export function searchListings(db, filters) {
  const where = [];
  const params = [];

  if (filters.crop) { where.push('l.crop = ?'); params.push(filters.crop); }
  if (filters.region) { where.push('l.region = ?'); params.push(filters.region); }
  if (filters.grade) { where.push('l.grade = ?'); params.push(filters.grade); }
  if (filters.farmerId) { where.push('l.farmer_id = ?'); params.push(filters.farmerId); }
  if (filters.maxPrice) { where.push('l.price_per_kg <= ?'); params.push(filters.maxPrice); }
  if (filters.minQuantity) { where.push('l.quantity_kg >= ?'); params.push(filters.minQuantity); }
  if (filters.search) {
    where.push('(u.full_name LIKE ? OR u.organisation LIKE ? OR l.town LIKE ? OR l.description LIKE ?)');
    const like = `%${filters.search}%`;
    params.push(like, like, like, like);
  }
  if (filters.status === '*') {
    // no status constraint (used for a farmer's own listing history)
  } else if (filters.status) {
    where.push('l.status = ?');
    params.push(filters.status);
  } else {
    where.push("l.status = 'active'");
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const sort = filters.sort === 'price_asc' ? 'l.price_per_kg ASC'
    : filters.sort === 'price_desc' ? 'l.price_per_kg DESC'
    : filters.sort === 'quantity_desc' ? 'l.quantity_kg DESC'
    : 'l.created_at DESC';

  const total = db.prepare(`
    SELECT COUNT(*) AS n FROM listings l JOIN users u ON u.id = l.farmer_id ${whereSql}
  `).get(...params).n;

  const rows = db.prepare(`
    ${LISTING_SELECT} ${whereSql} ORDER BY ${sort} LIMIT ? OFFSET ?
  `).all(...params, filters.limit, filters.offset);

  return { rows, total };
}

export function listingStats(db, farmerId) {
  return db.prepare(`
    SELECT
      COUNT(*) AS total_listings,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_listings,
      COALESCE(SUM(quantity_kg), 0) AS total_quantity_kg,
      COALESCE(AVG(price_per_kg), 0) AS avg_price_per_kg
    FROM listings WHERE farmer_id = ?
  `).get(farmerId);
}

/* ------------------------------------------------------------------ */
/* Demand requests                                                    */
/* ------------------------------------------------------------------ */

const REQUEST_SELECT = `
  SELECT d.*, u.full_name AS buyer_name, u.organisation AS buyer_organisation,
         u.role AS buyer_role, u.phone AS buyer_phone, u.email AS buyer_email
  FROM demand_requests d
  JOIN users u ON u.id = d.buyer_id
`;

export function createDemandRequest(db, buyerId, data) {
  const result = db.prepare(`
    INSERT INTO demand_requests (buyer_id, crop, grade, quantity_kg, max_price_per_kg,
                                 needed_by, region, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    buyerId,
    data.crop,
    data.grade,
    data.quantity_kg,
    data.max_price_per_kg,
    data.needed_by ?? null,
    data.region ?? null,
    data.notes ?? null,
    data.status ?? 'open',
  );
  return findDemandRequestById(db, Number(result.lastInsertRowid));
}

export function findDemandRequestById(db, id) {
  return db.prepare(`${REQUEST_SELECT} WHERE d.id = ?`).get(id) ?? null;
}

export function updateDemandRequest(db, id, data) {
  const current = db.prepare('SELECT * FROM demand_requests WHERE id = ?').get(id);
  if (!current) return null;
  db.prepare(`
    UPDATE demand_requests SET crop = ?, grade = ?, quantity_kg = ?, max_price_per_kg = ?,
      needed_by = ?, region = ?, notes = ?, status = ?
    WHERE id = ?
  `).run(
    data.crop ?? current.crop,
    data.grade ?? current.grade,
    data.quantity_kg ?? current.quantity_kg,
    data.max_price_per_kg ?? current.max_price_per_kg,
    data.needed_by !== undefined ? data.needed_by : current.needed_by,
    data.region !== undefined ? data.region : current.region,
    data.notes !== undefined ? data.notes : current.notes,
    data.status ?? current.status,
    id,
  );
  return findDemandRequestById(db, id);
}

export function deleteDemandRequest(db, id) {
  return db.prepare('DELETE FROM demand_requests WHERE id = ?').run(id).changes > 0;
}

export function searchDemandRequests(db, filters) {
  const where = [];
  const params = [];

  if (filters.crop) { where.push('d.crop = ?'); params.push(filters.crop); }
  if (filters.region) { where.push('d.region = ?'); params.push(filters.region); }
  if (filters.buyerId) { where.push('d.buyer_id = ?'); params.push(filters.buyerId); }
  if (filters.minQuantity) { where.push('d.quantity_kg >= ?'); params.push(filters.minQuantity); }
  if (filters.search) {
    where.push('(u.full_name LIKE ? OR u.organisation LIKE ? OR d.notes LIKE ?)');
    const like = `%${filters.search}%`;
    params.push(like, like, like);
  }
  if (filters.status !== '*') {
    where.push('d.status = ?');
    params.push(filters.status || 'open');
  }

  const whereSql = `WHERE ${where.join(' AND ')}`;
  const total = db.prepare(`
    SELECT COUNT(*) AS n FROM demand_requests d JOIN users u ON u.id = d.buyer_id ${whereSql}
  `).get(...params).n;
  const rows = db.prepare(`
    ${REQUEST_SELECT} ${whereSql} ORDER BY d.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, filters.limit, filters.offset);
  return { rows, total };
}

/* ------------------------------------------------------------------ */
/* Inquiries                                                          */
/* ------------------------------------------------------------------ */

const INQUIRY_SELECT = `
  SELECT i.*,
         b.full_name AS buyer_name, b.organisation AS buyer_organisation,
         b.role AS buyer_role, b.email AS buyer_email, b.phone AS buyer_phone,
         f.full_name AS farmer_name, f.organisation AS farmer_organisation,
         f.email AS farmer_email, f.phone AS farmer_phone,
         l.crop AS listing_crop, l.region AS listing_region,
         d.crop AS request_crop
  FROM inquiries i
  JOIN users b ON b.id = i.buyer_id
  JOIN users f ON f.id = i.farmer_id
  LEFT JOIN listings l ON l.id = i.listing_id
  LEFT JOIN demand_requests d ON d.id = i.request_id
`;

export function createInquiry(db, data) {
  const result = db.prepare(`
    INSERT INTO inquiries (listing_id, request_id, buyer_id, farmer_id, quantity_kg,
                           offer_price_per_kg, message, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(
    data.listing_id ?? null,
    data.request_id ?? null,
    data.buyer_id,
    data.farmer_id,
    data.quantity_kg,
    data.offer_price_per_kg,
    data.message ?? null,
  );
  return findInquiryById(db, Number(result.lastInsertRowid));
}

export function findInquiryById(db, id) {
  return db.prepare(`${INQUIRY_SELECT} WHERE i.id = ?`).get(id) ?? null;
}

export function listInquiriesForUser(db, userId, role, { status } = {}) {
  const column = role === 'farmer' ? 'i.farmer_id' : 'i.buyer_id';
  const where = [`${column} = ?`];
  const params = [userId];
  if (status) { where.push('i.status = ?'); params.push(status); }
  return db.prepare(`
    ${INQUIRY_SELECT} WHERE ${where.join(' AND ')} ORDER BY i.created_at DESC
  `).all(...params);
}

export function updateInquiryStatus(db, id, status) {
  db.prepare('UPDATE inquiries SET status = ? WHERE id = ?').run(status, id);
  return findInquiryById(db, id);
}

/* ------------------------------------------------------------------ */
/* Matching: open demand requests that a farmer's produce can satisfy. */
/* ------------------------------------------------------------------ */

export function matchDemandForFarmer(db, farmerId, { limit = 20 } = {}) {
  const listings = db.prepare(`
    SELECT * FROM listings WHERE farmer_id = ? AND status = 'active'
  `).all(farmerId);
  if (listings.length === 0) return [];

  const requests = db.prepare(`${REQUEST_SELECT} WHERE d.status IN ('open','in_progress')`).all();
  const matches = [];

  for (const listing of listings) {
    for (const request of requests) {
      if (request.buyer_id === farmerId) continue;
      if (request.crop !== listing.crop) continue;
      const quantityFits = request.quantity_kg <= listing.quantity_kg;
      const priceFits = listing.price_per_kg <= request.max_price_per_kg;
      const regionFits = !request.region || request.region === listing.region;
      if (!priceFits) continue;

      let score = 0;
      score += quantityFits ? 40 : 20;
      const priceHeadroom = (request.max_price_per_kg - listing.price_per_kg) / request.max_price_per_kg;
      score += Math.round(Math.min(1, Math.max(0, priceHeadroom)) * 30);
      if (regionFits) score += 20;
      if (request.grade === listing.grade) score += 10;

      matches.push({
        listing_id: listing.id,
        listing_crop: listing.crop,
        listing_quantity_kg: listing.quantity_kg,
        listing_price_per_kg: listing.price_per_kg,
        listing_region: listing.region,
        request,
        score,
        quantity_fits: quantityFits,
        region_fits: regionFits,
      });
    }
  }

  return matches.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** Open farmer listings that can satisfy a given demand request. */
export function matchListingsForRequest(db, request, { limit = 20 } = {}) {
  const rows = db.prepare(`
    ${LISTING_SELECT}
    WHERE l.status = 'active' AND l.crop = ? AND l.price_per_kg <= ?
    ORDER BY l.created_at DESC
  `).all(request.crop, request.max_price_per_kg);

  return rows
    .filter((l) => l.farmer_id !== request.buyer_id)
    .map((listing) => {
      const quantityFits = request.quantity_kg <= listing.quantity_kg;
      const regionFits = !request.region || request.region === listing.region;
      let score = quantityFits ? 40 : 20;
      score += regionFits ? 25 : 5;
      if (listing.grade === request.grade) score += 15;
      return { listing, score, quantity_fits: quantityFits, region_fits: regionFits };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* Buyer (processor/exporter) dashboard summary                       */
/* ------------------------------------------------------------------ */

export function buyerStats(db, buyerId) {
  const requests = db.prepare(`
    SELECT
      COUNT(*) AS total_requests,
      SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) AS open_requests,
      COALESCE(SUM(CASE WHEN status IN ('open','in_progress') THEN quantity_kg ELSE 0 END), 0)
        AS outstanding_quantity_kg
    FROM demand_requests WHERE buyer_id = ?
  `).get(buyerId);

  const inquiries = db.prepare(`
    SELECT
      COUNT(*) AS total_inquiries,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_inquiries,
      COALESCE(SUM(CASE WHEN status IN ('accepted','completed') THEN quantity_kg ELSE 0 END), 0)
        AS committed_quantity_kg,
      COALESCE(SUM(CASE WHEN status IN ('accepted','completed') THEN quantity_kg * offer_price_per_kg ELSE 0 END), 0)
        AS committed_value_ghs
    FROM inquiries WHERE buyer_id = ?
  `).get(buyerId);

  return { ...requests, ...inquiries };
}

export function isBuyerRole(role) {
  return BUYER_ROLES.includes(role);
}
