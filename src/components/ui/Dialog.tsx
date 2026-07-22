"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;

export function DialogContent({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  /** Accessible title for screen readers (visually provided by content). */
  label: string;
}) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="dialog-overlay fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
      <RadixDialog.Content
        aria-describedby={undefined}
        className={cn(
          "dialog-content fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2",
          "overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl focus:outline-none",
          className,
        )}
      >
        <RadixDialog.Title className="sr-only">{label}</RadixDialog.Title>
        <RadixDialog.Close
          className="absolute right-3 top-3 z-10 rounded-md p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-text focus-visible:ring-2 focus-visible:ring-accent/50"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </RadixDialog.Close>
        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}
