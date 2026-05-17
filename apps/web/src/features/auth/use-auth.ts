"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { clearAuthToken, getAuthToken } from "@/lib/auth-token";
import { getCurrentUser } from "@/features/auth/api";

export function useCurrentUser({ redirectToLogin = false } = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const token = getAuthToken();

  useEffect(() => {
    if (redirectToLogin && !token) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, redirectToLogin, router, token]);

  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: getCurrentUser,
    enabled: Boolean(token),
  });
}

export function useLogout() {
  const router = useRouter();
  return () => {
    clearAuthToken();
    router.replace("/login");
  };
}
