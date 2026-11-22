"use client";

import * as React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "default";
  asChild?: boolean;
}

function Button({
  className,
  variant = "primary",
  size = "default",
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? React.Fragment : "button";

  const base = "btn";

  const variants = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    ghost: "btn-ghost",
  };

  const sizes = {
    sm: "btn-sm",
    default: "",
  };

  return (
    <Comp
      className={[base, variants[variant], sizes[size], className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

Button.displayName = "Button";

export { Button };
