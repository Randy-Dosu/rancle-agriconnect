export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const badRequest = (msg, details) => new HttpError(400, msg, details);
export const unauthorized = (msg = 'Authentication required') => new HttpError(401, msg);
export const forbidden = (msg = 'You do not have access to this resource') => new HttpError(403, msg);
export const notFound = (msg = 'Not found') => new HttpError(404, msg);

/** Wraps async route handlers so rejected promises reach the error middleware. */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export function parsePagination(query) {
  const page = Math.max(1, Number.parseInt(query.page ?? '1', 10) || 1);
  const rawLimit = Number.parseInt(query.limit ?? '12', 10) || 12;
  const limit = Math.min(50, Math.max(1, rawLimit));
  return { page, limit, offset: (page - 1) * limit };
}

export function pageMeta({ page, limit }, total) {
  return { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) };
}
