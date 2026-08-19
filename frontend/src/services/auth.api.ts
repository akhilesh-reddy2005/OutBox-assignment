import api from "./api";
import type { AuthMeResponse, LogoutResponse, LoginResponse, RegisterResponse } from "../types/auth";

export async function getMe(): Promise<AuthMeResponse> {
  const { data } = await api.get<AuthMeResponse>("/api/auth/me");
  return data;
}

export async function logout(): Promise<LogoutResponse> {
  const { data } = await api.post<LogoutResponse>("/api/auth/logout");
  return data;
}

export async function loginWithEmailPassword(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/api/auth/login", { email, password });
  return data;
}

export async function registerWithEmailPassword(name: string, email: string, password: string): Promise<RegisterResponse> {
  const { data } = await api.post<RegisterResponse>("/api/auth/register", { name, email, password });
  return data;
}

export function getGoogleAuthUrl(): string {
  return `${import.meta.env.VITE_API_URL}/api/auth/google`;
}
