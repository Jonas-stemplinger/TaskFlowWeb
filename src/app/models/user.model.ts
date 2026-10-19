export interface User {
  id: number;
  name: string;
}

export interface CreateUserRequest {
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  id: number;
  name: string;
  email: string;
}