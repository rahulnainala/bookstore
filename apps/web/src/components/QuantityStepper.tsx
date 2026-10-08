import { Minus, Plus } from "lucide-react";

export function QuantityStepper({
  value,
  max,
  onChange,
  label,
  disabled,
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <div
      className="inline-flex items-center rounded-lg border border-stone-300 dark:border-stone-700"
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        className="rounded-l-lg p-2 hover:bg-stone-100 disabled:opacity-40 dark:hover:bg-stone-800"
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= 1}
        aria-label="Decrease quantity"
      >
        <Minus className="size-3.5" aria-hidden />
      </button>
      <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="rounded-r-lg p-2 hover:bg-stone-100 disabled:opacity-40 dark:hover:bg-stone-800"
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
      >
        <Plus className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
