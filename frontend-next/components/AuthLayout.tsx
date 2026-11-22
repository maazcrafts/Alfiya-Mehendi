"use client";

import * as React from "react";

export interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="auth-shell">
      <div className="auth-panel">
        {children}
      </div>
    </div>
  );
}
