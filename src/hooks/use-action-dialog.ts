"use client";

import { useState, useTransition } from "react";

export interface SimpleActionState {
  error?: string;
  success?: boolean;
}

/**
 * Drives a dialog (or any open/close UI) from a Server Action bound to a
 * plain <form action={...}>: tracks pending/error state and closes the
 * dialog on success — all inside the transition's own callback, never in a
 * useEffect (calling setState from an effect just to react to a state value
 * changing is the exact anti-pattern React's compiler now flags).
 */
export function useActionDialog(action: (formData: FormData) => Promise<SimpleActionState>) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isPending, startTransition] = useTransition();

  function handleAction(formData: FormData) {
    startTransition(async () => {
      const result = await action(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setError(undefined);
        setOpen(false);
      }
    });
  }

  return { open, setOpen, error, isPending, handleAction };
}
