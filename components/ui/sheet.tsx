"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;

export function SheetContent({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-charcoal/45 backdrop-blur-sm" />
      <Dialog.Content
        className={cn(
          "fixed left-0 top-0 z-50 h-dvh w-[86vw] max-w-sm overflow-y-auto bg-cream p-5 shadow-luxury outline-none",
          className
        )}
      >
        <Dialog.Close className="absolute right-4 top-4 rounded-full p-2 text-charcoal/70 hover:bg-primary/10">
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </Dialog.Close>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  );
}

export function SheetTitle({ children }: { children: React.ReactNode }) {
  return (
    <Dialog.Title className="font-heading text-2xl text-maroon">
      {children}
    </Dialog.Title>
  );
}
