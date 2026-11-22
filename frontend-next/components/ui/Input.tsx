"use client";

import * as React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function Input({
  className,
  error,
  ...props
}: InputProps) {
  return (
    <input
      className={["input", error && "input-error", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

Input.displayName = "Input";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export function Select({
  className,
  error,
  ...props
}: SelectProps) {
  return (
    <select
      className={["input", error && "input-error", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

Select.displayName = "Select";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function Textarea({
  className,
  error,
  ...props
}: TextareaProps) {
  return (
    <textarea
      className={["input", error && "input-error", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

Textarea.displayName = "Textarea";

export interface FormFieldProps {
  label?: string;
  note?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  note,
  error,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={["form-field", className].filter(Boolean).join(" ")}>
      {label && <label>{label}</label>}
      {children}
      {note && <span className="form-field-note">{note}</span>}
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  );
}

FormField.displayName = "FormField";
