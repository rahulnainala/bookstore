import clsx from "clsx";
import { useState } from "react";

const palettes = [
  ["#7c2d12", "#fdba74"],
  ["#1e3a8a", "#93c5fd"],
  ["#14532d", "#86efac"],
  ["#581c87", "#d8b4fe"],
  ["#831843", "#f9a8d4"],
  ["#134e4a", "#5eead4"],
  ["#3f3f46", "#e4e4e7"],
] as const;

function hash(text: string) {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h);
}

/**
 * Book cover from Open Library, with a generated typographic cover as fallback. Open Library
 * returns a 1×1 placeholder for unknown ISBNs, so tiny images also count as missing.
 */
export function BookCover({
  src,
  title,
  author,
  className,
  eager,
}: {
  src: string | null;
  title: string;
  author: string;
  className?: string;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(!src);
  const [loaded, setLoaded] = useState(false);
  const [bg, fg] = palettes[hash(title) % palettes.length]!;

  return (
    <div
      className={clsx(
        "relative aspect-[2/3] overflow-hidden rounded-md shadow-sm ring-1 ring-black/5 dark:ring-white/10",
        className,
      )}
      style={{ backgroundColor: bg }}
    >
      {(failed || !loaded) && (
        <div className="absolute inset-0 flex flex-col justify-between p-3" aria-hidden={!failed}>
          <div className="h-px w-8" style={{ backgroundColor: fg }} />
          <div>
            <p
              className="line-clamp-4 font-serif text-sm leading-tight font-bold sm:text-base"
              style={{ color: fg }}
            >
              {title}
            </p>
            <p className="mt-1 line-clamp-1 text-[0.65rem] tracking-wide text-white/70 uppercase">
              {author}
            </p>
          </div>
        </div>
      )}
      {src && !failed && (
        <img
          src={src}
          alt={`Cover of ${title}`}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className={clsx(
            "absolute inset-0 size-full object-cover transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0",
          )}
          onLoad={(e) => {
            if (e.currentTarget.naturalWidth < 10) setFailed(true);
            else setLoaded(true);
          }}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
