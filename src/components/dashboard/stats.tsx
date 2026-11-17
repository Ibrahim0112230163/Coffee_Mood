import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function StatCard({ icon: Icon, label, value, hint }: { icon: LucideIcon; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-3xl bg-foam p-5 ring-1 ring-latte">
      <div className="flex items-center gap-2 text-sm font-semibold text-coffee">
        <Icon className="size-4 text-caramel" /> {label}
      </div>
      <p className="mt-3 font-display text-4xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-coffee">{hint}</p>}
    </div>
  );
}

export function BarList({ title, items, empty, footer }: { title: string; items: { label: string; count: number }[]; empty: string; footer?: ReactNode }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <div className="flex flex-col rounded-3xl bg-foam p-6 ring-1 ring-latte">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-coffee">{empty}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((i) => (
            <li key={i.label}>
              <div className="mb-1 flex justify-between gap-3 text-sm">
                <span className="truncate font-medium">{i.label}</span>
                <span className="tabular-nums text-coffee">{i.count}</span>
              </div>
              <div className="h-2 rounded-full bg-sand">
                <div className="h-full rounded-full bg-caramel" style={{ width: `${(i.count / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
      {footer && <p className="mt-auto pt-4 text-xs text-coffee">{footer}</p>}
    </div>
  );
}

export function DailyBars({ data }: { data: { day: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="mt-5 flex h-40 items-end gap-1.5 sm:gap-2" role="img" aria-label="Interactions per day for the last two weeks">
      {data.map((d) => {
        const date = new Date(`${d.day}T00:00:00`);
        return (
          <div key={d.day} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <span className="text-[10px] font-semibold tabular-nums text-coffee opacity-0 transition group-hover:opacity-100">{d.count}</span>
            <div
              className="w-full rounded-t-lg bg-caramel/80 transition group-hover:bg-caramel"
              style={{ height: `${Math.max(3, (d.count / max) * 100)}%` }}
              title={`${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}: ${d.count}`}
            />
            <span className="text-[10px] text-coffee">{date.getDate()}</span>
          </div>
        );
      })}
    </div>
  );
}
