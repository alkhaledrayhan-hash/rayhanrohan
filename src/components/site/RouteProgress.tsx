import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";

export function RouteProgress() {
  const [mounted, setMounted] = useState(false);
  const isPending = useRouterState({ select: (s) => s.status === "pending" });

  useEffect(() => {
    setMounted(true);
  }, []);

  const active = mounted && isPending;

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed left-0 right-0 top-0 z-[100] h-[2px] bg-transparent transition-opacity duration-200 ${
        active ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className={`h-full bg-gradient-to-r from-primary via-gold to-primary ${
          active ? "route-progress-animate" : ""
        }`}
      />
    </div>
  );
}
