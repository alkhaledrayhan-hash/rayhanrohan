import { ReactNode, useState } from "react";
import { Download, Trash2, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Props<T> = {
  count: number;
  selectedItems: T[];
  onClear: () => void;
  onDelete?: (items: T[]) => Promise<void> | void;
  entityName?: string;
  exportFilename?: string;
  exportColumns?: { key: keyof T | string; label: string; get?: (row: T) => any }[];
  children?: ReactNode;
};

export function BulkActionsBar<T extends { id: string }>({
  count,
  selectedItems,
  onClear,
  onDelete,
  entityName = "item",
  exportFilename = "export",
  exportColumns,
  children,
}: Props<T>) {
  const [deleting, setDeleting] = useState(false);
  if (count === 0) return null;

  const doExport = () => {
    if (!selectedItems.length) return;
    const cols: { key: keyof T | string; label: string; get?: (row: T) => any }[] =
      exportColumns ??
      Object.keys(selectedItems[0] as any).map((k) => ({ key: k, label: k }));
    const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const header = cols.map((c) => c.label).join(",");
    const rows = selectedItems.map((row) =>
      cols
        .map((c) => {
          const v = c.get ? c.get(row) : (row as any)[c.key as string];
          return esc(v);
        })
        .join(","),
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportFilename}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${selectedItems.length} ${entityName}(s)`);
  };

  const doDelete = async () => {
    if (!onDelete) return;
    if (!confirm(`Delete ${count} selected ${entityName}(s)? This cannot be undone.`)) return;
    try {
      setDeleting(true);
      await onDelete(selectedItems);
      onClear();
    } catch (e: any) {
      toast.error(e?.message || "Bulk delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="sticky top-0 z-20 flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 shadow-sm backdrop-blur">
      <button
        onClick={onClear}
        className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-2 py-1 text-xs hover:bg-muted"
        aria-label="Clear selection"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <span className="text-sm font-medium">
        {count} {entityName}
        {count !== 1 ? "s" : ""} selected
      </span>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {children}
        <button
          onClick={doExport}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
        >
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
        {onDelete && (
          <button
            onClick={doDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

export function SelectCheckbox({
  checked,
  indeterminate,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  ariaLabel?: string;
}) {
  return (
    <input
      type="checkbox"
      aria-label={ariaLabel}
      checked={checked}
      ref={(el) => {
        if (el) el.indeterminate = !!indeterminate;
      }}
      onChange={onChange}
      onClick={(e) => e.stopPropagation()}
      className="h-4 w-4 cursor-pointer rounded border-input accent-primary"
    />
  );
}
