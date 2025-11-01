import { PropsWithChildren } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";

type BottomSheetProps = PropsWithChildren<{
  open: boolean;
  onOpenChange: (v: boolean) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}>;

export default function BottomSheet({ open, onOpenChange, size = "md", className, children }: BottomSheetProps) {
  const maxW = size === "sm" ? "max-w-md" : size === "lg" ? "max-w-2xl" : "max-w-xl";
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className={`rounded-t-3xl ${maxW} mx-auto ${className ?? ""}`}>
        <div className="w-12 h-1 rounded-full bg-muted mx-auto mb-4" />
        {children}
      </SheetContent>
    </Sheet>
  );
}

