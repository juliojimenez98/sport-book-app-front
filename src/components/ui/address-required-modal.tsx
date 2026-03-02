"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";
import { usersApi } from "@/lib/api/endpoints";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/lib/toast";

interface AddressRequiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddressRequiredModal({
  open,
  onOpenChange,
  onSuccess,
}: AddressRequiredModalProps) {
  const { updateUser } = useAuth();
  const [address, setAddress] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!address.trim()) {
      toast.error("Por favor ingresa tu dirección");
      return;
    }

    setIsSaving(true);
    try {
      const updated = await usersApi.updateProfile({ address: address.trim() });
      updateUser({ address: updated.address });
      toast.success("Dirección guardada");
      setAddress("");
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Error al guardar la dirección");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !isSaving && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Dirección requerida
          </DialogTitle>
          <DialogDescription>
            Este centro deportivo requiere que registres tu dirección antes de
            hacer una reserva. Solo necesitas hacerlo una vez.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <label
            htmlFor="address-input"
            className="text-sm font-medium"
          >
            Tu dirección
          </label>
          <Input
            id="address-input"
            placeholder="Ej. Av. Providencia 1234, Santiago"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={isSaving}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            Puedes actualizar tu dirección en cualquier momento desde tu perfil.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} isLoading={isSaving}>
            Guardar y continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
