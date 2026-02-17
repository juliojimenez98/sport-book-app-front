"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
  Card,
  CardContent,
  Button,
  Skeleton,
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
  Switch,
} from "@/components/ui";
import {
  Plus,
  Building2,
  MapPin,
  Phone,
  Eye,
  Pencil,
  Car,
  Wifi,
  ShowerHead,
  Lock,
  Coffee,
  Dumbbell,
  Bath,
  Mail,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import { branchesApi } from "@/lib/api";
import { Branch, BranchForm } from "@/lib/types";

export default function TenantBranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toggle active dialog state
  const [isToggleDialogOpen, setIsToggleDialogOpen] = useState(false);
  const [toggleBranch, setToggleBranch] = useState<Branch | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<BranchForm>>({
    name: "",
    address: "",
    phone: "",
    email: "",
    hasParking: false,
    hasBathrooms: false,
    hasShowers: false,
    hasLockers: false,
    hasWifi: false,
    hasCafeteria: false,
    hasEquipmentRental: false,
    amenitiesDescription: "",
  });

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      const response = await branchesApi.list();
      const branchesList = Array.isArray(response)
        ? response
        : (response as { data?: Branch[] })?.data || [];
      setBranches(branchesList);
    } catch (error) {
      console.error("Error loading branches:", error);
      toast.error("Error al cargar sucursales");
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (branch: Branch) => {
    setSelectedBranch(branch);
    setFormData({
      name: branch.name,
      address: branch.address || "",
      phone: branch.phone || "",
      email: branch.email || "",
      hasParking: branch.hasParking || false,
      hasBathrooms: branch.hasBathrooms || false,
      hasShowers: branch.hasShowers || false,
      hasLockers: branch.hasLockers || false,
      hasWifi: branch.hasWifi || false,
      hasCafeteria: branch.hasCafeteria || false,
      hasEquipmentRental: branch.hasEquipmentRental || false,
      amenitiesDescription: branch.amenitiesDescription || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedBranch) return;

    setIsSubmitting(true);
    try {
      await branchesApi.update(selectedBranch.id, formData);
      toast.success("Sucursal actualizada correctamente");
      setIsEditDialogOpen(false);
      loadBranches();
    } catch (error) {
      console.error("Error updating branch:", error);
      toast.error("Error al actualizar sucursal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openToggleDialog = (branch: Branch) => {
    setToggleBranch(branch);
    setIsToggleDialogOpen(true);
  };

  const handleToggleActive = async () => {
    if (!toggleBranch) return;

    setIsToggling(true);
    try {
      await branchesApi.update(toggleBranch.id, {
        isActive: !toggleBranch.isActive,
      });
      toast.success(
        toggleBranch.isActive
          ? "Sucursal bloqueada correctamente"
          : "Sucursal desbloqueada correctamente",
      );
      setIsToggleDialogOpen(false);
      loadBranches();
    } catch (error) {
      console.error("Error toggling branch:", error);
      toast.error("Error al cambiar el estado de la sucursal");
    } finally {
      setIsToggling(false);
    }
  };

  const amenities = [
    { key: "hasParking", label: "Estacionamiento", icon: Car },
    { key: "hasBathrooms", label: "Baños", icon: Bath },
    { key: "hasShowers", label: "Duchas", icon: ShowerHead },
    { key: "hasLockers", label: "Lockers", icon: Lock },
    { key: "hasWifi", label: "WiFi", icon: Wifi },
    { key: "hasCafeteria", label: "Cafetería", icon: Coffee },
    { key: "hasEquipmentRental", label: "Renta de equipo", icon: Dumbbell },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Sucursales</h1>
            <p className="text-muted-foreground">
              Gestiona las sucursales de tu centro deportivo
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-1/2 mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sucursales</h1>
          <p className="text-muted-foreground">
            Gestiona las sucursales de tu centro deportivo ({branches.length}{" "}
            total)
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nueva sucursal
        </Button>
      </div>

      {branches.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium">No hay sucursales</p>
            <p className="text-muted-foreground mb-4">
              Crea tu primera sucursal para comenzar
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Crear sucursal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => (
            <Card key={branch.id} className={`overflow-hidden ${!branch.isActive ? "opacity-60 border-destructive/40" : ""}`}>
              <div className={`h-32 flex items-center justify-center ${branch.isActive ? "bg-linear-to-br from-primary/20 to-accent/20" : "bg-muted"}`}>
                <Building2 className="h-12 w-12 text-primary/50" />
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{branch.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      /{branch.slug}
                    </p>
                  </div>
                  <Badge variant={branch.isActive ? "success" : "secondary"}>
                    {branch.isActive ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
                {branch.address && (
                  <p className="text-sm text-muted-foreground mt-2 flex items-start gap-1">
                    <MapPin className="h-3 w-3 mt-1 shrink-0" />
                    {branch.address}
                  </p>
                )}
                {branch.phone && (
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {branch.phone}
                  </p>
                )}

                {/* Amenities indicators */}
                <div className="flex flex-wrap gap-1 mt-3">
                  {branch.hasParking && (
                    <span title="Estacionamiento">
                      <Car className="h-4 w-4 text-muted-foreground" />
                    </span>
                  )}
                  {branch.hasBathrooms && (
                    <span title="Baños">
                      <Bath className="h-4 w-4 text-muted-foreground" />
                    </span>
                  )}
                  {branch.hasShowers && (
                    <span title="Duchas">
                      <ShowerHead className="h-4 w-4 text-muted-foreground" />
                    </span>
                  )}
                  {branch.hasLockers && (
                    <span title="Lockers">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </span>
                  )}
                  {branch.hasWifi && (
                    <span title="WiFi">
                      <Wifi className="h-4 w-4 text-muted-foreground" />
                    </span>
                  )}
                  {branch.hasCafeteria && (
                    <span title="Cafetería">
                      <Coffee className="h-4 w-4 text-muted-foreground" />
                    </span>
                  )}
                  {branch.hasEquipmentRental && (
                    <span title="Renta de equipo">
                      <Dumbbell className="h-4 w-4 text-muted-foreground" />
                    </span>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    asChild
                  >
                    <Link
                      href={`/tenant-admin/branches/${branch.id}/resources`}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Canchas
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(branch)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={branch.isActive ? "outline" : "default"}
                    size="sm"
                    onClick={() => openToggleDialog(branch)}
                    title={branch.isActive ? "Bloquear sucursal" : "Desbloquear sucursal"}
                  >
                    {branch.isActive ? (
                      <ShieldOff className="h-4 w-4" />
                    ) : (
                      <ShieldCheck className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Branch Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar sucursal</DialogTitle>
            <DialogDescription>
              Modifica la información de {selectedBranch?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground">
                Información básica
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Nombre de la sucursal"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="Teléfono de contacto"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="email@sucursal.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Dirección completa"
                />
              </div>
            </div>

            {/* Amenities */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground">
                Amenidades
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                {amenities.map((amenity) => {
                  const Icon = amenity.icon;
                  return (
                    <div
                      key={amenity.key}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm">{amenity.label}</span>
                      </div>
                      <Switch
                        checked={
                          formData[amenity.key as keyof BranchForm] as boolean
                        }
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, [amenity.key]: checked })
                        }
                      />
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amenitiesDescription">
                  Descripción adicional de amenidades
                </Label>
                <Textarea
                  id="amenitiesDescription"
                  value={formData.amenitiesDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      amenitiesDescription: e.target.value,
                    })
                  }
                  placeholder="Información adicional sobre las instalaciones..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name || isSubmitting}
            >
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toggle Active Dialog */}
      <Dialog open={isToggleDialogOpen} onOpenChange={setIsToggleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {toggleBranch?.isActive ? "Bloquear sucursal" : "Desbloquear sucursal"}
            </DialogTitle>
            <DialogDescription>
              {toggleBranch?.isActive
                ? `¿Estás seguro de que deseas bloquear la sucursal "${toggleBranch?.name}"? No será visible para el público y no se podrán crear nuevas reservas.`
                : `¿Deseas desbloquear la sucursal "${toggleBranch?.name}"? Volverá a estar visible para el público y se podrán crear reservas.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsToggleDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant={toggleBranch?.isActive ? "destructive" : "default"}
              onClick={handleToggleActive}
              disabled={isToggling}
            >
              {isToggling
                ? "Procesando..."
                : toggleBranch?.isActive
                  ? "Bloquear"
                  : "Desbloquear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
