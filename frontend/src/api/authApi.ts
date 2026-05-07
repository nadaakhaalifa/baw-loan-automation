import axios from "axios";
import type { CurrentUser, LoginResponse } from "../types/auth";

const API_BASE_URL = "http://127.0.0.1:8001";

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