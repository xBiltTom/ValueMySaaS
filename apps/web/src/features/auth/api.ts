"use client";

import { apiClient } from "@/lib/api-client";
import { LoginPayload, LoginResponse, RegisterPayload, User } from "@/features/auth/types";

export async function login(payload: LoginPayload) {
  const form = new URLSearchParams();
  form.set("username", payload.email);
  form.set("password", payload.password);

  const { data } = await apiClient.post<LoginResponse>("/auth/login", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return data;
}

export async function register(payload: RegisterPayload) {
  const cleanPayload = {
    email: payload.email,
    password: payload.password,
    username: payload.username || undefined,
    full_name: payload.full_name || undefined,
  };
  const { data } = await apiClient.post<User>("/auth/register", cleanPayload);
  return data;
}

export async function getCurrentUser() {
  const { data } = await apiClient.get<User>("/auth/me");
  return data;
}
