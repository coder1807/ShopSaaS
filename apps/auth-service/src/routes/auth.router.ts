import express, { Router } from 'express';
import {
  verifyUser,
  userRegistration,
  loginUser,
  userForgotPassword,
  resetUserPassword,
} from '../controller/auth.controller';
import { verifyForgotPasswordOtp } from '../utils/auth.helper';

const router: Router = express.Router();

router.post('/user-registration', userRegistration);
router.post('/verify-user', verifyUser);
router.post('/login-user', loginUser);
router.post('/verify-forgot-password-user', verifyForgotPasswordOtp);
router.post('/forgot-password-user', userForgotPassword);
router.post('/reset-password-user', resetUserPassword);

export default router;
