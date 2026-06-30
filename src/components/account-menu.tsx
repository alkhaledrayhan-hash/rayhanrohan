import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LayoutDashboard, LogOut, Settings, ShieldCheck, User } from "lucide-react";

type MenuLink = {
  label: string;
  to: string;
  icon?: typeof LayoutDashboard;
};

export function AccountMenu({
  initials,
  fullName,
  roleLabel,
  email,
  avatarUrl,
  profileLink,
  extraLink,
  onProfile,
  onSettings,
  onSignOut,
}: {
  initials: string;
  fullName: string;
  roleLabel: string;
  email?: string | null;
  avatarUrl?: string | null;
  /** Navigate-style profile link. If omitted, use onProfile callback. */
  profileLink?: MenuLink;
  /** Extra link rendered above Settings (e.g. Admin/Agent panel). */
  extraLink?: MenuLink;
  onProfile?: () => void;
  onSettings: () => void;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onPointerDown(e: PointerEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [open]);

  const ProfileIcon = profileLink?.icon ?? User;
  const ExtraIcon = extraLink?.icon ?? ShieldCheck;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-border bg-white py-1 pl-1 pr-2 transition hover:bg-muted sm:pr-3"
      >
        <span className="grid h-7 w-7 place-items-center overflow-hidden rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </span>
        <span className="hidden flex-col text-left leading-tight sm:flex">
          <span className="max-w-[10rem] truncate text-xs font-semibold">{fullName}</span>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {roleLabel}
          </span>
        </span>
        <ChevronDown className={`hidden h-3.5 w-3.5 text-muted-foreground transition-transform sm:block ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          {/* Mobile backdrop for tap-outside-to-close */}
          <button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default bg-transparent sm:hidden"
          />
          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 w-[min(16rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl border border-border bg-white p-1 shadow-lg"
          >
          <div className="border-b border-border px-3 py-2.5">
            <p className="truncate text-sm font-semibold">{fullName}</p>
            {email && (
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{email}</p>
            )}
            <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">{roleLabel}</p>
          </div>

          {profileLink ? (
            <Link
              to={profileLink.to}
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ProfileIcon className="h-4 w-4" /> {profileLink.label}
            </Link>
          ) : onProfile ? (
            <button
              type="button"
              onClick={() => { setOpen(false); onProfile(); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ProfileIcon className="h-4 w-4" /> Profile
            </button>
          ) : null}

          {extraLink && (
            <Link
              to={extraLink.to}
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ExtraIcon className="h-4 w-4" /> {extraLink.label}
            </Link>
          )}

          <button
            type="button"
            onClick={() => { setOpen(false); onSettings(); }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Settings className="h-4 w-4" /> Settings
          </button>
          <div className="my-1 border-t border-border" />
          <button
            type="button"
            onClick={() => { setOpen(false); onSignOut(); }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
          </div>
        </>
      )}
    </div>
  );
}
