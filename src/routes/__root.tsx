import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { RouteProgress } from "../components/site/RouteProgress";
import { ChatWidget } from "../components/site/ChatWidget";
import { BackToTop } from "../components/site/BackToTop";
import { useApplyTheme } from "@/hooks/useThemeTokens";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-semibold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MaisonQatar — Premium Real Estate in Qatar" },
      {
        name: "description",
        content:
          "Curated luxury properties for rent and sale across Doha, The Pearl, Lusail, West Bay and Al Waab.",
      },
      { property: "og:title", content: "MaisonQatar — Premium Real Estate in Qatar" },
      {
        property: "og:description",
        content:
          "Curated luxury properties for rent and sale across Doha, The Pearl, Lusail, West Bay and Al Waab.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "MaisonQatar — Premium Real Estate in Qatar" },
      { name: "description", content: "A premium real estate website for Qatar, featuring luxury properties for rent and sale with advanced search and booking." },
      { property: "og:description", content: "A premium real estate website for Qatar, featuring luxury properties for rent and sale with advanced search and booking." },
      { name: "twitter:description", content: "A premium real estate website for Qatar, featuring luxury properties for rent and sale with advanced search and booking." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/446b0fdf-d890-4be3-b11a-c6cdbaef9ad9/id-preview-e3c84fc3--231b5296-370f-48cb-adf2-1d8d97cd3254.lovable.app-1781733448768.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/446b0fdf-d890-4be3-b11a-c6cdbaef9ad9/id-preview-e3c84fc3--231b5296-370f-48cb-adf2-1d8d97cd3254.lovable.app-1781733448768.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

const CRITICAL_CSS = `html,body{background:#fafaf7;color:#1a1410;margin:0;font-family:Inter,system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden}#app-loading{position:fixed;inset:0;display:grid;place-items:center;background:#fafaf7;z-index:9999;transition:opacity .25s ease;pointer-events:none}#app-loading.hide{opacity:0}#app-loading::after{content:"";width:36px;height:36px;border-radius:50%;border:3px solid rgba(139,38,53,.15);border-top-color:#8b2635;animation:al-spin .8s linear infinite}@keyframes al-spin{to{transform:rotate(360deg)}}`;

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: CRITICAL_CSS }} />
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        {children}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(function(){var e=document.getElementById('app-loading');if(!e)return;function h(){e.classList.add('hide');setTimeout(function(){e&&e.parentNode&&e.parentNode.removeChild(e)},300)}if(document.readyState==='complete')setTimeout(h,50);else window.addEventListener('load',function(){setTimeout(h,50)});setTimeout(h,4000)})();`,
          }}
        />
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  useApplyTheme();

  useEffect(() => {
    let active = true;
    import("@/integrations/supabase/client").then(({ supabase }) => {
      if (!active) return;
      const { data } = supabase.auth.onAuthStateChange((event) => {
        if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
        router.invalidate();
        if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
      });
      (window as unknown as { __authSub?: { unsubscribe: () => void } }).__authSub = data.subscription;
    });
    return () => {
      active = false;
      const sub = (window as unknown as { __authSub?: { unsubscribe: () => void } }).__authSub;
      sub?.unsubscribe();
    };
  }, [queryClient, router]);

  // Scroll-reveal: auto-tag sections and observe them
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const targets = new Set<Element>();
    const tag = () => {
      document.querySelectorAll("main > section, main > div > section").forEach((el) => {
        if (!el.hasAttribute("data-reveal")) el.setAttribute("data-reveal", "");
        targets.add(el);
      });
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
    );

    const observe = () => {
      tag();
      targets.forEach((el) => io.observe(el));
    };

    observe();
    const mo = new MutationObserver(() => observe());
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);

  return (
    <QueryClientProvider client={queryClient}>
      <RouteProgress />
      <Outlet />
      <ChatWidget />
      <BackToTop />
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}
