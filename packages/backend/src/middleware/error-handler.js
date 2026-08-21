import { HttpError } from '../errors.js';

const POSTGRES_FOREIGN_KEY_VIOLATION = '23503';
const POSTGRES_UNIQUE_VIOLATION = '23505';

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }
  if (err.code === POSTGRES_FOREIGN_KEY_VIOLATION) {
    res.status(400).json({ error: 'Invalid reference to a related resource' });
    return;
  }
  if (err.code === POSTGRES_UNIQUE_VIOLATION) {
    res.status(409).json({ error: 'Resource already exists' });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}
