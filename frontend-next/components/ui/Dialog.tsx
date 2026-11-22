"use client";

import * as React from "react";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: DialogProps) {
  if (!open) return null;

  return (
    <div
      className="dialog-overlay"
      onClick={() => onOpenChange(false)}
      role="dialog"
      aria-modal="true"
    >
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        {title && (
          <>
            <h2 className="dialog-title">{title}</h2>
            {description && (
              <p className="dialog-description">{description}</p>
            )}
          </>
        )}
        {children}
      </div>
    </div>
  );
}

Dialog.displayName = "Dialog";
