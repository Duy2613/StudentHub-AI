import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = {
  default: "border-transparent bg-indigo-500/10 text-indigo-300 border border-indigo-500/20",
  secondary: "border-transparent bg-white/10 text-gray-200 border border-white/10",
  destructive: "border-transparent bg-rose-500/10 text-rose-300 border border-rose-500/20",
  outline: "text-gray-300 border border-white/10",
  expert: "bg-gradient-to-r from-amber-500/15 to-orange-500/15 text-amber-300 border border-amber-500/30",
  success: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
  cyan: "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30",
};

function Badge({ className, variant = "default", ...props }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
        badgeVariants[variant] || badgeVariants.default,
        className
      )}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
