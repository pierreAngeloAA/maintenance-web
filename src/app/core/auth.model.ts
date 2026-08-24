export interface AuthUser {
  id: number;
  email: string;
  name: string | null;
  createdAt: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export interface Credentials {
  email: string;
  password: string;
}

export interface RegistrationInput extends Credentials {
  name?: string | null;
}
