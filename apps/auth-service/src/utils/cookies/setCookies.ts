import { Response } from 'express';

// Send cookie from server to client
export const setCookie = (res: Response, name: string, value: string) => {
  res.cookie(name, value, {
    httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
    secure: true, // Set to true if using HTTPS
    sameSite: 'none', // Allows cross-site cookie usage
    maxAge: 7 * 24 * 60 * 60 * 1000, // store cookie for 7 days
  });
};
