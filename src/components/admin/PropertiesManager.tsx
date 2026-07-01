import { useRef, useState } from "react";
import { ThemedSelect } from "@/components/ui/themed-select";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, CheckCircle2, XCircle, Trash2, Pencil, Upload, X, ImagePlus, Clock, Eye, MapPin, Bed, Bath, Maximize2, Calendar, BadgeCheck, Tag } from "lucide-react";
import { fileToDataUrl } from "@/lib/image-upload";
import { resolvePropertyImage } from "@/lib/properties";
import { LocationAutocomplete } from "@/components/admin/LocationAutocomplete";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { BulkActionsBar, SelectCheckbox } from "@/components/admin/BulkActionsBar";

type PropertyRow = {
  id: string;
  slug: string;
  title: string;
  location: string;
  address: string;
  type: string;
  status: "rent" | "sale";
  price: number;
  bedrooms: number;
  bathrooms: number;
  rooms: number;
  sqft: number;
  year_built: number | null;
  image: string | null;
  gallery: string[];
  description: string | null;
  features: string[];
  verified: boolean;
  listing_status: "pending" | "approved" | "rejected";
  created_by: string | null;
  assigned_agent_id: string | null;
  is_offer: boolean;
  offer_discount: number;
  offer_tag: string | null;
  offer_ends: string | null;
  created_at: string;
};

const empty: Partial<PropertyRow> = {
  title: "", slug: "", location: "Doha", address: "", type: "Apartment",
  status: "rent", price: 0, bedrooms: 1, bathrooms: 1, rooms: 1, sqft: 0,
  year_built: null, image: "", gallery: [], description: "", features: [], assigned_agent_id: null,
  is_offer: false, offer_discount: 0, offer_tag: "", offer_ends: "",
};

