import { Info, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";

/**
 * The free API host sleeps when idle and takes ~30–60s to wake. Ping the health endpoint on load
 * and explain the delay if it's slow, instead of leaving visitors staring at skeletons.
 */
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
          // still waking up
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
        Waking up the demo server. Free hosting sleeps when idle, so the first load can take up to a
        minute.
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
