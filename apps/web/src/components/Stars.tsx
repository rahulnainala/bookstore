import clsx from "clsx";
import { Star } from "lucide-react";

export function Stars({
  value,
  count,
  size = "sm",
}: {
  value: number | null;
  count?: number;
  size?: "sm" | "md";
}) {
  const iconSize = size === "sm" ? "size-3.5" : "size-5";
  if (value === null) {
    return <span className="muted text-xs">No reviews yet</span>;
  }
  return (
    <span
      className="inline-flex items-center gap-1"
      aria-label={`Rated ${value} out of 5${count !== undefined ? ` from ${count} reviews` : ""}`}
    >
      <span className="flex" aria-hidden>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            className={clsx(
              iconSize,
              n <= Math.round(value)
                ? "fill-amber-500 text-amber-500"
                : "fill-transparent text-stone-300 dark:text-stone-600",
            )}
          />
        ))}
      </span>
      <span className="muted text-xs" aria-hidden>
        {value.toFixed(1)}
        {count !== undefined && ` (${count})`}
      </span>
    </span>
  );
}

export function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div role="radiogroup" aria-label="Your rating" className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onClick={() => onChange(n)}
          className="rounded p-0.5"
        >
          <Star
            className={clsx(
              "size-6",
              n <= value ? "fill-amber-500 text-amber-500" : "text-stone-300 dark:text-stone-600",
            )}
          />
        </button>
      ))}
    </div>
  );
}
