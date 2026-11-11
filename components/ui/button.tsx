import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
export function Button({ asChild = false, variant = "primary", className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean; variant?: "primary" | "secondary" | "quiet" }) {
  const Component = asChild ? Slot : "button";
  return <Component className={cn("button", "button-" + variant, className)} {...props} />;
}
