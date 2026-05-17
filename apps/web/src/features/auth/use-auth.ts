"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { clearAuthToken, getAuthToken, subscribeToAuthToken } from "@/lib/auth-token";
import { getCurrentUser } from "@/features/auth/api";

export function useCurrentUser({ redirectToLogin = false } = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useSyncExternalStore(subscribeToAuthToken, getAuthToken, () => null);

  useEffect(() => {
    if (redirectToLogin && !token) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, redirectToLogin, router, token]);

  const userQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getCurrentUser,
    enabled: Boolean(token),
  });

  return {
    ...userQuery,
    authToken: token,
    hasToken: Boolean(token),
    isCheckingToken: false,
  };
}

export function useLogout() {
  const router = useRouter();
  return () => {
    clearAuthToken();
    router.replace("/login");
  };
}
