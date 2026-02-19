"use client";

import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
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
  Clock,
  CalendarDays,
  ClipboardCheck,
} from "lucide-react";
import { Branch, BranchForm, RoleName, RoleScope, Region, Comuna } from "@/lib/types";
import { publicApi, branchesApi, tenantsApi } from "@/lib/api";
import { useAuth } from "@/contexts";

export default function TenantBranchesPage() {
  const { user: currentUser } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [regions, setRegions] = useState<Region[]>([]);

  // Create dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createFormData, setCreateFormData] = useState<BranchForm>({
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
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const data = await publicApi.getLocations();
      const list = Array.isArray(data)
        ? data
        : (data as unknown as { regions: Region[] }).regions || [];
      setRegions(list);
    } catch (error) {
      console.error("Error loading locations:", error);
    }
  };

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
      regionId: branch.regionId || "",
      comunaId: branch.comunaId || "",
      hasParking: branch.hasParking || false,
      hasBathrooms: branch.hasBathrooms || false,
      hasShowers: branch.hasShowers || false,
      hasLockers: branch.hasLockers || false,
      hasWifi: branch.hasWifi || false,
      hasCafeteria: branch.hasCafeteria || false,
      hasEquipmentRental: branch.hasEquipmentRental || false,
      amenitiesDescription: branch.amenitiesDescription || "",
      requiresApproval: branch.requiresApproval || false,
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedBranch) return;

    setIsSubmitting(true);
    try {
      await toast.promise(
        branchesApi.update(selectedBranch.branchId, formData),
        {
          loading: "Actualizando sucursal...",
          success: "Sucursal actualizada correctamente",
          error: "Error al actualizar sucursal",
        },
      );
      setIsEditDialogOpen(false);
      loadBranches();
    } catch {
      // error already handled by toast.promise
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
      const msg = toggleBranch.isActive
        ? "Bloqueando sucursal..."
        : "Desbloqueando sucursal...";
      const successMsg = toggleBranch.isActive
        ? "Sucursal bloqueada correctamente"
        : "Sucursal desbloqueada correctamente";
      await toast.promise(
        branchesApi.update(toggleBranch.branchId, {
          isActive: !toggleBranch.isActive,
        }),
        {
          loading: msg,
          success: successMsg,
          error: "Error al cambiar el estado de la sucursal",
        },
      );
      setIsToggleDialogOpen(false);
      loadBranches();
    } catch {
      // error already handled by toast.promise
    } finally {
      setIsToggling(false);
    }
  };

  // Get tenant ID from current user's role
  const tenantRole = currentUser?.roles?.find((r) => {
    const roleName = r.roleName || r.role?.name;
    return (
      roleName === RoleName.TENANT_ADMIN &&
      (r.scope === RoleScope.TENANT || r.tenantId)
    );
  });
  const tenantId = tenantRole?.tenantId;

  const openCreateDialog = () => {
    setCreateFormData({
      name: "",
      address: "",
      phone: "",
      email: "",
      regionId: "",
      comunaId: "",
      hasParking: false,
      hasBathrooms: false,
      hasShowers: false,
      hasLockers: false,
      hasWifi: false,
      hasCafeteria: false,
      hasEquipmentRental: false,
      amenitiesDescription: "",
      requiresApproval: false,
    });
    setIsCreateDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!tenantId || !createFormData.name) return;

    setIsCreating(true);
    // Remove empty strings for optional fields
    const dataToSubmit = { ...createFormData };
    if (!dataToSubmit.regionId) delete dataToSubmit.regionId;
    if (!dataToSubmit.comunaId) delete dataToSubmit.comunaId;

    try {
      await toast.promise(tenantsApi.createBranch(tenantId, dataToSubmit), {
        loading: "Creando sucursal...",
        success: "Sucursal creada correctamente",
        error: "Error al crear sucursal",
      });
      setIsCreateDialogOpen(false);
      loadBranches();
    } catch {
      // error already handled by toast.promise
    } finally {
      setIsCreating(false);
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
        <Button onClick={openCreateDialog}>
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
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Crear sucursal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => (
            <Card
              key={branch.branchId}
              className={`overflow-hidden ${!branch.isActive ? "opacity-60 border-destructive/40" : ""}`}
            >
              <div
                className={`h-32 flex items-center justify-center ${branch.isActive ? "bg-linear-to-br from-primary/20 to-accent/20" : "bg-muted"}`}
              >
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
                      href={`/tenant-admin/branches/${branch.branchId}/resources`}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Canchas
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild title="Horarios">
                    <Link
                      href={`/tenant-admin/branches/${branch.branchId}/hours`}
                    >
                      <Clock className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    title="Calendario"
                  >
                    <Link
                      href={`/tenant-admin/branches/${branch.branchId}/calendar`}
                    >
                      <CalendarDays className="h-4 w-4" />
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
                    title={
                      branch.isActive
                        ? "Bloquear sucursal"
                        : "Desbloquear sucursal"
                    }
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

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="region">Región</Label>
                  <select
                    id="region"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.regionId || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        regionId: e.target.value,
                        comunaId: "", // Reset comuna when region changes
                      })
                    }
                  >
                    <option value="">Selecciona una región</option>
                    {regions.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.romanNumber} - {region.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comuna">Comuna</Label>
                  <select
                    id="comuna"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.comunaId || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, comunaId: e.target.value })
                    }
                    disabled={!formData.regionId}
                  >
                    <option value="">Selecciona una comuna</option>
                    {formData.regionId &&
                      regions
                        .find((r) => r.id === formData.regionId)
                        ?.communes.map((comuna) => (
                          <option key={comuna.id} value={comuna.id}>
                            {comuna.name}
                          </option>
                        ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección (calle y número)</Label>
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

            {/* Booking Settings */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground">
                Configuración de reservas
              </h3>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <span className="text-sm font-medium">
                      Requiere aprobación
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Las reservas quedarán pendientes hasta que un
                      administrador las confirme
                    </p>
                  </div>
                </div>
                <Switch
                  checked={formData.requiresApproval as boolean}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, requiresApproval: checked })
                  }
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
              {toggleBranch?.isActive
                ? "Bloquear sucursal"
                : "Desbloquear sucursal"}
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

      {/* Create Branch Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva sucursal</DialogTitle>
            <DialogDescription>
              Crea una nueva sucursal para tu centro deportivo
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
                  <Label htmlFor="create-name">Nombre *</Label>
                  <Input
                    id="create-name"
                    value={createFormData.name}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        name: e.target.value,
                      })
                    }
                    placeholder="Ej: Sede Central"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-phone">Teléfono</Label>
                  <Input
                    id="create-phone"
                    value={createFormData.phone}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        phone: e.target.value,
                      })
                    }
                    placeholder="+56 9 1234 5678"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-email">Email</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={createFormData.email}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      email: e.target.value,
                    })
                  }
                  placeholder="sucursal@centro.cl"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="create-region">Región</Label>
                  <select
                    id="create-region"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={createFormData.regionId || ""}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        regionId: e.target.value,
                        comunaId: "", // Reset comuna when region changes
                      })
                    }
                  >
                    <option value="">Selecciona una región</option>
                    {regions.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.romanNumber} - {region.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-comuna">Comuna</Label>
                  <select
                    id="create-comuna"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={createFormData.comunaId || ""}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        comunaId: e.target.value,
                      })
                    }
                    disabled={!createFormData.regionId}
                  >
                    <option value="">Selecciona una comuna</option>
                    {createFormData.regionId &&
                      regions
                        .find((r) => r.id === createFormData.regionId)
                        ?.communes.map((comuna) => (
                          <option key={comuna.id} value={comuna.id}>
                            {comuna.name}
                          </option>
                        ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-address">Dirección (calle y número)</Label>
                <Input
                  id="create-address"
                  value={createFormData.address}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      address: e.target.value,
                    })
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
                          createFormData[
                            amenity.key as keyof BranchForm
                          ] as boolean
                        }
                        onCheckedChange={(checked) =>
                          setCreateFormData({
                            ...createFormData,
                            [amenity.key]: checked,
                          })
                        }
                      />
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-amenitiesDescription">
                  Descripción adicional de amenidades
                </Label>
                <Textarea
                  id="create-amenitiesDescription"
                  value={createFormData.amenitiesDescription}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      amenitiesDescription: e.target.value,
                    })
                  }
                  placeholder="Información adicional sobre las instalaciones..."
                  rows={3}
                />
              </div>
            </div>

            {/* Booking Settings */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground">
                Configuración de reservas
              </h3>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <span className="text-sm font-medium">
                      Requiere aprobación
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Las reservas quedarán pendientes hasta que un
                      administrador las confirme
                    </p>
                  </div>
                </div>
                <Switch
                  checked={createFormData.requiresApproval as boolean}
                  onCheckedChange={(checked) =>
                    setCreateFormData({
                      ...createFormData,
                      requiresApproval: checked,
                    })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!createFormData.name || isCreating}
            >
              {isCreating ? "Creando..." : "Crear sucursal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
