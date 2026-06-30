import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Drop-in themed replacement for native <select>.
 *
 * - Accepts <option value="x">Label</option> children (or `options` prop).
 * - Same API surface: value / defaultValue / onChange(value) / className / placeholder / disabled / name / required.
 * - Internally renders the Radix Select so hover/focus/selected colors follow
 *   the site's design tokens instead of the browser's native blue.
 */

type Option = {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
};

export interface ThemedSelectProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onValueChange?: (value: string) => void;
  options?: Option[];
  children?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
}

const EMPTY_SENTINEL = "__themed_select_empty__";

function toInner(v: string | undefined): string | undefined {
  if (v === undefined) return undefined;
  return v === "" ? EMPTY_SENTINEL : v;
}

function fromInner(v: string): string {
  return v === EMPTY_SENTINEL ? "" : v;
}

function extractOptions(children: React.ReactNode): Option[] {
  const out: Option[] = [];
  React.Children.forEach(children, (child) => {
    if (!child || typeof child !== "object") return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const el = child as any;
    if (el.type === "option") {
      const val = el.props.value ?? (typeof el.props.children === "string" ? el.props.children : "");
      out.push({
        value: String(val),
        label: el.props.children,
        disabled: el.props.disabled,
      });
    } else if (el.type === "optgroup") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      React.Children.forEach(el.props.children, (c: any) => {
        if (!c || c.type !== "option") return;
        const val = c.props.value ?? (typeof c.props.children === "string" ? c.props.children : "");
        out.push({
          value: String(val),
          label: c.props.children,
          disabled: c.props.disabled,
        });
      });
    }
  });
  return out;
}

export function ThemedSelect({
  value,
  defaultValue,
  onChange,
  onValueChange,
  options,
  children,
  className,
  contentClassName,
  placeholder,
  disabled,
  required,
  name,
}: ThemedSelectProps) {
  const opts = options ?? extractOptions(children);

  const handle = (raw: string) => {
    const v = fromInner(raw);
    onChange?.(v);
    onValueChange?.(v);
  };

  return (
    <Select
      value={value !== undefined ? toInner(value) : undefined}
      defaultValue={defaultValue !== undefined ? toInner(defaultValue) : undefined}
      onValueChange={handle}
      disabled={disabled}
      required={required}
      name={name}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={contentClassName}>
        {opts.map((o) => (
          <SelectItem
            key={o.value}
            value={toInner(o.value) as string}
            disabled={o.disabled}
          >
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default ThemedSelect;
