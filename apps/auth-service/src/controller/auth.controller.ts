/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { NextFunction, Request, Response } from 'express';
import {
  checkOtpRestrictions,
  validateRegistrationData,
  trackOtpRequests,
  sendOtp,
  verifyOtp,
  handleForgotPassword,
  verifyForgotPasswordOtp,
} from '../utils/auth.helper';
import prisma from '@packages/libs/prisma';
import { AuthError, ValidationError } from '@packages/error-handler';
import bcrypt from 'bcryptjs';
import jwt, { JsonWebTokenError } from 'jsonwebtoken';
import { setCookie } from '../utils/cookies/setCookies';

// Function to handle user registration
export const userRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    validateRegistrationData(req.body, 'user');
    const { email, name } = req.body;

    const existingUser = await prisma.users.findUnique({ where: { email } });

    if (existingUser) {
      return next(new ValidationError('User already exists with this email!'));
    }

    await checkOtpRestrictions(email, next);
    await trackOtpRequests(email, next);
    await sendOtp(email, name, 'user-activation-mail');

    res
      .status(200)
      .json({ message: 'OTP sent to email. Please verify your account.' });
  } catch (error) {
    next(error);
  }
};

// Function to handle verify user with OTP
export const verifyUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp, password, name } = req.body;
    if (!email || !otp || !password || !name) {
      return next(new ValidationError('All fields are required!'));
    }
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return next(new ValidationError('User already exists with this email!'));
    }

    await verifyOtp(email, otp, next);
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.users.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully!',
    });
  } catch (error) {
    next(error);
  }
};

// Function to handle user login
export const loginUser = async (
  // Function to handle user login
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ValidationError('Email and password are required!'));
    }

    const user = await prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      return next(new AuthError('User dose not exist!'));
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) {
      return next(new AuthError('Invalid email or password!'));
    }

    // Generate access and refresh tokens
    const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
    const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

    if (!accessTokenSecret || !refreshTokenSecret) {
      throw new ValidationError('Token secrets are not configured');
    }

    const accessToken = jwt.sign(
      {
        id: user.id,
        role: 'user',
      },
      accessTokenSecret,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      {
        id: user.id,
        role: 'user',
      },
      refreshTokenSecret,
      { expiresIn: '7d' }
    );

    // Store the access and refresh token in an httpOnly secure cookie
    setCookie(res, 'refresh_token', refreshToken);
    setCookie(res, 'access_token', accessToken);

    res.status(200).json({
      message: 'Login successful!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// Function to retrive access_token from refresh_token in cookies
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
      return next(new ValidationError('Unauthorized! No refresh token.'));
    }

    const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

    if (!refreshTokenSecret) {
      console.error('REFRESH_TOKEN_SECRET is not defined.');
      return next(new Error('Internal server configuration error.'));
    }
    // Verify and decode the refresh token using the secret key from environment variables.
    // The decoded token is expected to contain an 'id' and a 'role' field.
    const decoded = jwt.verify(refreshToken, refreshTokenSecret as string) as {
      id: string;
      role: string;
    };

    if (typeof decoded !== 'object' || !decoded.id || !decoded.role) {
      return next(new JsonWebTokenError('Forbidden! Invalid refresh token.'));
    }

    const user = await prisma.users.findUnique({ where: { id: decoded.id } });

    if (!user) {
      return next(new AuthError('Forbidden! User not found'));
    }

    const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;

    if (!accessTokenSecret) {
      console.error('ACCESS_TOKEN_SECRET is not defined.');
      return next(new Error('Internal server configuration error.'));
    }

    // Create a new access token by signing the user's id and role
    // using the secret key from environment variables.
    const newAccessToken = jwt.sign(
      {
        id: decoded.id,
        role: decoded.role,
      },
      process.env.ACCESS_TOKEN_SECRET as string,
      { expiresIn: '15m' }
    );

    setCookie(res, 'access_token', newAccessToken);
    return res.status(200).json({ success: true });
  } catch (error) {
    return next(error);
  }
};

// Function to get logged in user
export const getUser = async (req: any, res: Response, next: NextFunction) => {
  try {
    const user = req.user; // get user data information from isAuthenticated middleware
    res.status(201).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// Function to handle forgot password
export const userForgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await handleForgotPassword(req, res, next, 'user');
};

// Function to handle verify user with OTP for forgot password
export const verifyUserForgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await verifyForgotPasswordOtp(req, res, next);
};

// Fucntion to handle reset user password
export const resetUserPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return next(new ValidationError('Email and new password are required!'));
    }

    const user = await prisma.users.findUnique({
      where: { email },
    });
    if (!user) {
      return next(new ValidationError('User does not exist!'));
    }

    // Compare the new password with the existing one
    const isSamePassword = await bcrypt.compare(newPassword, user.password!);
    if (isSamePassword) {
      return next(
        new ValidationError('New password cannot be the same as the old one!')
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.users.update({
      where: { email },
      data: { password: hashedPassword },
    });

    res.status(200).json({
      message:
        'Password reset successfully! Please login with your new password.',
    });
  } catch (error) {
    next(error);
  }
};
