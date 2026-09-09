import React from "react";
import Link from "next/link";

const VARIANT_CLASS = Object.freeze({
  primary: "vnext-button-primary",
  secondary: "vnext-button-secondary",
  quiet: "vnext-button-quiet",
  danger: "vnext-button-danger",
});

const SIZE_CLASS = Object.freeze({
  sm: "vnext-button-sm",
  md: "vnext-button-md",
  lg: "vnext-button-lg",
});

export function VNextButton({
  href,
  children,
  variant = "primary",
  size = "md",
  className = "",
  isLoading = false,
  disabled = false,
  type = "button",
  ...props
}) {
  const classes = [
    "vnext-button",
    VARIANT_CLASS[variant] || VARIANT_CLASS.primary,
    SIZE_CLASS[size] || SIZE_CLASS.md,
    className,
  ].filter(Boolean).join(" ");

  const content = isLoading ? "Đang xử lý" : children;

  if (href) {
    return (
      <Link className={classes} aria-disabled={disabled || undefined} {...props} href={href}>
        {content}
      </Link>
    );
  }

  return (
    <button
      className={classes}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {content}
    </button>
  );
}

export default VNextButton;
