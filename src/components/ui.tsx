import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "dark" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand text-brand-ink shadow-soft hover:brightness-110 active:brightness-95",
  secondary: "bg-foam text-espresso ring-1 ring-latte hover:bg-white hover:ring-caramel/60",
  ghost: "text-mocha hover:bg-sand/70",
  dark: "bg-espresso text-foam hover:bg-mocha",
  danger: "bg-red-50 text-red-700 ring-1 ring-red-200 hover:bg-red-100",
};

const SIZES = {
  sm: "h-9 px-3.5 text-sm gap-1.5",
  md: "h-11 px-5 text-[15px] gap-2",
  lg: "h-14 px-7 text-base gap-2.5",
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: keyof typeof SIZES;
  loading?: boolean;
  icon?: ReactNode;
}

export function buttonClass(variant: Variant = "primary", size: keyof typeof SIZES = "md", extra = "") {
  return `inline-flex items-center justify-center rounded-full font-semibold transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none select-none ${VARIANTS[variant]} ${SIZES[size]} ${extra}`;
}

export function Button({ variant = "primary", size = "md", loading, icon, className = "", children, disabled, ...rest }: ButtonProps) {
  return (
    <button className={buttonClass(variant, size, className)} disabled={disabled || loading} {...rest}>
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}

export function Pill({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-sand px-3 py-1 text-xs font-semibold text-mocha ${className}`}>
      {children}
    </span>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl bg-foam ring-1 ring-latte/70 shadow-soft ${className}`}>{children}</div>;
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-10 text-sm text-coffee">
      <Loader2 className="size-5 animate-spin" aria-hidden />
      {label}
    </div>
  );
}
