/* eslint-disable @typescript-eslint/no-unused-vars */
import crypto from 'crypto';
import { ValidationError } from '@packages/error-handler';
import { sendEmail } from './sendMail';
import redis from '@packages/libs/redis';
import { Request, Response, NextFunction } from 'express';
import prisma from '@packages/libs/prisma';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Function to validate registration data
export const validateRegistrationData = (
  data: any,
  userType: 'user' | 'seller'
) => {
  const { name, email, password, phone_number, country } = data;

  if (
    !name ||
    !email ||
    !password ||
    (userType === 'seller' && (!phone_number || !country))
  ) {
    throw new ValidationError('Missing required fields!');
  }

  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format!');
  }
};

// Function to check OTP restrictions
export const checkOtpRestrictions = async (
  email: string,
  next: NextFunction
) => {
  // Check if the account is locked due to multiple failed attempts
  if (await redis.get(`otp_lock:${email}`)) {
    return next(
      new ValidationError(
        'Account is locked due to multiple failed attempts. Try again after 30 minutes.'
      )
    );
  }
  // Check if the account is locked due to too many OTP requests
  if (await redis.get(`otp_spam_lock:${email}`)) {
    return next(
      new ValidationError(
        'Too many OTP requests. Please wait 1 hour before requesting again.'
      )
    );
  }
  // Check if the cooldown period is active
  if (await redis.get(`otp_cooldown:${email}`)) {
    return next(
      new ValidationError('Please wait 1 minute before requesting a new OTP.')
    );
  }
};

// Function to track OTP requests and apply restrictions
export const trackOtpRequests = async (email: string, next: NextFunction) => {
  const otpRequestKey = `otp_request_count:${email}`;
  const otpRequests = parseInt((await redis.get(otpRequestKey)) || '0'); // Get the current count of OTP requests or default to 0

  if (otpRequests >= 4) {
    await redis.set(`otp_spam_lock:${email}`, 'lock', 'EX', 3600); // Lock for 1 hour
    return next(
      new ValidationError(
        'Too many OTP requests. Please wait 1 hour before requesting again.'
      )
    );
  }

  await redis.set(otpRequestKey, otpRequests + 1, 'EX', 3600); // Increment the count and set expiration for 1 hour
};

// Function to send OTP
export const sendOtp = async (
  email: string,
  name: string,
  template: string
) => {
  const otp = crypto.randomInt(100000, 999999).toString();
  await sendEmail(email, 'Verify Your Email', template, { name, otp });
  await redis.set(`otp:${email}`, otp, 'EX', 300); // Store OTP in Redis for 5 minutes
  await redis.set(`otp_cooldown:${email}`, 'true', 'EX', 60); // Set cooldown for 1 minute
};

// Function to verify OTP
export const verifyOtp = async (
  email: string,
  otp: string,
  next: NextFunction
) => {
  const storedOtp = await redis.get(`otp:${email}`);
  if (!storedOtp) {
    throw new ValidationError('OTP has expired or does not exist!');
  }

  const failedAttemptsKey = `otp_attempts:${email}`;
  const failedAttempts = parseInt((await redis.get(failedAttemptsKey)) || '0');

  if (storedOtp !== otp) {
    if (failedAttempts >= 4) {
      await redis.set(`otp_lock:${email}`, 'locked', 'EX', 1800); // Lock for 30 minutes
      await redis.del(`otp:${email}`, failedAttemptsKey); // Clear OTP and failed attempts
      throw new ValidationError(
        'Too many failed attempts. Your account is locked for 30 minutes!'
      );
    }
    await redis.set(failedAttemptsKey, failedAttempts + 1, 'EX', 300); // Increment failed attempts and set expiration for 5 minutes
    throw new ValidationError(
      `Incorrect OTP. You have ${4 - failedAttempts} attempts left.`
    );
  }
  await redis.del(`otp:${email}`, failedAttemptsKey); // Clear OTP and failed attempts on successful verification
};

// Function to handle forgot password
export const handleForgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
  userType: 'user' | 'seller'
) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new ValidationError('Email is required!');
    }

    // Find user or seller in database
    const user =
      userType === 'user' &&
      (await prisma.users.findUnique({
        where: { email },
      }));

    if (!user) {
      throw new ValidationError(`${userType} does not exist!`);
    }

    // Check OTP restrictions
    await checkOtpRestrictions(email, next);
    await trackOtpRequests(email, next);

    // Generate OTP and send Email
    await sendOtp(email, user.name, 'forgot-password-user-mail');

    res.status(200).json({
      message: 'OTP sent to your email. Please verify your account.',
    });
  } catch (error) {
    next(error);
  }
};

// Function to handle verify forgot password OTP
export const verifyForgotPasswordOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      throw new ValidationError('Email and OTP are required!');
    }
    await verifyOtp(email, otp, next);

    res.status(200).json({
      message: 'OTP verified successfully. You can now reset your password.',
    });
  } catch (error) {
    next(error);
  }
};
