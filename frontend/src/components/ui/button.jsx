import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = {
  variant: {
    default: "bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm active:scale-[0.98]",
    destructive: "bg-rose-600 text-white hover:bg-rose-500 shadow-sm active:scale-[0.98]",
    outline: "border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:text-white text-gray-200 active:scale-[0.98]",
    secondary: "bg-white/10 text-white hover:bg-white/15 border border-white/10 active:scale-[0.98]",
    ghost: "hover:bg-white/10 text-gray-300 hover:text-white",
    link: "text-indigo-400 underline-offset-4 hover:underline p-0 h-auto",
    glow: "bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 text-white shadow-neon-primary hover:brightness-110 active:scale-[0.98]",
    gradientCyan: "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-neon-cyan hover:brightness-110 active:scale-[0.98]",
  },
  size: {
    default: "h-10 px-4 py-2 text-sm",
    sm: "h-8 rounded-lg px-3 text-xs",
    lg: "h-12 rounded-xl px-6 text-base font-semibold",
    icon: "h-10 w-10 p-0 flex items-center justify-center",
  },
};

const Button = React.forwardRef(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = "button";
    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
          buttonVariants.variant[variant] || buttonVariants.variant.default,
          buttonVariants.size[size] || buttonVariants.size.default,
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
