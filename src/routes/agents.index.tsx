import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Building2, UserCircle2 } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { PageHero } from "@/components/site/PageHero";
import { listPublicAgents } from "@/lib/public-agents.functions";

const agentsQuery = queryOptions({
  queryKey: ["public-agents"],
  queryFn: () => listPublicAgents(),
});

export const Route = createFileRoute("/agents/")({
  head: () => ({
    meta: [
      { title: "Our Agents — Meet the Team" },
      {
        name: "description",
        content: "Meet our property agents and explore their listings across Qatar.",
      },
      { property: "og:title", content: "Our Agents" },
      { property: "og:description", content: "Browse listings by agent." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(agentsQuery),
  component: AgentsPage,
  errorComponent: ({ error }) => (
    <div className="grid min-h-screen place-items-center p-10 text-center text-sm text-rose-600">
      {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-10 text-center">No agents found.</div>,
});

function AgentsPage() {
  const { data } = useSuspenseQuery(agentsQuery);
  const agents = data.agents;
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <PageHero
          eyebrow="Our Team"
          title="Meet our agents"
          description="Click any agent to view the properties they manage across Qatar."
          crumbs={[{ label: "Home", to: "/" }, { label: "Agents" }]}
        />
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          {agents.length === 0 ? (
            <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-white p-16 text-center">
              <UserCircle2 className="h-10 w-10 text-muted-foreground" />
              <p className="mt-3 font-display text-lg font-semibold">No agents yet</p>
              <button
                onClick={() => router.invalidate()}
                className="mt-4 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Refresh
              </button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {agents.map((a) => {
                const initials = (a.full_name || a.username || "A")
                  .split(" ")
                  .map((s) => s[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();
                return (
                  <Link
                    key={a.id}
                    to="/agents/$id"
                    params={{ id: a.id }}
                    className="group rounded-2xl border border-border bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
                  >
                    <div className="mx-auto h-24 w-24 overflow-hidden rounded-full bg-primary/10 ring-4 ring-white">
                      {a.avatar_url ? (
                        <img
                          src={a.avatar_url}
                          alt={a.full_name ?? ""}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-lg font-semibold text-primary">
                          {initials}
                        </div>
                      )}
                    </div>
                    <p className="mt-4 font-display text-lg font-semibold">
                      {a.full_name || "Agent"}
                    </p>
                    {a.username && <p className="text-xs text-muted-foreground">@{a.username}</p>}
                    <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      <Building2 className="h-3 w-3" />
                      {a.property_count} {a.property_count === 1 ? "property" : "properties"}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
