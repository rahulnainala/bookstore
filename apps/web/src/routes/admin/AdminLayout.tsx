import clsx from "clsx";
import { NavLink, Outlet } from "react-router";
import { RequireAdmin } from "../../components/guards";

const tabs = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/books", label: "Books" },
  { to: "/admin/authors", label: "Authors & genres" },
  { to: "/admin/orders", label: "Orders" },
];

export default function AdminLayout() {
  return (
    <RequireAdmin>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Store admin</h1>
        <nav
          aria-label="Admin"
          className="flex gap-1 overflow-x-auto rounded-lg bg-stone-200/60 p-1 dark:bg-stone-800"
        >
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                clsx(
                  "rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap",
                  isActive
                    ? "bg-white shadow-sm dark:bg-stone-950"
                    : "text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100",
                )
              }
            >
              {t.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <Outlet />
    </RequireAdmin>
  );
}
