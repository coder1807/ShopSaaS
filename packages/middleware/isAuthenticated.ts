/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '@packages/libs/prisma';
import { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';

// Function to confirm that user is authenticated
const isAuthenticated = async (req: any, res: Response, next: NextFunction) => {
  try {
    // token can be sent via cookie (access_token) or header (Authorization: Bearer <token>)
    const token =
      req.cookies.access_token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized! Token missing.' });
    }

    // verify token
    const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
    if (!accessTokenSecret) {
      return res
        .status(500)
        .json({ message: 'Server error: ACCESS_TOKEN_SECRET not set.' });
    }
    const decoded = jwt.verify(token, accessTokenSecret) as {
      id: string;
      role: 'user' | 'seller';
    };

    if (!decoded) {
      return res.status(401).json({
        message: 'Unauthorized! Invalid token.',
      });
    }

    const account = await prisma.users.findUnique({
      where: { id: decoded.id },
    });

    if (!account) {
      return res.status(401).json({ message: 'Account not found! ' });
    }

    // assign user attribute with account object infomation in db to req
    req.user = account;

    // if everything ok, continue send data to next middleware or route
    return next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res
      .status(401)
      .json({ message: 'Unauthorized! Token expired or invalid.' });
  }
};

export default isAuthenticated;
