import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function BackToTop() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    function onScroll() {
      const shouldShow = window.scrollY > 400;
      if (shouldShow) {
        if (!mounted) setMounted(true);
        // small delay before fade-in so it feels gentle
        timer && clearTimeout(timer);
        timer = setTimeout(() => setVisible(true), 180);
      } else {
        setVisible(false);
        timer && clearTimeout(timer);
        timer = setTimeout(() => setMounted(false), 350);
      }
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      timer && clearTimeout(timer);
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed right-5 z-50 grid h-11 w-11 place-items-center rounded-full border border-border bg-background text-foreground shadow-lg transition-all duration-500 ease-out hover:scale-105 hover:border-primary/40 hover:text-primary ${
        visible
          ? "bottom-24 opacity-100 translate-y-0"
          : "bottom-16 opacity-0 translate-y-3 pointer-events-none"
      }`}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
