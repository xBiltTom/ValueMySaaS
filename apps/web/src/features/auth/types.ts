import { LoginResponse, User } from "@/types/api";

export type RegisterPayload = {
  email: string;
  password: string;
  username?: string;
  full_name?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type { LoginResponse, User };
