import { useCallback, useMemo, useState } from "react";

export function useBulkSelection<T extends { id: string }>(items: T[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allIds = useMemo(() => items.map((i) => i.id), [items]);
  const selectedIds = useMemo(() => Array.from(selected), [selected]);
  const selectedItems = useMemo(
    () => items.filter((i) => selected.has(i.id)),
    [items, selected],
  );
  const allSelected = items.length > 0 && items.every((i) => selected.has(i.id));
  const someSelected = selectedIds.length > 0 && !allSelected;

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      if (allIds.every((id) => prev.has(id)) && allIds.length > 0) return new Set();
      return new Set(allIds);
    });
  }, [allIds]);

  const clear = useCallback(() => setSelected(new Set()), []);

  const isSelected = useCallback((id: string) => selected.has(id), [selected]);

  return {
    selected,
    selectedIds,
    selectedItems,
    allSelected,
    someSelected,
    count: selectedIds.length,
    toggle,
    toggleAll,
    clear,
    isSelected,
  };
}