export function PropertiesManager({ isAdmin }: { isAdmin: boolean }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<PropertyRow> | null>(null);
  const [viewing, setViewing] = useState<PropertyRow | null>(null);
  const [search, setSearch] = useState("");
  const [fStatus, setFStatus] = useState<"all" | "rent" | "sale">("all");
  const [fApproval, setFApproval] = useState<"all" | "approved" | "pending" | "rejected">("all");
  const [fType, setFType] = useState<string>("all");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-properties", isAdmin],
    queryFn: async () => {
      let q = supabase.from("properties").select("*").order("created_at", { ascending: false });
      if (!isAdmin) {
        // Agents only see properties they created OR are assigned to.
        const { data: u } = await supabase.auth.getUser();
        const uid = u.user?.id;
        if (!uid) return [];
        q = q.or(`created_by.eq.${uid},assigned_agent_id.eq.${uid}`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map((r: any) => ({
        ...r,
        gallery: Array.isArray(r.gallery) ? r.gallery : [],
        features: Array.isArray(r.features) ? r.features : [],
      })) as PropertyRow[];
    },
  });

  // Agent list (admin assigns any agent to a property)
  const { data: agents = [] } = useQuery({
    queryKey: ["agents-for-assignment"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data: roles, error: rErr } = await supabase
        .from("user_roles").select("user_id").eq("role", "agent");
      if (rErr) throw rErr;
      const ids = (roles ?? []).map((r: any) => r.user_id);
      if (!ids.length) return [] as { id: string; full_name: string | null; email: string | null }[];
      const { data, error } = await supabase
        .from("profiles").select("id, full_name, email").in("id", ids);
      if (error) throw error;
      return (data ?? []) as { id: string; full_name: string | null; email: string | null }[];
    },
  });
  const agentName = (id: string | null) => {
    if (!id) return "—";
    const a = agents.find((x) => x.id === id);
    return a?.full_name || a?.email || "Agent";
  };

  const save = useMutation({
    mutationFn: async (p: Partial<PropertyRow>) => {
      const { data: u } = await supabase.auth.getUser();
      const slug = (p.slug || p.title || "").toString().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const payload: any = {
        title: p.title, slug, location: p.location, address: p.address, type: p.type,
        status: p.status, price: Number(p.price) || 0,
        bedrooms: Number(p.bedrooms) || 0, bathrooms: Number(p.bathrooms) || 0,
        rooms: Number(p.rooms) || 0, sqft: Number(p.sqft) || 0,
        year_built: p.year_built ? Number(p.year_built) : null,
        image: p.image || null, description: p.description || null,
        features: Array.isArray(p.features) ? p.features : [],
        gallery: Array.isArray(p.gallery) ? p.gallery : [],
        is_offer: !!p.is_offer,
        offer_discount: Number(p.offer_discount) || 0,
        offer_tag: p.offer_tag || null,
        offer_ends: p.offer_ends || null,
      };
      // Only admins can (re)assign agents
      if (isAdmin) payload.assigned_agent_id = p.assigned_agent_id || null;
      if (p.id) {
        const { error } = await supabase.from("properties").update(payload).eq("id", p.id);
        if (error) throw error;
      } else {
        payload.created_by = u.user?.id;
        payload.listing_status = isAdmin ? "approved" : "pending";
        const { error } = await supabase.from("properties").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Saved");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin-properties"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" | "pending" }) => {
      const { error } = await supabase.from("properties").update({ listing_status: status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin-properties"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const assignAgent = useMutation({
    mutationFn: async ({ id, agentId }: { id: string; agentId: string | null }) => {
      const { error } = await supabase
        .from("properties")
        .update({ assigned_agent_id: agentId })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Agent assigned"); qc.invalidateQueries({ queryKey: ["admin-properties"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleOffer = useMutation({
    mutationFn: async ({ id, is_offer }: { id: string; is_offer: boolean }) => {
      const { error } = await supabase.from("properties").update({ is_offer }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Offer updated");
      qc.invalidateQueries({ queryKey: ["admin-properties"] });
      qc.invalidateQueries({ queryKey: ["offer-properties"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("properties").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-properties"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const types = Array.from(new Set(rows.map((r) => r.type).filter(Boolean))).sort();
  const filtered = rows.filter((r) => {
    if (fStatus !== "all" && r.status !== fStatus) return false;
    if (fApproval !== "all" && r.listing_status !== fApproval) return false;
    if (fType !== "all" && r.type !== fType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (![r.title, r.location, r.address, r.type].some((v) => (v || "").toLowerCase().includes(q))) return false;
    }
    return true;
  });

  const bulk = useBulkSelection(filtered);
  const bulkDelete = async (items: typeof filtered) => {
    const ids = items.map((i) => i.id);
    const { error } = await supabase.from("properties").delete().in("id", ids);
    if (error) { toast.error(error.message); return; }
    toast.success(`Deleted ${ids.length} propert${ids.length === 1 ? "y" : "ies"}`);
    qc.invalidateQueries({ queryKey: ["admin-properties"] });
  };
  const bulkUpdate = async (patch: any, label: string) => {
    const ids = bulk.selectedIds;
    if (!ids.length) return;
    const { error } = await (supabase.from("properties") as any).update(patch).in("id", ids);
    if (error) { toast.error(error.message); return; }
    toast.success(`${label}: ${ids.length}`);
    qc.invalidateQueries({ queryKey: ["admin-properties"] });
    bulk.clear();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{isAdmin ? "Manage all listings & approve agent submissions." : "Your listings (new entries need admin approval)."}</p>
        <button onClick={() => setEditing({ ...empty })} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          <Plus className="h-4 w-4" /> Add property
        </button>
      </div>
      <BulkActionsBar
        count={bulk.count}
        selectedItems={bulk.selectedItems}
        onClear={bulk.clear}
        onDelete={bulkDelete}
        entityName="property"
        exportFilename="properties"
        exportColumns={[
          { key: "title", label: "Title" },
          { key: "location", label: "Location" },
          { key: "type", label: "Type" },
          { key: "price", label: "Price" },
          { key: "status", label: "Status" },
          { key: "listing_status", label: "Approval" },
        ]}
      >
        {isAdmin && (
          <>
            <button onClick={() => bulkUpdate({ listing_status: "approved" }, "Approved")} className="rounded-md border border-border bg-white px-2.5 py-1.5 text-xs hover:bg-muted">Approve</button>
            <button onClick={() => bulkUpdate({ listing_status: "rejected" }, "Rejected")} className="rounded-md border border-border bg-white px-2.5 py-1.5 text-xs hover:bg-muted">Reject</button>
            <button onClick={() => bulkUpdate({ status: "active" }, "Set active")} className="rounded-md border border-border bg-white px-2.5 py-1.5 text-xs hover:bg-muted">Activate</button>
            <button onClick={() => bulkUpdate({ status: "inactive" }, "Set inactive")} className="rounded-md border border-border bg-white px-2.5 py-1.5 text-xs hover:bg-muted">Deactivate</button>
          </>
        )}
      </BulkActionsBar>

      <div className="grid grid-cols-1 gap-2 rounded-2xl border border-border bg-white p-3 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title, location, address…"
          className="rounded-md border border-input bg-background px-3 py-2 text-sm lg:col-span-2"
        />
        <ThemedSelect value={fStatus} onChange={(v: string) => setFStatus(v as any)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="all">All status</option>
          <option value="rent">For rent</option>
          <option value="sale">For sale</option>
        </ThemedSelect>
        <ThemedSelect value={fApproval} onChange={(v: string) => setFApproval(v as any)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="all">All approval</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </ThemedSelect>
        <ThemedSelect value={fType} onChange={(v: string) => setFType(v)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="all">All types</option>
          {types.map((t) => <option key={t} value={t}>{t}</option>)}
        </ThemedSelect>
        {(search || fStatus !== "all" || fApproval !== "all" || fType !== "all") && (
          <button
            type="button"
            onClick={() => { setSearch(""); setFStatus("all"); setFApproval("all"); setFType("all"); }}
            className="rounded-md border border-input bg-background px-3 py-2 text-xs hover:bg-secondary lg:col-span-5"
          >
            Clear filters · Showing {filtered.length} of {rows.length}
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="responsive-table w-full min-w-[720px] text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-3 w-10"><SelectCheckbox checked={bulk.allSelected} indeterminate={bulk.someSelected} onChange={bulk.toggleAll} ariaLabel="Select all" /></th>
                <th className="px-5 py-3">Property</th>
                <th className="px-5 py-3">Location</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Agent</th>
                <th className="px-5 py-3">Approval</th>
                <th className="px-5 py-3">Offer</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && <tr><td colSpan={9} className="px-5 py-8 text-center text-muted-foreground">Loading…</td></tr>}
              {!isLoading && filtered.length === 0 && <tr><td colSpan={9} className="px-5 py-8 text-center text-muted-foreground">{rows.length === 0 ? "No properties yet." : "No properties match these filters."}</td></tr>}
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-3 py-3"><SelectCheckbox checked={bulk.isSelected(r.id)} onChange={() => bulk.toggle(r.id)} ariaLabel="Select property" /></td>
                  <td className="px-5 py-3 font-medium">
                    <button
                      type="button"
                      onClick={() => setViewing(r)}
                      className="text-left text-foreground hover:text-primary hover:underline"
                    >
                      {r.title}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{r.location}</td>
                  <td className="px-5 py-3"><span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">{r.status}</span></td>
                  <td className="px-5 py-3">QAR {Number(r.price).toLocaleString()}</td>
                  <td className="px-5 py-3">
                    {isAdmin ? (
                      <ThemedSelect
                        value={r.assigned_agent_id || ""}
                        onChange={(v: string) => assignAgent.mutate({ id: r.id, agentId: v || null })}
                        className="max-w-[160px] cursor-pointer rounded-md border border-input bg-background px-2 py-1 text-xs"
                      >
                        <option value="">— Unassigned —</option>
                        {agents.map((a) => (
                          <option key={a.id} value={a.id}>{a.full_name || a.email}</option>
                        ))}
                      </ThemedSelect>
                    ) : (
                      <span className="text-xs text-muted-foreground">{agentName(r.assigned_agent_id)}</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {isAdmin ? (
                      <ThemedSelect
                        value={r.listing_status}
                        onChange={(v: string) => setStatus.mutate({ id: r.id, status: v as any })}
                        className={`cursor-pointer rounded-full border-0 px-2 py-1 text-[10px] font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                          r.listing_status === "approved" ? "bg-emerald-50 text-emerald-700"
                          : r.listing_status === "pending" ? "bg-amber-50 text-amber-700"
                          : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        <option value="approved">Approved</option>
                        <option value="pending">Pending (delay)</option>
                        <option value="rejected">Rejected</option>
                      </ThemedSelect>
                    ) : (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        r.listing_status === "approved" ? "bg-emerald-50 text-emerald-700"
                        : r.listing_status === "pending" ? "bg-amber-50 text-amber-700"
                        : "bg-rose-50 text-rose-700"
                      }`}>{r.listing_status}</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      type="button"
                      onClick={() => toggleOffer.mutate({ id: r.id, is_offer: !r.is_offer })}
                      title={r.is_offer ? "Remove from offers" : "Mark as offer"}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase transition ${
                        r.is_offer
                          ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                          : "bg-muted text-muted-foreground hover:bg-muted/70"
                      }`}
                    >
                      {r.is_offer ? `★ ${r.offer_discount || 0}% off` : "Add offer"}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => setViewing(r)} title="View" className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => setEditing(r)} title="Edit" className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><Pencil className="h-4 w-4" /></button>
                      {isAdmin && (
                        <button onClick={() => { if (confirm("Delete this property?")) del.mutate(r.id); }} title="Delete" className="rounded p-1.5 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-3 sm:p-4" onClick={() => setViewing(null)}>
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              {viewing.image ? (
                <img src={viewing.image} alt={viewing.title} className="aspect-[16/9] w-full object-cover" />
              ) : (
                <div className="aspect-[16/9] w-full bg-muted" />
              )}
              <button
                onClick={() => setViewing(null)}
                aria-label="Close"
                className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-foreground shadow hover:bg-white"
              >
                <X className="h-4 w-4" />
              </button>
              <span className="absolute left-2 top-2 rounded-md bg-white/95 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground shadow">
                For {viewing.status}
              </span>
              {viewing.is_offer && (
                <span className="absolute left-2 bottom-2 inline-flex items-center gap-1 rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                  <Tag className="h-3 w-3" /> {viewing.offer_discount ? `${viewing.offer_discount}% OFF` : (viewing.offer_tag || "Offer")}
                </span>
              )}
            </div>
            <div className="max-h-[55vh] overflow-y-auto p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="truncate font-display text-base font-semibold text-foreground">{viewing.title}</h3>
                    {viewing.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-amber-500" />}
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" /> {viewing.location}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-display text-lg font-semibold text-primary">QAR {Number(viewing.price).toLocaleString()}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{viewing.type}</div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg bg-secondary/60 px-3 py-2 text-xs text-foreground">
                <span className="inline-flex items-center gap-1"><Bed className="h-3.5 w-3.5 text-muted-foreground" /> {viewing.bedrooms} beds</span>
                <span className="inline-flex items-center gap-1"><Bath className="h-3.5 w-3.5 text-muted-foreground" /> {viewing.bathrooms} baths</span>
                <span className="inline-flex items-center gap-1"><Maximize2 className="h-3.5 w-3.5 text-muted-foreground" /> {Number(viewing.sqft).toLocaleString()} sqft</span>
                {viewing.year_built && <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-muted-foreground" /> {viewing.year_built}</span>}
              </div>

              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between gap-2"><span>Approval</span><span className="font-medium text-foreground capitalize">{viewing.listing_status}</span></div>
                <div className="flex justify-between gap-2"><span>Agent</span><span className="truncate font-medium text-foreground">{agentName(viewing.assigned_agent_id)}</span></div>
              </div>

              {viewing.description && (
                <p className="mt-3 line-clamp-4 text-xs leading-relaxed text-foreground/80">{viewing.description}</p>
              )}

              {viewing.features?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {viewing.features.slice(0, 6).map((f, i) => (
                    <span key={i} className="rounded-md bg-secondary px-2 py-0.5 text-[11px]">{f}</span>
                  ))}
                  {viewing.features.length > 6 && <span className="text-[11px] text-muted-foreground">+{viewing.features.length - 6} more</span>}
                </div>
              )}

              {viewing.gallery?.length > 0 && (
                <div className="mt-3 grid grid-cols-4 gap-1.5">
                  {viewing.gallery.slice(0, 4).map((g, i) => (
                    <img key={i} src={g} alt="" className="aspect-square w-full rounded-md object-cover" />
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 border-t bg-secondary/30 px-4 py-2.5">
              <a
                href={`/properties/${viewing.slug}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-input bg-background px-3 py-1.5 text-xs hover:bg-secondary"
              >
                Open public page
              </a>
              <button
                onClick={() => { setEditing(viewing); setViewing(null); }}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-semibold">{editing.id ? "Edit property" : "New property"}</h3>
            <form
              onSubmit={(e) => { e.preventDefault(); save.mutate(editing); }}
              className="mt-4 grid max-h-[70vh] grid-cols-2 gap-3 overflow-y-auto text-sm"
            >
              <Field label="Title" className="col-span-2"><input required value={editing.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className={inputCls} /></Field>
              <Field label="Location (city / area)">
                <LocationAutocomplete
                  value={editing.location || ""}
                  onChange={(v) => setEditing({ ...editing, location: v })}
                  onPick={(d) => setEditing((cur) => ({ ...(cur || {}), location: d.value, address: cur?.address || d.fullAddress }))}
                  placeholder="e.g. The Pearl, West Bay…"
                  mode="location"
                />
              </Field>
              <Field label="Full address (Google-style suggestions)">
                <LocationAutocomplete
                  value={editing.address || ""}
                  onChange={(v) => setEditing({ ...editing, address: v })}
                  onPick={(d) => setEditing((cur) => ({ ...(cur || {}), address: d.fullAddress, location: cur?.location || d.value }))}
                  placeholder="Street, district, city"
                  mode="address"
                />
              </Field>
              <Field label="Type"><input required value={editing.type || ""} onChange={(e) => setEditing({ ...editing, type: e.target.value })} className={inputCls} /></Field>
              <Field label="Rent / Sale">
                <ThemedSelect value={editing.status || "rent"} onChange={(v: string) => setEditing({ ...editing, status: v as any })} className={inputCls}>
                  <option value="rent">Rent</option><option value="sale">Sale</option>
                </ThemedSelect>
              </Field>
              <Field label="Price (QAR)"><input type="number" required value={editing.price ?? 0} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} className={inputCls} /></Field>
              <Field label="Bedrooms"><input type="number" value={editing.bedrooms ?? 0} onChange={(e) => setEditing({ ...editing, bedrooms: Number(e.target.value) })} className={inputCls} /></Field>
              <Field label="Bathrooms"><input type="number" value={editing.bathrooms ?? 0} onChange={(e) => setEditing({ ...editing, bathrooms: Number(e.target.value) })} className={inputCls} /></Field>
              <Field label="Rooms"><input type="number" value={editing.rooms ?? 0} onChange={(e) => setEditing({ ...editing, rooms: Number(e.target.value) })} className={inputCls} /></Field>
              <Field label="Area (sqft)"><input type="number" value={editing.sqft ?? 0} onChange={(e) => setEditing({ ...editing, sqft: Number(e.target.value) })} className={inputCls} /></Field>
              <Field label="Year built"><input type="number" placeholder="e.g. 2022" value={editing.year_built ?? ""} onChange={(e) => setEditing({ ...editing, year_built: e.target.value ? Number(e.target.value) : null })} className={inputCls} /></Field>
              {isAdmin && (
                <Field label="Assigned agent" className="col-span-2">
                  <ThemedSelect
                    value={editing.assigned_agent_id || ""}
                    onChange={(v: string) => setEditing({ ...editing, assigned_agent_id: v || null })}
                    className={inputCls}
                  >
                    <option value="">— Unassigned —</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>{a.full_name || a.email}</option>
                    ))}
                  </ThemedSelect>
                </Field>
              )}
              <div className="col-span-2 space-y-2">
                <span className="text-xs font-medium text-muted-foreground">Cover image</span>
                <CoverUploader value={editing.image || ""} onChange={(v) => setEditing({ ...editing, image: v })} />
              </div>
              <div className="col-span-2 space-y-2">
                <span className="text-xs font-medium text-muted-foreground">Gallery images</span>
                <GalleryUploader value={editing.gallery || []} onChange={(v) => setEditing({ ...editing, gallery: v })} />
              </div>
              <Field label="Description" className="col-span-2"><textarea rows={3} value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className={inputCls} /></Field>
              <Field label="Features (comma separated)" className="col-span-2">
                <input value={(editing.features || []).join(", ")} onChange={(e) => setEditing({ ...editing, features: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} className={inputCls} />
              </Field>

              <div className="col-span-2 mt-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium text-amber-900">
                  <input
                    type="checkbox"
                    checked={!!editing.is_offer}
                    onChange={(e) => setEditing({ ...editing, is_offer: e.target.checked })}
                    className="h-4 w-4 rounded border-amber-300"
                  />
                  Mark as Special Offer (shown on home page Offers section & Offers page)
                </label>
                {editing.is_offer && (
                  <div className="grid grid-cols-3 gap-2">
                    <Field label="Discount %">
                      <input type="number" min={0} max={90} value={editing.offer_discount ?? 0} onChange={(e) => setEditing({ ...editing, offer_discount: Number(e.target.value) })} className={inputCls} />
                    </Field>
                    <Field label="Tag (e.g. Move-in ready)">
                      <input value={editing.offer_tag || ""} onChange={(e) => setEditing({ ...editing, offer_tag: e.target.value })} className={inputCls} />
                    </Field>
                    <Field label="Ends (e.g. Jul 31)">
                      <input value={editing.offer_ends || ""} onChange={(e) => setEditing({ ...editing, offer_ends: e.target.value })} className={inputCls} />
                    </Field>
                  </div>
                )}
              </div>

              <div className="col-span-2 mt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button>
                <button type="submit" disabled={save.isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">
                  {save.isPending ? "Saving…" : editing.id ? "Save changes" : isAdmin ? "Publish" : "Submit for approval"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";
function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`space-y-1 ${className}`}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function CoverUploader({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    try {
      const url = await fileToDataUrl(f, { maxSize: 1280, quality: 0.8 });
      onChange(url);
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-2">
      <div
        onClick={() => ref.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}
        className="relative grid h-40 cursor-pointer place-items-center rounded-lg border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 overflow-hidden"
      >
        {value ? (
          <>
            <img src={value} alt="cover" className="absolute inset-0 h-full w-full object-cover" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(""); }}
              className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
            ><X className="h-4 w-4" /></button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <Upload className="h-6 w-6" />
            <span className="text-xs">{busy ? "Uploading…" : "Click or drop cover image"}</span>
          </div>
        )}
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      </div>
      <input
        type="url"
        placeholder="…or paste image URL"
        value={value.startsWith("data:") ? "" : value}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      />
    </div>
  );
}

function GalleryUploader({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const onFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setBusy(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) {
        urls.push(await fileToDataUrl(f, { maxSize: 1280, quality: 0.8 }));
      }
      onChange([...(value || []), ...urls]);
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-2">
        {(value || []).map((src, i) => (
          <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
            <img src={src} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 group-hover:opacity-100"
            ><X className="h-3 w-3" /></button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => ref.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
          className="grid aspect-square place-items-center rounded-lg border-2 border-dashed border-border bg-muted/30 text-muted-foreground hover:bg-muted/50"
        >
          <div className="flex flex-col items-center gap-1">
            <ImagePlus className="h-5 w-5" />
            <span className="text-[10px]">{busy ? "…" : "Add"}</span>
          </div>
        </button>
      </div>
      <input ref={ref} type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
      <p className="text-[11px] text-muted-foreground">You can select multiple images. Stored inline (downscaled).</p>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md bg-secondary/50 px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate text-foreground">{value}</div>
    </div>
  );
}
