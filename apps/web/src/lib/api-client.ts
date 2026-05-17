"use client";

import axios, { AxiosError } from "axios";
import { clearAuthToken, getAuthToken } from "@/lib/auth-token";

const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const API_BASE_URL = `${rawBaseUrl.replace(/\/$/, "")}/api/v1`;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: string }>) => {
    if (error.response?.status === 401) {
      clearAuthToken();
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError<{ detail?: string }>(error)) {
    return error.response?.data?.detail || error.message;
  }
  if (error instanceof Error) return error.message;
  return "No se pudo completar la solicitud.";
}
