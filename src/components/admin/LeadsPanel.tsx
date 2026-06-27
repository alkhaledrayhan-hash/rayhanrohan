import { useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, Mail, Trash2, Search, Eye, X, Phone as PhoneIcon, Calendar, Building2, User as UserIcon, Tag } from "lucide-react";
import { useFormatters } from "@/lib/format";

type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  source: string;
  status: string;
  created_at: string;
  property_id: string | null;
  property_title: string | null;
  agent_id: string | null;
};

type AgentProfile = { id: string; full_name: string | null; email: string | null };

export function LeadsPanel({ isAdmin }: { isAdmin: boolean }) {
  const qc = useQueryClient();
  const { formatDate, formatTime, formatDateTime } = useFormatters();
  const [q, setQ] = useState("");
  const [src, setSrc] = useState<string>("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [viewing, setViewing] = useState<Lead | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
  });

  const { data: adminEmail } = useQuery({
    queryKey: ["site-settings", "admin_email"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "admin_email")
        .maybeSingle();
      return data?.value || "";
    },
  });

  const { data: agents = [] } = useQuery({
    queryKey: ["leads-agents"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "agent");
      const ids = (roles ?? []).map((r) => r.user_id as string);
      if (!ids.length) return [] as AgentProfile[];
      const { data } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
      return (data ?? []) as AgentProfile[];
    },
  });

  const agentMap = useMemo(() => {
    const m = new Map<string, AgentProfile>();
    for (const a of agents) m.set(a.id, a);
    return m;
  }, [agents]);
  const agentName = (id: string | null) => {
    if (!id) return "—";
    const a = agentMap.get(id);
    return a?.full_name || a?.email || "Agent";
  };

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (src !== "all" && r.source !== src) return false;
      if (agentFilter !== "all") {
        if (agentFilter === "unassigned" ? r.agent_id : r.agent_id !== agentFilter) return false;
      }
      if (!needle) return true;
      return [r.name, r.email, r.phone, r.subject, r.message, r.property_title]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    });
  }, [rows, q, src, agentFilter]);

  const sources = useMemo(() => Array.from(new Set(rows.map((r) => r.source))).sort(), [rows]);

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Lead deleted"); qc.invalidateQueries({ queryKey: ["admin-leads"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const exportCsv = () => {
    if (!filtered.length) { toast.error("No leads to export"); return; }
    const header = ["Date", "Name", "Email", "Phone", "Source", "Subject", "Message", "Status"];
    const esc = (s: any) => `"${String(s ?? "").replace(/"/g, '""')}"`;
    const lines = [header.join(",")].concat(
      filtered.map((r) => [
        new Date(r.created_at).toISOString(),
        r.name, r.email, r.phone || "", r.source, r.subject || "", r.message, r.status,
      ].map(esc).join(","))
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const emailToAdmin = () => {
    if (!adminEmail) { toast.error("Set an admin email under Settings first."); return; }
    if (!filtered.length) { toast.error("No leads to send"); return; }
    exportCsv();
    const body = filtered
      .slice(0, 20)
      .map((r) => `• ${r.name} <${r.email}> — ${r.subject || r.source} (${formatDateTime(r.created_at)})`)
      .join("\n");
    const subject = `Leads export — ${filtered.length} records`;
    const mailto = `mailto:${encodeURIComponent(adminEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      `${filtered.length} leads exported. CSV downloaded to your computer — please attach it to this email.\n\nRecent leads:\n${body}`
    )}`;
    window.location.href = mailto;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, email, message…"
            className="w-full rounded-lg border border-input bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select value={src} onChange={(e) => setSrc(e.target.value)} className="rounded-lg border border-input bg-white px-3 py-2 text-sm">
          <option value="all">All sources</option>
          {sources.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {isAdmin && (
          <select value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)} className="rounded-lg border border-input bg-white px-3 py-2 text-sm">
            <option value="all">All agents</option>
            <option value="unassigned">Unassigned</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.full_name || a.email}</option>
            ))}
          </select>
        )}
        <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm hover:bg-muted">
          <Download className="h-4 w-4" /> Export CSV
        </button>
        <button onClick={emailToAdmin} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          <Mail className="h-4 w-4" /> Email to admin
        </button>
      </div>

      <div className="responsive-table-wrap overflow-hidden rounded-2xl border border-border bg-white shadow-sm md:overflow-visible">
        <div className="overflow-x-auto">
          <table className="responsive-table responsive-cards w-full min-w-[960px] text-sm md:min-w-0 md:table-fixed">
            <colgroup className="hidden md:table-column-group">
              <col style={{ width: "110px" }} />
              <col style={{ width: "150px" }} />
              <col style={{ width: "210px" }} />
              <col style={{ width: "100px" }} />
              <col style={{ width: "180px" }} />
              <col style={{ width: "130px" }} />
              <col />
              {isAdmin && <col style={{ width: "90px" }} />}
            </colgroup>

            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3">Message</th>
                {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">Loading…</td></tr>}
              {!isLoading && filtered.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">No leads yet.</td></tr>}
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setViewing(r)}
                  className="cursor-pointer align-top hover:bg-muted/30"
                >
                  <td data-label="When" className="px-4 py-3 text-xs text-muted-foreground md:whitespace-nowrap">
                    <div className="font-medium text-foreground/80">{formatDate(r.created_at)}</div>
                    <div className="text-[11px] text-muted-foreground">{formatTime(r.created_at)}</div>
                  </td>
                  <td data-label="Name" className="px-4 py-3 font-medium md:break-words">{r.name}</td>
                  <td data-label="Contact" className="px-4 py-3 text-xs md:break-words" onClick={(e) => e.stopPropagation()}>
                    <a href={`mailto:${r.email}`} className="block break-all text-primary hover:underline">{r.email}</a>
                    {r.phone && <a href={`tel:${r.phone}`} className="block text-muted-foreground">{r.phone}</a>}
                  </td>
                  <td data-label="Source" className="px-4 py-3"><span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{r.source}</span></td>
                  <td data-label="Property" className="px-4 py-3 text-xs text-muted-foreground md:truncate" title={r.property_title || undefined}>{r.property_title || "—"}</td>
                  <td data-label="Agent" className="px-4 py-3 text-xs md:break-words">{agentName(r.agent_id)}</td>
                  <td data-label="Message" className="px-4 py-3">
                    {r.subject && <div className="truncate text-xs font-semibold text-foreground/70">{r.subject}</div>}
                    <p className="line-clamp-2 text-xs text-muted-foreground">{r.message}</p>
                  </td>
                  {isAdmin && (
                    <td data-label="Actions" className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => setViewing(r)}
                          className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="View"
                        ><Eye className="h-4 w-4" /></button>
                        <button
                          onClick={() => { if (confirm("Delete this lead?")) del.mutate(r.id); }}
                          className="rounded p-1.5 text-rose-600 hover:bg-rose-50" title="Delete"
                        ><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setViewing(null)}
        >
          <div
            className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border bg-gradient-to-br from-primary/5 to-transparent px-5 py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">{viewing.source}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{viewing.status}</span>
                </div>
                <h3 className="mt-1.5 truncate font-display text-lg font-semibold">{viewing.name}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3 w-3" />{formatDateTime(viewing.created_at)}</p>
              </div>
              <button
                onClick={() => setViewing(null)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close"
              ><X className="h-4 w-4" /></button>
            </div>

            <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4 text-sm">
              <div className="grid gap-2 sm:grid-cols-2">
                <InfoRow icon={<Mail className="h-3.5 w-3.5" />} label="Email">
                  <a href={`mailto:${viewing.email}`} className="text-primary hover:underline break-all">{viewing.email}</a>
                </InfoRow>
                <InfoRow icon={<PhoneIcon className="h-3.5 w-3.5" />} label="Phone">
                  {viewing.phone ? <a href={`tel:${viewing.phone}`} className="text-primary hover:underline">{viewing.phone}</a> : <span className="text-muted-foreground">—</span>}
                </InfoRow>
                <InfoRow icon={<Building2 className="h-3.5 w-3.5" />} label="Property">
                  <span>{viewing.property_title || "—"}</span>
                </InfoRow>
                <InfoRow icon={<UserIcon className="h-3.5 w-3.5" />} label="Assigned agent">
                  <span>{agentName(viewing.agent_id)}</span>
                </InfoRow>
              </div>

              {viewing.subject && (
                <InfoRow icon={<Tag className="h-3.5 w-3.5" />} label="Subject">
                  <span className="font-medium">{viewing.subject}</span>
                </InfoRow>
              )}

              <div>
                <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Message</div>
                <div className="whitespace-pre-wrap rounded-lg border border-border bg-muted/30 p-3 text-sm leading-relaxed">{viewing.message}</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-muted/20 px-5 py-3">
              <a
                href={`mailto:${viewing.email}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium hover:bg-muted"
              ><Mail className="h-3.5 w-3.5" /> Reply</a>
              {viewing.phone && (
                <a
                  href={`tel:${viewing.phone}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium hover:bg-muted"
                ><PhoneIcon className="h-3.5 w-3.5" /> Call</a>
              )}
              {isAdmin && (
                <button
                  onClick={() => {
                    if (confirm("Delete this lead?")) {
                      del.mutate(viewing.id);
                      setViewing(null);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700"
                ><Trash2 className="h-3.5 w-3.5" /> Delete</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/60 bg-white p-2.5">
      <div className="mb-0.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}{label}
      </div>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  );
}
