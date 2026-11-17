import { Router } from 'express';
import { CROP_SLUGS, GRADES, REGION_NAMES, REQUEST_STATUSES } from '../domain.js';
import {
  asyncHandler, badRequest, forbidden, notFound, pageMeta, parsePagination,
} from '../http.js';
import * as store from '../store.js';
import {
  optionalDate, optionalString, requireEnum, requirePositiveNumber, requireString,
} from '../validate.js';

function readRequestPayload(body, { partial = false } = {}) {
  const out = {};
  const has = (k) => body[k] !== undefined;

  if (!partial || has('crop')) out.crop = requireEnum(body.crop, 'crop', CROP_SLUGS);
  if (!partial || has('grade')) out.grade = requireEnum(body.grade ?? 'A', 'grade', GRADES);
  if (!partial || has('quantity_kg')) {
    out.quantity_kg = requirePositiveNumber(body.quantity_kg, 'quantity_kg');
  }
  if (!partial || has('max_price_per_kg')) {
    out.max_price_per_kg = requirePositiveNumber(body.max_price_per_kg, 'max_price_per_kg');
  }
  if (has('needed_by')) out.needed_by = optionalDate(body.needed_by, 'needed_by');
  if (has('region')) out.region = optionalString(body.region, 'region', { max: 80 });
  if (out.region) out.region = requireEnum(out.region, 'region', REGION_NAMES);
  if (has('notes')) out.notes = optionalString(body.notes, 'notes', { max: 2000 });
  if (has('status')) out.status = requireEnum(body.status, 'status', REQUEST_STATUSES);
  return out;
}

export function demandRouter({ db, requireAuth, requireRole }) {
  const router = Router();

  // Farmers browse open demand so they can respond to buyers directly.
  router.get('/', asyncHandler((req, res) => {
    const pagination = parsePagination(req.query);
    const filters = {
      ...pagination,
      crop: req.query.crop || undefined,
      region: req.query.region || undefined,
      status: req.query.status || undefined,
      search: req.query.search ? requireString(req.query.search, 'search', { max: 120 }) : undefined,
      minQuantity: req.query.min_quantity ? Number(req.query.min_quantity) : undefined,
      buyerId: req.query.buyer_id ? Number(req.query.buyer_id) : undefined,
    };
    if (filters.status && !REQUEST_STATUSES.includes(filters.status)) {
      throw badRequest('Validation failed', [{ field: 'status', message: 'unknown status' }]);
    }
    const { rows, total } = store.searchDemandRequests(db, filters);
    res.json({ data: rows, meta: pageMeta(pagination, total) });
  }));

  router.get('/:id', asyncHandler((req, res) => {
    const request = store.findDemandRequestById(db, Number(req.params.id));
    if (!request) throw notFound('Demand request not found');
    const matches = store.matchListingsForRequest(db, request);
    res.json({ data: request, matches });
  }));

  // Processor / exporter only: publish a sourcing request.
  router.post('/', requireAuth, requireRole('processor', 'exporter'), asyncHandler((req, res) => {
    const payload = readRequestPayload(req.body ?? {});
    const request = store.createDemandRequest(db, req.user.sub, payload);
    res.status(201).json({ data: request });
  }));

  router.patch('/:id', requireAuth, asyncHandler((req, res) => {
    const request = store.findDemandRequestById(db, Number(req.params.id));
    if (!request) throw notFound('Demand request not found');
    if (request.buyer_id !== req.user.sub) throw forbidden('You can only edit your own requests');
    const updated = store.updateDemandRequest(
      db, request.id, readRequestPayload(req.body ?? {}, { partial: true }),
    );
    res.json({ data: updated });
  }));

  router.delete('/:id', requireAuth, asyncHandler((req, res) => {
    const request = store.findDemandRequestById(db, Number(req.params.id));
    if (!request) throw notFound('Demand request not found');
    if (request.buyer_id !== req.user.sub) throw forbidden('You can only delete your own requests');
    store.deleteDemandRequest(db, request.id);
    res.status(204).end();
  }));

  return router;
}
