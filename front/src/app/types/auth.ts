export interface LoginRequest {
  email: string;
}

export interface VerifyCodeRequest {
  email: string;
  code: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface User {
  id: string;
  email: string;
  role: string;
  is_activated: boolean;
  username?: string; // Optional username field
  created_at: string;
  updated_at: string;
}
