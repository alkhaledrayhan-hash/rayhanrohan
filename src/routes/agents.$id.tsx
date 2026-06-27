import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Bath, Bed, Building2, Mail, MapPin, Maximize2, Phone } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { PageHero } from "@/components/site/PageHero";
import { getPublicAgent } from "@/lib/public-agents.functions";
import { MessageAgentDialog } from "@/components/site/MessageAgentDialog";

const agentQuery = (id: string) =>
  queryOptions({
    queryKey: ["public-agent", id],
    queryFn: () => getPublicAgent({ data: { id } }),
  });

export const Route = createFileRoute("/agents/$id")({
  head: ({ params }) => ({
    meta: [
      { title: "Agent profile" },
      { name: "description", content: `Properties listed by agent ${params.id}` },
    ],
  }),
  loader: async ({ params, context }) => {
    const res = await context.queryClient.ensureQueryData(agentQuery(params.id));
    if (!res.agent) throw notFound();
    return res;
  },
  component: AgentDetailPage,
  errorComponent: ({ error }) => {
    console.error(error);
    return (
      <div className="grid min-h-screen place-items-center p-10 text-center text-sm text-rose-600">
        Something went wrong. Please try again.
      </div>
    );
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-4 pt-32 pb-20 text-center">
        <h1 className="font-display text-2xl font-semibold">Agent not found</h1>
        <Link to="/agents" className="mt-6 inline-flex items-center gap-2 text-sm text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to agents
        </Link>
      </main>
      <Footer />
    </div>
  ),
});

function AgentDetailPage() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(agentQuery(id));
  const agent = data.agent!;
  const properties = data.properties;

  const initials = (agent.full_name || agent.username || "A")
    .split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <PageHero
          eyebrow="Agent"
          title={agent.full_name || "Agent"}
          description={agent.username ? `@${agent.username}` : undefined}
          crumbs={[
            { label: "Home", to: "/" },
            { label: "Agents", to: "/agents" },
            { label: agent.full_name || "Agent" },
          ]}
        />
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Link to="/agents" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> All agents
        </Link>


        <section className="mt-6 rounded-3xl border border-border bg-white p-8 shadow-sm">
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
            <div className="h-28 w-28 overflow-hidden rounded-full bg-primary/10 ring-4 ring-white shadow">
              {agent.avatar_url ? (
                <img src={agent.avatar_url} alt={agent.full_name ?? ""} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-2xl font-semibold text-primary">
                  {initials}
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-gold">Agent</p>
              <h1 className="mt-1 font-display text-3xl font-semibold md:text-4xl">
                {agent.full_name || "Agent"}
              </h1>
              {agent.username && (
                <p className="text-sm text-muted-foreground">@{agent.username}</p>
              )}
              <div className="mt-4 flex flex-wrap justify-center gap-3 sm:justify-start">
                {agent.email && (
                  <a href={`mailto:${agent.email}`} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs hover:bg-muted">
                    <Mail className="h-3.5 w-3.5" /> {agent.email}
                  </a>
                )}
                {agent.phone && (
                  <a href={`tel:${agent.phone}`} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs hover:bg-muted">
                    <Phone className="h-3.5 w-3.5" /> {agent.phone}
                  </a>
                )}
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                  <Building2 className="h-3.5 w-3.5" />
                  {agent.property_count} {agent.property_count === 1 ? "property" : "properties"}
                </span>
                <MessageAgentDialog agentId={agent.id} agentName={agent.full_name || "this agent"} />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-semibold">Listings by this agent</h2>
          {properties.length === 0 ? (
            <div className="mt-6 grid place-items-center rounded-2xl border border-dashed border-border bg-white p-12 text-center text-sm text-muted-foreground">
              This agent has no approved listings yet.
            </div>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((p) => (
                <Link
                  key={p.id}
                  to="/properties/$id"
                  params={{ id: p.slug || p.id }}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    {p.image ? (
                      <img src={p.image} alt={p.title} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-muted-foreground">No image</div>
                    )}
                    <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-primary-foreground">
                      For {p.status}
                    </span>
                    <span className="absolute bottom-3 left-3 rounded-md bg-background/95 px-3 py-1.5 text-sm font-semibold shadow">
                      QAR {p.price.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-display text-lg font-semibold">{p.title}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      {p.location} · {p.address}
                    </p>
                    <div className="mt-4 flex items-center gap-5 border-t border-border pt-4 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5"><Bed className="h-4 w-4 text-primary" /> {p.bedrooms} bd</span>
                      <span className="inline-flex items-center gap-1.5"><Bath className="h-4 w-4 text-primary" /> {p.bathrooms} ba</span>
                      <span className="inline-flex items-center gap-1.5"><Maximize2 className="h-4 w-4 text-primary" /> {p.sqft.toLocaleString()} ft²</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
        </section>
      </main>
      <Footer />
    </div>
  );
}
