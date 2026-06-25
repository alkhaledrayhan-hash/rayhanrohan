import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { listPublicAgents, type PublicAgent } from "@/lib/public-agents.functions";

export function useAgentsMap() {
  return useQuery({
    queryKey: ["public-agents-map"],
    queryFn: async () => {
      const { agents } = await listPublicAgents();
      const map = new Map<string, PublicAgent>();
      for (const a of agents) map.set(a.id, a);
      return map;
    },
    staleTime: 5 * 60_000,
  });
}

export function PropertyAgentAvatar({
  agentId,
  size = 36,
  className = "",
}: {
  agentId?: string | null;
  size?: number;
  className?: string;
}) {
  const { data: map } = useAgentsMap();
  const agent = agentId ? map?.get(agentId) : undefined;

  const dimension = { width: size, height: size };
  const ringClass =
    "ring-2 ring-white/80 shadow-md overflow-hidden rounded-full flex-shrink-0";

  if (agent?.avatar_url) {
    return (
      <img
        src={agent.avatar_url}
        alt={agent.full_name || "Agent"}
        title={agent.full_name || "Agent"}
        loading="lazy"
        style={dimension}
        className={`${ringClass} object-cover ${className}`}
      />
    );
  }

  if (agent) {
    const initials = (agent.full_name || agent.username || "A")
      .split(" ")
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
    return (
      <span
        title={agent.full_name || "Agent"}
        style={dimension}
        className={`${ringClass} grid place-items-center bg-primary text-[11px] font-semibold text-primary-foreground ${className}`}
      >
        {initials}
      </span>
    );
  }

  // Fallback: admin / website badge
  return (
    <span
      title="Listed by MaisonQatar"
      style={dimension}
      className={`${ringClass} grid place-items-center bg-gradient-to-br from-primary to-[oklch(0.35_0.14_22)] text-primary-foreground ${className}`}
    >
      <Building2 className="h-1/2 w-1/2" />
    </span>
  );
}
