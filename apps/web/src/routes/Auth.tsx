import { zodResolver } from "@hookform/resolvers/zod";
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
  type User,
} from "@bookstore/shared";
import { LayoutDashboard, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useForm, type FieldValues, type Path, type UseFormReturn } from "react-hook-form";
import { Link, Navigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { ApiError } from "../api/client";
import { Field, Spinner } from "../components/ui";
import { useAuth } from "../lib/auth";
import { useTitle } from "../lib/useTitle";

// only allow relative redirects
function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

function destination(user: User, next: string) {
  return next === "/" && user.role === "ADMIN" ? "/admin" : next;
}

function applyServerErrors<T extends FieldValues>(form: UseFormReturn<T>, err: unknown) {
  if (err instanceof ApiError && err.details) {
    for (const [field, messages] of Object.entries(err.details)) {
      form.setError(field as Path<T>, { message: messages[0] });
    }
  }
  toast.error(err instanceof ApiError ? err.message : "Something went wrong");
}

// redirect happens via <Navigate> in Login/Register once user is set
function DemoButtons() {
  const { demoLogin } = useAuth();
  const [pending, setPending] = useState<"customer" | "admin" | null>(null);

  async function go(role: "customer" | "admin") {
    setPending(role);
    try {
      const user = await demoLogin(role);
      toast.success(`Signed in as ${user.name}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Demo sign-in failed");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="card bg-amber-50/60 p-5 dark:bg-amber-400/5">
      <p className="text-sm font-semibold">Just looking around?</p>
      <p className="muted mt-1 text-sm">Use a shared demo account. No sign-up needed.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          className="btn-primary py-2.5"
          onClick={() => go("customer")}
          disabled={!!pending}
        >
          {pending === "customer" ? <Spinner /> : <ShoppingBag className="size-4" aria-hidden />}
          Try as demo customer
        </button>
        <button
          type="button"
          className="btn-secondary py-2.5"
          onClick={() => go("admin")}
          disabled={!!pending}
        >
          {pending === "admin" ? <Spinner /> : <LayoutDashboard className="size-4" aria-hidden />}
          Try as demo admin
        </button>
      </div>
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="my-8 flex items-center gap-3 text-xs tracking-wider text-stone-500 uppercase dark:text-stone-400">
      <span className="h-px flex-1 bg-stone-200 dark:bg-stone-800" /> {label}
      <span className="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
    </div>
  );
}

export function Login() {
  useTitle("Sign in");
  const { user, login } = useAuth();
  const next = safeNext(useSearchParams()[0].get("next"));
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const { errors, isSubmitting } = form.formState;

  if (user) return <Navigate to={destination(user, next)} replace />;

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-center text-3xl font-bold">Sign in</h1>
      <DemoButtons />
      <Divider label="or use your own account" />
      <form
        noValidate
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            const u = await login(values);
            toast.success(`Welcome back, ${u.name}`);
          } catch (err) {
            applyServerErrors(form, err);
          }
        })}
      >
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="input"
            aria-invalid={!!errors.email}
            {...form.register("email")}
          />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="input"
            aria-invalid={!!errors.password}
            {...form.register("password")}
          />
        </Field>
        <button type="submit" className="btn-accent w-full py-2.5" disabled={isSubmitting}>
          {isSubmitting && <Spinner />} Sign in
        </button>
      </form>
      <p className="muted mt-6 text-center text-sm">
        New here?{" "}
        <Link
          to={`/register?next=${encodeURIComponent(next)}`}
          className="font-medium text-amber-700 hover:underline dark:text-amber-400"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}

export function Register() {
  useTitle("Create an account");
  const { user, register } = useAuth();
  const next = safeNext(useSearchParams()[0].get("next"));
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });
  const { errors, isSubmitting } = form.formState;

  if (user) return <Navigate to={destination(user, next)} replace />;

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-center text-3xl font-bold">Create an account</h1>
      <form
        noValidate
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            const u = await register(values);
            toast.success(`Welcome to Folio, ${u.name}!`);
          } catch (err) {
            applyServerErrors(form, err);
          }
        })}
      >
        <Field label="Name" htmlFor="name" error={errors.name?.message}>
          <input
            id="name"
            autoComplete="name"
            className="input"
            aria-invalid={!!errors.name}
            {...form.register("name")}
          />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="input"
            aria-invalid={!!errors.email}
            {...form.register("email")}
          />
        </Field>
        <Field
          label="Password"
          htmlFor="password"
          error={errors.password?.message}
          hint="At least 8 characters"
        >
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            className="input"
            aria-invalid={!!errors.password}
            {...form.register("password")}
          />
        </Field>
        <button type="submit" className="btn-accent w-full py-2.5" disabled={isSubmitting}>
          {isSubmitting && <Spinner />} Create account
        </button>
      </form>
      <Divider label="or skip sign-up" />
      <DemoButtons />
      <p className="muted mt-6 text-center text-sm">
        Already have an account?{" "}
        <Link
          to={`/login?next=${encodeURIComponent(next)}`}
          className="font-medium text-amber-700 hover:underline dark:text-amber-400"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
