import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../lib/auth";
import { EmptyState, Spinner } from "./ui";

function Loading() {
  return (
    <div className="flex justify-center py-24">
      <Spinner className="size-6" />
    </div>
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <Loading />;
  if (!user)
    return (
      <Navigate
        to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  return children;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <Loading />;
  if (!user)
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  if (user.role !== "ADMIN") {
    return (
      <EmptyState title="Admins only">
        This area is for store admins. Sign out and use the <strong>demo admin</strong> button on
        the sign-in page to look around.
      </EmptyState>
    );
  }
  return children;
}
