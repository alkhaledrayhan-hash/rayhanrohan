import { useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, Mail, Trash2, Search } from "lucide-react";
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
  const { formatDateTime } = useFormatters();
  const [q, setQ] = useState("");
  const [src, setSrc] = useState<string>("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");

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
        <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm hover:bg-muted">
          <Download className="h-4 w-4" /> Export CSV
        </button>
        <button onClick={emailToAdmin} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          <Mail className="h-4 w-4" /> Email to admin
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Message</th>
                {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Loading…</td></tr>}
              {!isLoading && filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No leads yet.</td></tr>}
              {filtered.map((r) => (
                <tr key={r.id} className="align-top hover:bg-muted/30">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">{formatDateTime(r.created_at)}</td>
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-xs">
                    <a href={`mailto:${r.email}`} className="block text-primary hover:underline">{r.email}</a>
                    {r.phone && <a href={`tel:${r.phone}`} className="block text-muted-foreground">{r.phone}</a>}
                  </td>
                  <td className="px-4 py-3"><span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{r.source}</span></td>
                  <td className="px-4 py-3 max-w-md">
                    {r.subject && <div className="text-xs font-semibold text-foreground/70">{r.subject}</div>}
                    <p className="line-clamp-3 text-xs text-muted-foreground">{r.message}</p>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => { if (confirm("Delete this lead?")) del.mutate(r.id); }}
                        className="rounded p-1.5 text-rose-600 hover:bg-rose-50" title="Delete"
                      ><Trash2 className="h-4 w-4" /></button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
