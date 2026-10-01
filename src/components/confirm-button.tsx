"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";

/** Button, der vor einer endgültigen Aktion nachfragt. */
export function ConfirmButton({
  onConfirm,
  question,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "onClick"> & {
  onConfirm: () => Promise<void>;
  question: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      {...props}
      disabled={pending || props.disabled}
      onClick={() => {
        if (window.confirm(question)) startTransition(onConfirm);
      }}
    >
      {children}
    </Button>
  );
}
