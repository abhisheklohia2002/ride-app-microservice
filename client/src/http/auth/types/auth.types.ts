import type { UserRole } from "../../../common";


export interface User {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  data: User;
}