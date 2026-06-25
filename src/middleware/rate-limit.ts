import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    data: null,
    error: { message: 'Too many requests, please try again later.' },
  },
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    data: null,
    error: { message: 'Too many requests, please try again later.' },
  },
});
