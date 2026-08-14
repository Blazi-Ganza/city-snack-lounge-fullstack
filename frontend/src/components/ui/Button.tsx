import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

const variantStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-[var(--brand-1)] text-white hover:bg-[var(--brand-2)]",
  secondary: "bg-[var(--ink)] text-white hover:bg-slate-900",
  ghost: "border border-[var(--line)] bg-[var(--panel)] text-[var(--ink)] hover:bg-[var(--bg-soft)]",
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-1)] disabled:cursor-not-allowed disabled:opacity-60",
        "font-ui",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}