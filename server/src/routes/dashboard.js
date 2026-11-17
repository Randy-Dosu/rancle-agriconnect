import { Router } from 'express';
import { asyncHandler } from '../http.js';
import * as store from '../store.js';

export function dashboardRouter({ db, requireAuth }) {
  const router = Router();

  router.get('/', requireAuth, asyncHandler((req, res) => {
    const user = store.findUserById(db, req.user.sub);
    const inquiries = store.listInquiriesForUser(db, req.user.sub, user.role);
    const pending = inquiries.filter((i) => i.status === 'pending').length;

    if (user.role === 'farmer') {
      const stats = store.listingStats(db, user.id);
      const matches = store.matchDemandForFarmer(db, user.id, { limit: 5 });
      const myListings = store.searchListings(db, {
        farmerId: user.id, status: '*', limit: 5, offset: 0,
      });
      return res.json({
        role: user.role,
        stats: {
          ...stats,
          total_inquiries: inquiries.length,
          pending_inquiries: pending,
          open_matches: matches.length,
        },
        matches,
        recent_listings: myListings.rows,
        inquiries: inquiries.slice(0, 5),
      });
    }

    const stats = store.buyerStats(db, user.id);
    const myRequests = store.searchDemandRequests(db, {
      buyerId: user.id,
      status: '*',
      limit: 5,
      offset: 0,
    });
    return res.json({
      role: user.role,
      stats: { ...stats, pending_inquiries: pending },
      recent_requests: myRequests.rows,
      inquiries: inquiries.slice(0, 5),
    });
  }));

  return router;
}
