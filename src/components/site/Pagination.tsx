import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = pageWindow(page, totalPages);

  function go(p: number) {
    if (p < 1 || p > totalPages || p === page) return;
    onChange(p);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const btn =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-border bg-card px-3 text-sm font-medium transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <nav
      aria-label="Pagination"
      className="mt-10 flex flex-wrap items-center justify-center gap-2"
    >
      <button
        type="button"
        onClick={() => go(page - 1)}
        disabled={page <= 1}
        className={btn}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-sm text-muted-foreground">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => go(p)}
            aria-current={p === page ? "page" : undefined}
            className={
              p === page
                ? "inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-primary px-3 text-sm font-semibold text-primary-foreground shadow"
                : btn
            }
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => go(page + 1)}
        disabled={page >= totalPages}
        className={btn}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}

function pageWindow(current: number, total: number): (number | "…")[] {
  const out: (number | "…")[] = [];
  const add = (v: number | "…") => out.push(v);
  const range = (a: number, b: number) => {
    for (let i = a; i <= b; i++) add(i);
  };
  if (total <= 7) {
    range(1, total);
    return out;
  }
  add(1);
  if (current > 4) add("…");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  range(start, end);
  if (current < total - 3) add("…");
  add(total);
  return out;
}
