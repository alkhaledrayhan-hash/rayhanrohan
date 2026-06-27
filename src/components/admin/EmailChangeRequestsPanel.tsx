import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check, MailQuestion, X } from "lucide-react";
import {
  approveEmailChange,
  listAllEmailChangeRequests,
  rejectEmailChange,
} from "@/lib/email-change.functions";

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

  const rows = ((data?.requests ?? []) as Row[]).filter(
    (r) => filter === "all" || r.status === filter,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-white p-3">
        <MailQuestion className="h-4 w-4 text-primary" />
        <p className="text-sm font-medium">Email change requests</p>
        <div className="ml-auto flex gap-1">
          {(["pending", "approved", "rejected", "all"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full border px-3 py-1 text-xs capitalize ${
                filter === s
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="responsive-table-wrap overflow-x-auto rounded-2xl border border-border bg-white">
        <table className="responsive-table w-full min-w-[720px] text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Current → New</th>
              <th className="px-4 py-3">Reason</th>
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
                <td className="px-4 py-3">
                  <p className="font-medium">{r.profile?.full_name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{r.profile?.email}</p>
                </td>
                <td className="px-4 py-3 text-xs">
                  <p className="text-muted-foreground line-through">{r.current_email}</p>
                  <p className="font-medium">{r.new_email}</p>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs">
                  {r.reason || "—"}
                  {r.admin_note && (
                    <p className="mt-1 italic">Admin note: {r.admin_note}</p>
                  )}
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
