/* eslint-disable @nx/enforce-module-boundaries */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import axios, { AxiosError } from 'axios';
import { countries } from 'apps/seller-ui/src/utils/countries';
import Link from 'next/link';

const Signup = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [timer, setTimer] = useState(60);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [userData, setUserData] = useState<FormData | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const startResendTimer = () => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  };

  const signupMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/user-registration`,
        data
      );
      return response.data;
    },
    // _ represent the response.data but unused
    onSuccess: (_, formData) => {
      setUserData(formData);
      setShowOtp(true);
      setCanResend(false);
      setTimer(60);
      startResendTimer();
    },
    onError: (error) => {
      console.error('Signup failed:', error.message);
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      if (!userData) {
        throw new Error('User data not available for OTP verification.');
      }
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/verify-user`,
        {
          ...userData,
          otp: otp.join(''), // concatenate arrays into strings to send to server
        }
      );
      return response.data;
    },
    onSuccess: () => {
      router.push('/login');
    },
  });

  const onSubmit = (data: any) => {
    signupMutation.mutate(data);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // if value exist and index is not final
    if (value && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    // if user press backspace and otp empty then focus previous input
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const resendOtp = () => {
    if (userData) {
      signupMutation.mutate(userData);
    }
  };

  return (
    <div className="w-full flex flex-col items-center pt-10 min-h-screen">
      {/* Stepper */}
      <div className="relative flex items-center justify-between md:w-[50%] mb-8">
        <div className="absolute top-[25%] left-0 w-[80%] md:w-[93%] h-1 bg-gray-300 -z-10" />
        {[1, 2, 3].map((step) => (
          <div key={step}>
            <div
              className={`w-10 h-10 flex items-center justify-center rounded-full text-white font-bold ${
                step <= activeStep ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              {step}
            </div>
            <span className="ml-[-25px]">
              {step === 1
                ? 'Create Account'
                : step === 2
                ? 'Setup Shop'
                : 'Connect Bank'}
            </span>
          </div>
        ))}
      </div>

      {/* Step content*/}
      <div className="md:w-[480px] p-8 bg-white shadow-2xl rounded-lg">
        {activeStep === 1 && (
          <>
            {!showOtp ? (
              <form onSubmit={handleSubmit(onSubmit)}>
                <h3 className="text-2xl font-semibold text-center mb-4">
                  Create Account
                </h3>
                <label className="block text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  placeholder="coder1873"
                  className="w-full p-2 border border-gray-300 outline-0 !rounded mb-1"
                  {...register('name', {
                    required: 'Name is required',
                  })}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm">
                    {String(errors.name.message)}
                  </p>
                )}

                <label className="block text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="example@gmail.com"
                  className="w-full p-2 border border-gray-300 outline-0 !rounded mb-1"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value:
                        /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
                      message: 'Invalid email address',
                    },
                  })}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm">
                    {String(errors.email.message)}
                  </p>
                )}

                <label className="block text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+84 123 456 789"
                  className="w-full p-2 border border-gray-300 outline-0 rounded-[4px] mb-1"
                  {...register('phone_number', {
                    required: 'Phone Number is required',
                    pattern: {
                      value: /^\+[1-9]\d{1,14}$/, // Follows E.164 format
                      message: 'Invalid phone number format',
                    },
                    minLength: {
                      value: 10,
                      message: 'Phone number must be at least 10 digits',
                    },
                    maxLength: {
                      value: 15,
                      message: 'Phone number cannot exceed 15 digits',
                    },
                  })}
                />

                {errors.phone_number && (
                  <p className="text-red-500 text-sm">
                    {String(errors.phone_number.message)}
                  </p>
                )}

                <label className="block text-gray-700 mb-1">Country</label>
                <select
                  className="w-full p-2 border border-gray-300 outlinet-0 rounded-[4px]"
                  {...register('country', { required: 'Country is required' })}
                >
                  <option value="">Select your country</option>
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>

                {errors.country && (
                  <p className="text-red-500 text-sm">
                    {String(errors.country.message)}
                  </p>
                )}

                <label className="block text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={passwordVisible ? 'text' : 'password'}
                    placeholder="Min 8 characters"
                    className="w-full p-2 border border-gray-300 outline-0 !rounded mb-1"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 8,
                        message: 'Password must be at least 8 characters',
                      },
                    })}
                  />

                  <button
                    type="button"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400"
                  >
                    {passwordVisible ? <Eye /> : <EyeOff />}
                  </button>
                  {errors.password && (
                    <p className="text-red-500 text-sm">
                      {String(errors.password.message)}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={signupMutation.isPending}
                  className="w-full text-lg cursor-pointer mt-4 bg-black text-white py-2 rounded-lg"
                >
                  {signupMutation.isPending ? ' Signing up ... ' : 'Sign Up'}
                </button>

                {signupMutation.isError &&
                  signupMutation.error instanceof AxiosError && (
                    <p className="text-red-500 text-sm mt-2">
                      {signupMutation.error.response?.data?.message ||
                        signupMutation.error.message}
                    </p>
                  )}

                <p className="pt-3 text-center">
                  {'Already have an account?'}
                  <Link href="/login" className="text-blue-500 ml-1">
                    Login
                  </Link>
                </p>
              </form>
            ) : (
              <div>
                <h3 className="text-xl font-semibold text-center mb-4">
                  Enter OTP
                </h3>
                <div className="flex justify-center gap-6">
                  {otp?.map((digit, index) => (
                    <input
                      key={index}
                      type="text"
                      ref={(el) => {
                        if (el) inputRefs.current[index] = el; // param el represent for HTMLInputElemt or null
                      }}
                      maxLength={1}
                      className="w-12 h-12 text-center border border-gray-300 outline-none rounded-xl"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    />
                  ))}
                </div>

                <button
                  className="w-full mt-4 text-lg cursor-pointer bg-blue-500 text-white py-2 rounded-lg"
                  disabled={verifyOtpMutation.isPending}
                  onClick={() => verifyOtpMutation.mutate()}
                >
                  {verifyOtpMutation.isPending ? 'Verifying ...' : 'Verify OTP'}
                </button>

                <p className="text-center text-sm mt-4">
                  {canResend ? (
                    <button
                      onClick={resendOtp}
                      className="text-blue-500 cursor-pointer"
                    >
                      Resend OTP
                    </button>
                  ) : (
                    `Resend OTP in ${timer}s`
                  )}
                </p>
                {verifyOtpMutation.isError &&
                  verifyOtpMutation.error instanceof AxiosError && (
                    <p className="text-center text-red-500 text-sm mt-2">
                      {verifyOtpMutation.error.response?.data?.message ||
                        verifyOtpMutation.error.message}
                    </p>
                  )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Signup;
