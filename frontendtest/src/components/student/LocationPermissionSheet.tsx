import { MapPin } from "lucide-react";
import BottomSheet from "@/components/common/BottomSheet";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAllow: () => void;
  onLater?: () => void;
};

export default function LocationPermissionSheet({ open, onOpenChange, onAllow, onLater }: Props) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} size="md">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 grid place-items-center">
          <MapPin className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-bold">Location Required for Check-in</h3>
          <p className="text-sm text-muted-foreground mt-1">
            To verify your attendance via QR code, please allow the app to access your device’s location.
          </p>
        </div>
        <div className="w-full space-y-3">
          <Button className="w-full" size="lg" onClick={onAllow}>Allow Location Access</Button>
          <button type="button" className="text-sm text-muted-foreground w-full" onClick={onLater}>Maybe Later</button>
        </div>
      </div>
    </BottomSheet>
  );
}

