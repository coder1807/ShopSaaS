import { Response } from 'express';

// Send cookie from server to client
export const setCookie = (res: Response, name: string, value: string) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie(name, value, {
    httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
    secure: isProduction, // Only secure in production (HTTPS)
    sameSite: isProduction ? 'none' : 'lax', // Cross-site only in production
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  });
};
