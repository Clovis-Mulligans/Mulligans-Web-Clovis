import type { User } from './user';

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    display_name: string | null;
  };
}

export interface RegisterData {
  email: string;
  password: string;
  display_name: string;
}

export interface RegisterResponse {
  message: string;
  user_id: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  email: string;
  code: string;
  password: string;
}

export interface VerifyEmailData {
  email: string;
  code: string;
}

export interface ResendVerificationData {
  email: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface AuthProfileResponse {
  user: User;
}
