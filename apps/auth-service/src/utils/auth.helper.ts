import crypto from 'crypto';
import { AuthError, ValidationError } from '@packages/error-handler';
import { sendEmail } from './sendMail';
import redis from '@packages/libs/redis';
import { Request, Response, NextFunction } from 'express';
import prisma from '@packages/libs/prisma';
import bcrypt from 'bcryptjs';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateRegistrationData = (
  // Function to validate registration data
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

export const checkOtpRestrictions = async (
  // Function to check OTP restrictions
  email: string,
  next: NextFunction
) => {
  if (await redis.get(`otp_lock:${email}`)) {
    // Check if the account is locked due to multiple failed attempts
    return next(
      new ValidationError(
        'Account is locked due to multiple failed attempts. Try again after 30 minutes.'
      )
    );
  }
  if (await redis.get(`otp_spam_lock:${email}`)) {
    // Check if the account is locked due to too many OTP requests
    return next(
      new ValidationError(
        'Too many OTP requests. Please wait 1 hour before requesting again.'
      )
    );
  }
  if (await redis.get(`otp_cooldown:${email}`)) {
    // Check if the cooldown period is active
    return next(
      new ValidationError('Please wait 1 minute before requesting a new OTP.')
    );
  }
};

export const trackOtpRequests = async (email: string, next: NextFunction) => {
  // Function to track OTP requests and apply restrictions
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

export const sendOtp = async (
  // Function to send OTP
  email: string,
  name: string,
  template: string
) => {
  const otp = crypto.randomInt(100000, 999999).toString();
  await sendEmail(email, 'Verify Your Email', template, { name, otp });
  await redis.set(`otp:${email}`, otp, 'EX', 300); // Store OTP in Redis for 5 minutes
  await redis.set(`otp_cooldown:${email}`, 'true', 'EX', 60); // Set cooldown for 1 minute
};

export const verifyOtp = async (
  // Function to verify OTP
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


