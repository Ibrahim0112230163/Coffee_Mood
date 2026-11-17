import type { ReactNode } from "react";

export const inputClass =
  "h-11 w-full rounded-xl bg-foam px-4 ring-1 ring-latte outline-none transition focus:ring-2 focus:ring-caramel disabled:opacity-60";
export const textareaClass =
  "w-full rounded-xl bg-foam px-4 py-3 ring-1 ring-latte outline-none transition focus:ring-2 focus:ring-caramel disabled:opacity-60";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-mocha">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-coffee">{hint}</span>}
    </label>
  );
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-coffee">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function ReadOnlyNotice() {
  return (
    <div className="rounded-3xl bg-foam p-8 text-center ring-1 ring-latte">
      <p className="font-display text-2xl font-semibold">Managers only</p>
      <p className="mt-2 text-coffee">Ask an owner or manager of this café to make changes here.</p>
    </div>
  );
}
