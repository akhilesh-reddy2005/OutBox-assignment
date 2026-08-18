export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

export interface AuthMeResponse {
  success: boolean;
  user: User;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}
