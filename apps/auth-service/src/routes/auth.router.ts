import express, { Router } from 'express';
import {
  verifyUser,
  userRegistration,
  loginUser,
  userForgotPassword,
  resetUserPassword,
  refreshToken,
  verifyUserForgotPassword,
  getUser,
} from '../controller/auth.controller';
import isAuthenticated from '@packages/middleware/isAuthenticated';

const router: Router = express.Router();

router.post('/user-registration', userRegistration);
router.post('/verify-user', verifyUser);
router.post('/login-user', loginUser);
router.post('/refresh-token-user', refreshToken);
router.get('/logged-in-user', isAuthenticated, getUser);
router.post('/verify-forgot-password-user', verifyUserForgotPassword);
router.post('/forgot-password-user', userForgotPassword);
router.post('/reset-password-user', resetUserPassword);

export default router;
