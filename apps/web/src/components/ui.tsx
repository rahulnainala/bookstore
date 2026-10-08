import clsx from "clsx";
import { AlertTriangle, LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";
import { ApiError } from "../api/client";

export function Spinner({ className }: { className?: string }) {
  return <LoaderCircle aria-hidden className={clsx("animate-spin", className ?? "size-4")} />;
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={clsx("animate-pulse rounded-md bg-stone-200 dark:bg-stone-800", className)}
    />
  );
}

export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      {icon && <div className="text-stone-400">{icon}</div>}
      <h2 className="text-xl font-semibold">{title}</h2>
      {children && <div className="muted max-w-md text-sm">{children}</div>}
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message =
    error instanceof ApiError ? error.message : "Something went wrong while loading this page.";
  return (
    <div role="alert" className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
      <AlertTriangle className="size-8 text-amber-600" aria-hidden />
      <p className="font-medium">{message}</p>
      {onRetry && (
        <button type="button" className="btn-secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

const badgeTones = {
  neutral: "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
  amber: "bg-amber-100 text-amber-900 dark:bg-amber-400/15 dark:text-amber-300",
  green: "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300",
  blue: "bg-sky-100 text-sky-800 dark:bg-sky-400/15 dark:text-sky-300",
  red: "bg-red-100 text-red-800 dark:bg-red-400/15 dark:text-red-300",
} as const;

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: keyof typeof badgeTones;
  children: ReactNode;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        badgeTones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Field({
  label,
  error,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  error?: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label">
        {label}
      </label>
      {children}
      {hint && !error && <p className="muted mt-1 text-xs">{hint}</p>}
      {error && (
        <p id={`${htmlFor}-error`} className="mt-1 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
      {children}
    </div>
  );
}
