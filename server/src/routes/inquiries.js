import { Router } from 'express';
import { INQUIRY_STATUSES } from '../domain.js';
import { asyncHandler, badRequest, forbidden, notFound } from '../http.js';
import * as store from '../store.js';
import { optionalString, requireEnum, requirePositiveNumber } from '../validate.js';

/** Only the transitions that make business sense are allowed. */
const ALLOWED_TRANSITIONS = {
  pending: ['accepted', 'declined'],
  accepted: ['completed'],
  declined: [],
  completed: [],
};

export function inquiriesRouter({ db, requireAuth }) {
  const router = Router();

  router.get('/', requireAuth, asyncHandler((req, res) => {
    const status = req.query.status;
    if (status && !INQUIRY_STATUSES.includes(status)) {
      throw badRequest('Validation failed', [{ field: 'status', message: 'unknown status' }]);
    }
    const rows = store.listInquiriesForUser(db, req.user.sub, req.user.role, { status });
    res.json({ data: rows });
  }));

  /**
   * Creates an inquiry. Two directions are supported:
   *  - a processor/exporter inquiring on a farmer listing (listing_id)
   *  - a farmer responding to an open demand request (request_id)
   */
  router.post('/', requireAuth, asyncHandler((req, res) => {
    const body = req.body ?? {};
    const quantity = requirePositiveNumber(body.quantity_kg, 'quantity_kg');
    const offer = requirePositiveNumber(body.offer_price_per_kg, 'offer_price_per_kg');
    const message = optionalString(body.message, 'message', { max: 2000 });

    if (body.listing_id) {
      const listing = store.findListingById(db, Number(body.listing_id));
      if (!listing) throw notFound('Listing not found');
      if (listing.status !== 'active') throw badRequest('This listing is no longer available');
      if (listing.farmer_id === req.user.sub) throw badRequest('You cannot inquire on your own listing');

      const inquiry = store.createInquiry(db, {
        listing_id: listing.id,
        buyer_id: req.user.sub,
        farmer_id: listing.farmer_id,
        quantity_kg: quantity,
        offer_price_per_kg: offer,
        message,
      });
      return res.status(201).json({ data: inquiry });
    }

    if (body.request_id) {
      const request = store.findDemandRequestById(db, Number(body.request_id));
      if (!request) throw notFound('Demand request not found');
      if (!['open', 'in_progress'].includes(request.status)) {
        throw badRequest('This demand request is no longer open');
      }
      if (req.user.role !== 'farmer') throw forbidden('Only farmers can respond to demand requests');
      if (request.buyer_id === req.user.sub) throw badRequest('You cannot respond to your own request');

      const inquiry = store.createInquiry(db, {
        request_id: request.id,
        buyer_id: request.buyer_id,
        farmer_id: req.user.sub,
        quantity_kg: quantity,
        offer_price_per_kg: offer,
        message,
      });
      return res.status(201).json({ data: inquiry });
    }

    throw badRequest('Validation failed', [
      { field: 'listing_id', message: 'provide either listing_id or request_id' },
    ]);
  }));

  router.patch('/:id', requireAuth, asyncHandler((req, res) => {
    const inquiry = store.findInquiryById(db, Number(req.params.id));
    if (!inquiry) throw notFound('Inquiry not found');

    const nextStatus = requireEnum(req.body?.status, 'status', INQUIRY_STATUSES);
    const isFarmer = inquiry.farmer_id === req.user.sub;
    const isBuyer = inquiry.buyer_id === req.user.sub;
    if (!isFarmer && !isBuyer) throw forbidden('You are not part of this inquiry');

    // Farmers accept/decline; buyers mark accepted deals as completed.
    if (['accepted', 'declined'].includes(nextStatus) && !isFarmer) {
      throw forbidden('Only the farmer can accept or decline an inquiry');
    }
    if (nextStatus === 'completed' && !isBuyer) {
      throw forbidden('Only the buyer can mark a deal as completed');
    }
    if (!ALLOWED_TRANSITIONS[inquiry.status]?.includes(nextStatus)) {
      throw badRequest(`Cannot change an inquiry from "${inquiry.status}" to "${nextStatus}"`);
    }

    const updated = store.updateInquiryStatus(db, inquiry.id, nextStatus);
    res.json({ data: updated });
  }));

  return router;
}
