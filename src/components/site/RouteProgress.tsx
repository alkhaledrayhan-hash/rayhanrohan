import { useRouterState } from "@tanstack/react-router";

export function RouteProgress() {
  const isLoading = useRouterState({
    select: (s) => s.status === "pending",
  });

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed left-0 right-0 top-0 z-[100] h-[2px] bg-transparent transition-opacity duration-200 ${
        isLoading ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className={`h-full bg-gradient-to-r from-primary via-gold to-primary ${
          isLoading ? "route-progress-animate" : ""
        }`}
      />
    </div>
  );
}
