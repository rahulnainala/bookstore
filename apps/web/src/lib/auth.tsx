import { createContext, use, useCallback, useMemo, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { LoginInput, RegisterInput, User } from "@bookstore/shared";
import { api, ApiError, v1 } from "../api/client";
import { keys } from "../api/hooks";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  demoLogin: (role: "customer" | "admin") => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const me = useQuery({
    queryKey: keys.me,
    queryFn: async () => {
      try {
        return (await api<{ user: User }>(v1("/auth/me"))).user;
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return null;
        throw err;
      }
    },
    staleTime: Infinity,
  });

  const signedIn = useCallback(
    (user: User) => {
      queryClient.setQueryData(keys.me, user);
      // Anything user-specific (cart, orders, admin data) must be refetched for the new session.
      queryClient.removeQueries({ queryKey: keys.cart });
      queryClient.removeQueries({ queryKey: ["orders"] });
      queryClient.removeQueries({ queryKey: ["admin"] });
      return user;
    },
    [queryClient],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user: me.data ?? null,
      isLoading: me.isLoading,
      login: async (input) =>
        signedIn(
          (await api<{ user: User }>(v1("/auth/login"), { method: "POST", body: input })).user,
        ),
      register: async (input) =>
        signedIn(
          (await api<{ user: User }>(v1("/auth/register"), { method: "POST", body: input })).user,
        ),
      demoLogin: async (role) =>
        signedIn(
          (await api<{ user: User }>(v1("/auth/demo"), { method: "POST", body: { role } })).user,
        ),
      logout: async () => {
        await api(v1("/auth/logout"), { method: "POST" });
        queryClient.setQueryData(keys.me, null);
        queryClient.removeQueries({ queryKey: keys.cart });
        queryClient.removeQueries({ queryKey: ["orders"] });
        queryClient.removeQueries({ queryKey: ["admin"] });
      },
    }),
    [me.data, me.isLoading, queryClient, signedIn],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
