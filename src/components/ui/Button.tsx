import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm",
  secondary: "border border-border bg-card text-foreground hover:bg-muted",
  ghost: "text-foreground hover:bg-muted",
  danger: "bg-danger text-white hover:opacity-90",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: { variant?: Variant; size?: Size; className?: string } = {}): string {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors",
    "disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({ variant, size, loading, className, children, disabled, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
