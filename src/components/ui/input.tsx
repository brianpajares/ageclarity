import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export function Input({ className = "", invalid = false, ...props }: InputProps) {
  return (
    <input
      className={`field-input ${invalid ? "field-input--invalid" : ""} ${className}`.trim()}
      {...props}
    />
  );
}
