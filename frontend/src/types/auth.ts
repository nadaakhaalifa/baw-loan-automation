export type UserRole = "CUSTOMER" | "MANAGER" | "FINANCE" | "ADMIN";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface CurrentUser {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
}