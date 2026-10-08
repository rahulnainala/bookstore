import { Info, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";

// Render free tier sleeps, first request can take ~a minute
export function ServerWakeBanner() {
  const [state, setState] = useState<"checking" | "slow" | "ready">("checking");

  useEffect(() => {
    let cancelled = false;
    const slowTimer = setTimeout(
      () => !cancelled && setState((s) => (s === "checking" ? "slow" : s)),
      2500,
    );
    const ping = async () => {
      for (let attempt = 0; attempt < 20 && !cancelled; attempt++) {
        try {
          const res = await fetch("/api/health");
          if (res.ok) {
            if (!cancelled) setState("ready");
            return;
          }
        } catch {
          // not up yet
        }
        await new Promise((r) => setTimeout(r, 3000));
      }
    };
    ping();
    return () => {
      cancelled = true;
      clearTimeout(slowTimer);
    };
  }, []);

  if (state !== "slow") return null;
  return (
    <div
      role="status"
      className="bg-amber-100 text-amber-950 dark:bg-amber-400/15 dark:text-amber-200"
    >
      <div className="container-page flex items-center gap-2 py-2 text-sm">
        <LoaderCircle className="size-4 shrink-0 animate-spin" aria-hidden />
        Waking up the server. It's on a free plan that sleeps when nobody's using it, so this can
        take up to a minute.
      </div>
    </div>
  );
}

export function DemoBanner() {
  const { user } = useAuth();
  if (!user?.isDemo) return null;
  return (
    <div className="border-b border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200">
      <div className="container-page flex items-center gap-2 py-2 text-sm">
        <Info className="size-4 shrink-0" aria-hidden />
        <span>
          You're signed in as the shared{" "}
          <strong>demo {user.role === "ADMIN" ? "admin" : "customer"}</strong>. Payments are
          simulated and all changes reset nightly.
        </span>
      </div>
    </div>
  );
}
