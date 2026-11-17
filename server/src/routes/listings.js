import { Router } from 'express';
import { CROP_SLUGS, GRADES, LISTING_STATUSES, REGION_NAMES } from '../domain.js';
import {
  asyncHandler, badRequest, forbidden, notFound, pageMeta, parsePagination,
} from '../http.js';
import * as store from '../store.js';
import {
  optionalDate, optionalString, requireEnum, requirePositiveNumber, requireString,
} from '../validate.js';

function readListingPayload(body, { partial = false } = {}) {
  const out = {};
  const has = (k) => body[k] !== undefined;

  if (!partial || has('crop')) out.crop = requireEnum(body.crop, 'crop', CROP_SLUGS);
  if (!partial || has('grade')) out.grade = requireEnum(body.grade ?? 'A', 'grade', GRADES);
  if (!partial || has('quantity_kg')) {
    out.quantity_kg = requirePositiveNumber(body.quantity_kg, 'quantity_kg');
  }
  if (!partial || has('price_per_kg')) {
    out.price_per_kg = requirePositiveNumber(body.price_per_kg, 'price_per_kg');
  }
  if (!partial || has('region')) out.region = requireEnum(body.region, 'region', REGION_NAMES);
  if (has('town')) out.town = optionalString(body.town, 'town', { max: 120 });
  if (has('available_from')) out.available_from = optionalDate(body.available_from, 'available_from');
  if (has('harvest_date')) out.harvest_date = optionalDate(body.harvest_date, 'harvest_date');
  if (has('description')) out.description = optionalString(body.description, 'description', { max: 2000 });
  if (has('status')) out.status = requireEnum(body.status, 'status', LISTING_STATUSES);
  return out;
}

export function listingsRouter({ db, requireAuth, requireRole }) {
  const router = Router();

  // Public marketplace search.
  router.get('/', asyncHandler((req, res) => {
    const pagination = parsePagination(req.query);
    const filters = {
      ...pagination,
      crop: req.query.crop || undefined,
      region: req.query.region || undefined,
      grade: req.query.grade || undefined,
      status: req.query.status || undefined,
      search: req.query.search ? requireString(req.query.search, 'search', { max: 120 }) : undefined,
      sort: req.query.sort || undefined,
      maxPrice: req.query.max_price ? Number(req.query.max_price) : undefined,
      minQuantity: req.query.min_quantity ? Number(req.query.min_quantity) : undefined,
      farmerId: req.query.farmer_id ? Number(req.query.farmer_id) : undefined,
    };
    if (filters.crop && !CROP_SLUGS.includes(filters.crop)) {
      throw badRequest('Validation failed', [{ field: 'crop', message: 'unknown crop' }]);
    }
    const { rows, total } = store.searchListings(db, filters);
    res.json({ data: rows, meta: pageMeta(pagination, total) });
  }));

  router.get('/:id', asyncHandler((req, res) => {
    const listing = store.findListingById(db, Number(req.params.id));
    if (!listing) throw notFound('Listing not found');
    res.json({ data: listing });
  }));

  // Farmer-only: publish a listing.
  router.post('/', requireAuth, requireRole('farmer'), asyncHandler((req, res) => {
    const payload = readListingPayload(req.body ?? {});
    const listing = store.createListing(db, req.user.sub, payload);
    res.status(201).json({ data: listing });
  }));

  router.patch('/:id', requireAuth, asyncHandler((req, res) => {
    const listing = store.findListingById(db, Number(req.params.id));
    if (!listing) throw notFound('Listing not found');
    if (listing.farmer_id !== req.user.sub) throw forbidden('You can only edit your own listings');
    const updated = store.updateListing(db, listing.id, readListingPayload(req.body ?? {}, { partial: true }));
    res.json({ data: updated });
  }));

  router.delete('/:id', requireAuth, asyncHandler((req, res) => {
    const listing = store.findListingById(db, Number(req.params.id));
    if (!listing) throw notFound('Listing not found');
    if (listing.farmer_id !== req.user.sub) throw forbidden('You can only delete your own listings');
    store.deleteListing(db, listing.id);
    res.status(204).end();
  }));

  return router;
}
