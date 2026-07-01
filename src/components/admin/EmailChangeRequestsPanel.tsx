import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check, MailQuestion, Search, X } from "lucide-react";
import { ThemedSelect } from "@/components/ui/themed-select";
import {
  approveEmailChange,
  listAllEmailChangeRequests,
  rejectEmailChange,
} from "@/lib/email-change.functions";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { BulkActionsBar, SelectCheckbox } from "@/components/admin/BulkActionsBar";

type Row = {
  id: string;
  user_id: string;
  current_email: string;
  new_email: string;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
  profile: { full_name: string | null; email: string | null } | null;
};

const statusCls: Record<Row["status"], string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
};

export function EmailChangeRequestsPanel() {
  const listFn = useServerFn(listAllEmailChangeRequests);
  const approveFn = useServerFn(approveEmailChange);
  const rejectFn = useServerFn(rejectEmailChange);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["email-change-requests"],
    queryFn: () => listFn(),
  });
  const [filter, setFilter] = useState<"all" | Row["status"]>("pending");
  const [noteFor, setNoteFor] = useState<{ id: string; action: "approve" | "reject" } | null>(
    null,
  );
  const [note, setNote] = useState("");

  const mut = useMutation({
    mutationFn: ({ id, action, admin_note }: { id: string; action: "approve" | "reject"; admin_note: string }) =>
      action === "approve"
        ? approveFn({ data: { id, admin_note } })
        : rejectFn({ data: { id, admin_note } }),
    onSuccess: (_, vars) => {
      toast.success(vars.action === "approve" ? "Email changed" : "Request rejected");
      qc.invalidateQueries({ queryKey: ["email-change-requests"] });
      qc.invalidateQueries({ queryKey: ["all-users"] });
      setNoteFor(null);
      setNote("");
    },
    onError: (e: any) => toast.error(e.message || "Failed"),
  });

  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const all = (data?.requests ?? []) as Row[];
    const term = q.trim().toLowerCase();
    return all.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (!term) return true;
      return [r.current_email, r.new_email, r.profile?.full_name, r.profile?.email, r.reason]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term));
    });
  }, [data?.requests, filter, q]);

  const bulk = useBulkSelection(rows);
  const bulkRun = async (action: "approve" | "reject") => {
    const items = bulk.selectedItems.filter((r) => r.status === "pending");
    if (!items.length) { toast.info("No pending items selected"); return; }
    let ok = 0;
    for (const r of items) {
      try {
        if (action === "approve") await approveFn({ data: { id: r.id, admin_note: "" } });
        else await rejectFn({ data: { id: r.id, admin_note: "" } });
        ok++;
      } catch (e: any) { toast.error(e.message); }
    }
    if (ok) toast.success(`${action === "approve" ? "Approved" : "Rejected"} ${ok}`);
    qc.invalidateQueries({ queryKey: ["email-change-requests"] });
    qc.invalidateQueries({ queryKey: ["all-users"] });
    bulk.clear();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-white p-3 shadow-sm sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 sm:hidden">
          <MailQuestion className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium">Email change requests</p>
        </div>
        <MailQuestion className="hidden h-4 w-4 text-primary sm:block" />
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by user, current or new email…"
            className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <ThemedSelect
          value={filter}
          onChange={(v: string) => setFilter(v as typeof filter)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 sm:w-44"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All status</option>
        </ThemedSelect>
      </div>

      <BulkActionsBar
        count={bulk.count}
        selectedItems={bulk.selectedItems}
        onClear={bulk.clear}
        entityName="request"
        exportFilename="email-change-requests"
        exportColumns={[
          { key: "current_email", label: "Current" },
          { key: "new_email", label: "New" },
          { key: "status", label: "Status" },
          { key: "created_at", label: "Submitted" },
        ]}
      >
        <button onClick={() => bulkRun("approve")} className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-700 hover:bg-emerald-100">Approve all</button>
        <button onClick={() => bulkRun("reject")} className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-100">Reject all</button>
      </BulkActionsBar>

      <div className="responsive-table-wrap rounded-2xl border border-border bg-white">
        <table className="responsive-table w-full min-w-[620px] text-sm">
          <colgroup>
            <col style={{ width: "40px" }} />
            <col style={{ width: "150px" }} />
            <col />
            <col style={{ width: "110px" }} />
            <col style={{ width: "130px" }} />
            <col style={{ width: "126px" }} />
          </colgroup>
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-3 w-10"><SelectCheckbox checked={bulk.allSelected} indeterminate={bulk.someSelected} onChange={bulk.toggleAll} ariaLabel="Select all" /></th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Current → New</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && !rows.length && (
              <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No requests.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border align-top">
                <td className="px-3 py-3"><SelectCheckbox checked={bulk.isSelected(r.id)} onChange={() => bulk.toggle(r.id)} ariaLabel="Select request" /></td>
                <td className="px-4 py-3">
                  <p className="admin-cell font-medium" title={r.profile?.full_name || undefined}>{r.profile?.full_name || "—"}</p>
                  <p className="admin-cell text-xs text-muted-foreground" title={r.profile?.email || undefined}>{r.profile?.email}</p>
                </td>
                <td className="px-4 py-3 text-xs">
                  <p className="admin-cell text-muted-foreground line-through" title={r.current_email}>{r.current_email}</p>
                  <p className="admin-cell font-medium" title={r.new_email}>{r.new_email}</p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${statusCls[r.status]}`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  {r.status === "pending" && (
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setNoteFor({ id: r.id, action: "approve" });
                          setNote("");
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-100"
                      >
                        <Check className="h-3 w-3" /> Approve
                      </button>
                      <button
                        onClick={() => {
                          setNoteFor({ id: r.id, action: "reject" });
                          setNote("");
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-600 hover:bg-rose-100"
                      >
                        <X className="h-3 w-3" /> Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {noteFor && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
          onClick={() => setNoteFor(null)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              mut.mutate({ id: noteFor.id, action: noteFor.action, admin_note: note.trim() });
            }}
            className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h3 className="font-display text-lg font-semibold capitalize">
              {noteFor.action} email change
            </h3>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Optional note for the user…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <button
                type="button"
                onClick={() => setNoteFor(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={mut.isPending}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60 ${
                  noteFor.action === "approve" ? "bg-emerald-600" : "bg-rose-600"
                }`}
              >
                {mut.isPending ? "Working…" : noteFor.action === "approve" ? "Approve" : "Reject"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
