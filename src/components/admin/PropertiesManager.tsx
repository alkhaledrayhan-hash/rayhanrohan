import { useRef, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, CheckCircle2, XCircle, Trash2, Pencil, Upload, X, ImagePlus } from "lucide-react";
import { fileToDataUrl } from "@/lib/image-upload";

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
  created_at: string;
};

const empty: Partial<PropertyRow> = {
  title: "", slug: "", location: "Doha", address: "", type: "Apartment",
  status: "rent", price: 0, bedrooms: 1, bathrooms: 1, rooms: 1, sqft: 0,
  image: "", gallery: [], description: "", features: [],
};

export function PropertiesManager({ isAdmin }: { isAdmin: boolean }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<PropertyRow> | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PropertyRow[];
    },
  });

  const save = useMutation({
    mutationFn: async (p: Partial<PropertyRow>) => {
      const { data: u } = await supabase.auth.getUser();
      const slug = (p.slug || p.title || "").toString().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const payload: any = {
        title: p.title, slug, location: p.location, address: p.address, type: p.type,
        status: p.status, price: Number(p.price) || 0,
        bedrooms: Number(p.bedrooms) || 0, bathrooms: Number(p.bathrooms) || 0,
        rooms: Number(p.rooms) || 0, sqft: Number(p.sqft) || 0,
        image: p.image || null, description: p.description || null,
        features: Array.isArray(p.features) ? p.features : [],
      };
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

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("properties").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-properties"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{isAdmin ? "Manage all listings & approve agent submissions." : "Your listings (new entries need admin approval)."}</p>
        <button onClick={() => setEditing({ ...empty })} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          <Plus className="h-4 w-4" /> Add property
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Property</th>
                <th className="px-5 py-3">Location</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Approval</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && <tr><td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">Loading…</td></tr>}
              {!isLoading && rows.length === 0 && <tr><td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">No properties yet.</td></tr>}
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-5 py-3 font-medium">{r.title}</td>
                  <td className="px-5 py-3 text-muted-foreground">{r.location}</td>
                  <td className="px-5 py-3"><span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">{r.status}</span></td>
                  <td className="px-5 py-3">QAR {Number(r.price).toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      r.listing_status === "approved" ? "bg-emerald-50 text-emerald-700"
                      : r.listing_status === "pending" ? "bg-amber-50 text-amber-700"
                      : "bg-rose-50 text-rose-700"
                    }`}>{r.listing_status}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {isAdmin && r.listing_status !== "approved" && (
                        <button onClick={() => setStatus.mutate({ id: r.id, status: "approved" })} title="Approve" className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50"><CheckCircle2 className="h-4 w-4" /></button>
                      )}
                      {isAdmin && r.listing_status !== "rejected" && (
                        <button onClick={() => setStatus.mutate({ id: r.id, status: "rejected" })} title="Reject" className="rounded p-1.5 text-rose-600 hover:bg-rose-50"><XCircle className="h-4 w-4" /></button>
                      )}
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

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-semibold">{editing.id ? "Edit property" : "New property"}</h3>
            <form
              onSubmit={(e) => { e.preventDefault(); save.mutate(editing); }}
              className="mt-4 grid max-h-[70vh] grid-cols-2 gap-3 overflow-y-auto text-sm"
            >
              <Field label="Title" className="col-span-2"><input required value={editing.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className={inputCls} /></Field>
              <Field label="Location"><input required value={editing.location || ""} onChange={(e) => setEditing({ ...editing, location: e.target.value })} className={inputCls} /></Field>
              <Field label="Address"><input required value={editing.address || ""} onChange={(e) => setEditing({ ...editing, address: e.target.value })} className={inputCls} /></Field>
              <Field label="Type"><input required value={editing.type || ""} onChange={(e) => setEditing({ ...editing, type: e.target.value })} className={inputCls} /></Field>
              <Field label="Rent / Sale">
                <select value={editing.status || "rent"} onChange={(e) => setEditing({ ...editing, status: e.target.value as any })} className={inputCls}>
                  <option value="rent">Rent</option><option value="sale">Sale</option>
                </select>
              </Field>
              <Field label="Price (QAR)"><input type="number" required value={editing.price ?? 0} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} className={inputCls} /></Field>
              <Field label="Bedrooms"><input type="number" value={editing.bedrooms ?? 0} onChange={(e) => setEditing({ ...editing, bedrooms: Number(e.target.value) })} className={inputCls} /></Field>
              <Field label="Bathrooms"><input type="number" value={editing.bathrooms ?? 0} onChange={(e) => setEditing({ ...editing, bathrooms: Number(e.target.value) })} className={inputCls} /></Field>
              <Field label="Rooms"><input type="number" value={editing.rooms ?? 0} onChange={(e) => setEditing({ ...editing, rooms: Number(e.target.value) })} className={inputCls} /></Field>
              <Field label="Area (sqft)"><input type="number" value={editing.sqft ?? 0} onChange={(e) => setEditing({ ...editing, sqft: Number(e.target.value) })} className={inputCls} /></Field>
              <Field label="Image URL" className="col-span-2"><input value={editing.image || ""} onChange={(e) => setEditing({ ...editing, image: e.target.value })} className={inputCls} /></Field>
              <Field label="Description" className="col-span-2"><textarea rows={3} value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className={inputCls} /></Field>
              <Field label="Features (comma separated)" className="col-span-2">
                <input value={(editing.features || []).join(", ")} onChange={(e) => setEditing({ ...editing, features: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} className={inputCls} />
              </Field>

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
