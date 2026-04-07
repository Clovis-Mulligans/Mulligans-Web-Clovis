import { apiClient } from '../client';
import type {
  LoginData,
  LoginResponse,
  RegisterData,
  RegisterResponse,
  ForgotPasswordData,
  ResetPasswordData,
  VerifyEmailData,
  ResendVerificationData,
  ChangePasswordData,
  AuthProfileResponse,
} from '../types/auth';

/** POST /api/auth/login */
export function login(data: LoginData) {
  return apiClient.post<LoginResponse>('/api/auth/login', data);
}

/** POST /api/auth/register */
export function register(data: RegisterData) {
  return apiClient.post<RegisterResponse>('/api/auth/register', data);
}

/** POST /api/auth/verify-email */
export function verifyEmail(data: VerifyEmailData) {
  return apiClient.post<{ message: string; accessToken: string }>('/api/auth/verify-email', data);
}

/** POST /api/auth/resend-verification */
export function resendVerification(data: ResendVerificationData) {
  return apiClient.post<{ message: string }>('/api/auth/resend-verification', data);
}

/** POST /api/auth/forgot-password */
export function forgotPassword(data: ForgotPasswordData) {
  return apiClient.post<{ message: string }>('/api/auth/forgot-password', data);
}

/** POST /api/auth/reset-password */
export function resetPassword(data: ResetPasswordData) {
  return apiClient.post<{ message: string }>('/api/auth/reset-password', data);
}

/** POST /api/auth/change-password (requires auth) */
export function changePassword(data: ChangePasswordData) {
  return apiClient.post<{ message: string }>('/api/auth/change-password', data);
}

/** GET /api/auth/profile (requires auth) */
export function getAuthProfile() {
  return apiClient.get<AuthProfileResponse>('/api/auth/profile');
}
