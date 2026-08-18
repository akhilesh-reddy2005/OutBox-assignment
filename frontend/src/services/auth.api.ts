import api from "./api";
import type { AuthMeResponse, LogoutResponse } from "../types/auth";

export async function getMe(): Promise<AuthMeResponse> {
  const { data } = await api.get<AuthMeResponse>("/api/auth/me");
  return data;
}

export async function logout(): Promise<LogoutResponse> {
  const { data } = await api.post<LogoutResponse>("/api/auth/logout");
  return data;
}

export function getGoogleAuthUrl(): string {
  return `${import.meta.env.VITE_API_URL}/api/auth/google`;
}
