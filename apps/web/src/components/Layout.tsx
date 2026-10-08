import clsx from "clsx";
import {
  BookOpen,
  LayoutDashboard,
  LogOut,
  Moon,
  Package,
  Search,
  ShoppingBag,
  Sun,
  User,
} from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import {
  Link,
  NavLink,
  Outlet,
  ScrollRestoration,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router";
import { toast } from "sonner";
import { useAuth } from "../lib/auth";
import { useCart } from "../lib/cart";
import { LINKS } from "../lib/links";
import { useTheme } from "../lib/theme";
import { APP_NAME } from "../lib/useTitle";
import { DemoBanner, ServerWakeBanner } from "./Banners";

function SearchBox({ className }: { className?: string }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const location = useLocation();
  const urlQ = location.pathname === "/books" ? (params.get("q") ?? "") : "";
  const [q, setQ] = useState(urlQ);
  const id = useId();

  // sync with the url (back button, clearing filters)
  const [syncedQ, setSyncedQ] = useState(urlQ);
  if (urlQ !== syncedQ && location.pathname === "/books") {
    setSyncedQ(urlQ);
    setQ(urlQ);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    navigate(q.trim() ? `/books?q=${encodeURIComponent(q.trim())}` : "/books");
  }

  return (
    <form role="search" onSubmit={submit} className={clsx("relative", className)}>
      <label htmlFor={id} className="sr-only">
        Search books
      </label>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400"
        aria-hidden
      />
      <input
        id={id}
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search titles, authors, ISBN…"
        className="input rounded-full pl-9"
      />
    </form>
  );
}

function AccountMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) {
    return (
      <Link to="/login" className="btn-ghost">
        <User className="size-4" aria-hidden />
        <span className="hidden sm:inline">Sign in</span>
      </Link>
    );
  }

  const itemClass =
    "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-stone-100 dark:hover:bg-stone-800";
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="btn-ghost"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="flex size-6 items-center justify-center rounded-full bg-amber-600 text-xs font-semibold text-white">
          {user.name.charAt(0).toUpperCase()}
        </span>
        <span className="hidden max-w-32 truncate sm:inline">{user.name}</span>
      </button>
      {open && (
        <div role="menu" className="card absolute right-0 z-30 mt-2 w-56 p-1 shadow-lg">
          <div className="border-b border-stone-200 px-3 py-2 dark:border-stone-800">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="muted truncate text-xs">{user.email}</p>
          </div>
          <Link role="menuitem" to="/account" className={itemClass} onClick={() => setOpen(false)}>
            <Package className="size-4" aria-hidden /> Orders
          </Link>
          {user.role === "ADMIN" && (
            <Link role="menuitem" to="/admin" className={itemClass} onClick={() => setOpen(false)}>
              <LayoutDashboard className="size-4" aria-hidden /> Admin dashboard
            </Link>
          )}
          <button
            role="menuitem"
            type="button"
            className={itemClass}
            onClick={async () => {
              setOpen(false);
              await logout();
              toast.success("Signed out");
              navigate("/");
            }}
          >
            <LogOut className="size-4" aria-hidden /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function Header() {
  const { count } = useCart();
  const { user } = useAuth();
  const { dark, toggle } = useTheme();
  const navClass = ({ isActive }: { isActive: boolean }) =>
    clsx("btn-ghost hidden md:inline-flex", isActive && "bg-stone-200/60 dark:bg-stone-800");

  return (
    <header className="sticky top-0 z-20 border-b border-stone-200 bg-paper/90 backdrop-blur dark:border-stone-800 dark:bg-stone-950/90">
      <div className="container-page flex h-16 items-center gap-3">
        <Link to="/" className="mr-2 flex items-center gap-2 font-serif text-xl font-bold">
          <BookOpen className="size-6 text-amber-600" aria-hidden />
          {APP_NAME}
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1">
          <NavLink to="/books" className={navClass}>
            Browse
          </NavLink>
          {user?.role === "ADMIN" && (
            <NavLink to="/admin" className={navClass}>
              Admin
            </NavLink>
          )}
        </nav>
        <SearchBox className="ml-auto hidden w-full max-w-sm sm:block" />
        <div className="ml-auto flex items-center gap-1 sm:ml-2">
          <button
            type="button"
            className="btn-ghost px-2"
            onClick={toggle}
            aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
          >
            {dark ? (
              <Sun className="size-4" aria-hidden />
            ) : (
              <Moon className="size-4" aria-hidden />
            )}
          </button>
          <Link
            to="/cart"
            className="btn-ghost relative px-2"
            aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
          >
            <ShoppingBag className="size-5" aria-hidden />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex min-w-5 items-center justify-center rounded-full bg-amber-600 px-1 text-[0.65rem] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
          <AccountMenu />
        </div>
      </div>
      <div className="container-page pb-3 sm:hidden">
        <SearchBox />
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-20 border-t border-stone-200 py-10 dark:border-stone-800">
      <div className="container-page flex flex-col gap-6 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-serif text-lg font-bold">{APP_NAME}</p>
          <p className="muted mt-1 max-w-md">
            Built by{" "}
            <a
              href={LINKS.portfolio}
              className="font-medium text-amber-700 hover:underline dark:text-amber-400"
            >
              Rahul Nainala
            </a>
            . Nothing here is for sale, and the data resets every night.
          </p>
        </div>
        <nav aria-label="Project links" className="flex flex-wrap gap-x-5 gap-y-2">
          <a className="hover:underline" href={LINKS.repo}>
            Source on GitHub
          </a>
          <a className="hover:underline" href={LINKS.apiDocs}>
            API docs
          </a>
          <a className="hover:underline" href={LINKS.projects}>
            More projects
          </a>
        </nav>
      </div>
    </footer>
  );
}

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded bg-white px-3 py-2 focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <ServerWakeBanner />
      <Header />
      <DemoBanner />
      <main id="main" className="container-page min-w-0 flex-1 py-8">
        <Outlet />
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  );
}
