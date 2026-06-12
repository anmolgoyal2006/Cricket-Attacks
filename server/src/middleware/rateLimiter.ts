import rateLimit from 'express-rate-limit';

// General API — 500 requests per 15 min per IP (covers normal gameplay)
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: 'Too many requests, please wait before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// Auth routes — keep tight to prevent brute force
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Pack opening — 20 per minute is generous enough for normal use
export const packLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Too many pack openings, slow down!' },
  standardHeaders: true,
  legacyHeaders: false,
});
