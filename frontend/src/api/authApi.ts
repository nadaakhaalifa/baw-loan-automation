import axios from "axios";
import type { CurrentUser, LoginResponse } from "../types/auth";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8001";

type RegisterPayload = {
  full_name: string;
  email: string;
  phone_number: string;
  password: string;
  role: string;
};

type ForgotPasswordResponse = {
  message: string;
};

type ResetPasswordResponse = {
  message: string;
};

export async function login(
  username: string,
  password: string
): Promise<LoginResponse> {
  const formData = new URLSearchParams();

  formData.append("username", username);
  formData.append("password", password);

  const response = await axios.post<LoginResponse>(
    `${API_BASE_URL}/auth/login`,
    formData,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  return response.data;
}

export async function getCurrentUser(token: string): Promise<CurrentUser> {
  const response = await axios.get<CurrentUser>(`${API_BASE_URL}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

export async function registerUser(
  payload: RegisterPayload
): Promise<CurrentUser> {
  const response = await axios.post<CurrentUser>(
    `${API_BASE_URL}/auth/register`,
    payload
  );

  return response.data;
}

export async function sendForgotPasswordCode(
  email: string,
  phoneNumber: string
): Promise<ForgotPasswordResponse> {
  const response = await axios.post<ForgotPasswordResponse>(
    `${API_BASE_URL}/auth/forgot-password/send-code`,
    {
      email,
      phone_number: phoneNumber,
    }
  );

  return response.data;
}

export async function resetPassword(
  email: string,
  phoneNumber: string,
  code: string,
  newPassword: string
): Promise<ResetPasswordResponse> {
  const response = await axios.post<ResetPasswordResponse>(
    `${API_BASE_URL}/auth/forgot-password/reset`,
    {
      email,
      phone_number: phoneNumber,
      code,
      new_password: newPassword,
    }
  );

  return response.data;
}