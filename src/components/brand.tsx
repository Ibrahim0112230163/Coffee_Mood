import { Coffee } from "lucide-react";

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-display font-semibold tracking-tight ${className}`}>
      <span className="inline-flex size-[1.6em] items-center justify-center rounded-full bg-espresso text-honey">
        <Coffee className="size-[0.95em]" strokeWidth={2.4} />
      </span>
      Coffie<span className="italic text-caramel">Mood</span>
    </span>
  );
}
