"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from "@/components/ui";
import {
  Plus,
  Activity,
  Clock,
  DollarSign,
  Pencil,
  Trash2,
  ArrowLeft,
  Building2,
} from "lucide-react";
import { branchesApi, resourcesApi, sportsApi } from "@/lib/api";
import { Resource, Sport, Branch, ResourceForm } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export default function TenantBranchResourcesPage() {
  const params = useParams();
  const branchId = parseInt(params.branchId as string);

  const [branch, setBranch] = useState<Branch | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create/Edit dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete dialog
  const [deleteConfirm, setDeleteConfirm] = useState<Resource | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<ResourceForm>>({
    name: "",
    sportId: 0,
    description: "",
    pricePerHour: 0,
    currency: "CLP",
    slotMinutes: 60,
  });

  const loadData = useCallback(async () => {
    if (!branchId) return;

    try {
      const [branchData, resourcesData, sportsData] = await Promise.all([
        branchesApi.get(branchId),
        branchesApi.getResources(branchId),
        sportsApi.list(),
      ]);

      setBranch(branchData);
      setResources(resourcesData);

      const sportsList = Array.isArray(sportsData) ? sportsData : [];
      setSports(sportsList);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Error al cargar datos");
    } finally {
      setIsLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateDialog = () => {
    setEditingResource(null);
    setFormData({
      name: "",
      sportId: sports.length > 0 ? sports[0].id : 0,
      description: "",
      pricePerHour: 15000,
      currency: "CLP",
      slotMinutes: 60,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (resource: Resource) => {
    setEditingResource(resource);
    setFormData({
      name: resource.name,
      sportId: resource.sportId,
      description: resource.description || "",
      pricePerHour: resource.pricePerHour,
      currency: resource.currency || "CLP",
      slotMinutes: resource.slotMinutes,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.sportId || !formData.pricePerHour) {
      toast.error("Completa todos los campos requeridos");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingResource) {
        await resourcesApi.update(editingResource.id, formData);
        toast.success("Cancha actualizada");
      } else {
        await branchesApi.createResource(branchId, formData as ResourceForm);
        toast.success("Cancha creada");
      }
      setIsDialogOpen(false);
      loadData();
    } catch (error: any) {
      console.error("Error saving resource:", error);
      toast.error(error?.message || "Error al guardar cancha");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (resource: Resource) => {
    try {
      await resourcesApi.delete(resource.id);
      toast.success("Cancha eliminada");
      setDeleteConfirm(null);
      loadData();
    } catch (error) {
      toast.error("Error al eliminar cancha");
    }
  };

  if (!branchId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Sucursal no válida</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/tenant-admin/branches">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Canchas</h1>
            <p className="text-muted-foreground flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              {branch?.name || "Sucursal"} — {resources.length} canchas
            </p>
          </div>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva cancha
        </Button>
      </div>

      {/* Resources List */}
      {resources.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium">No hay canchas</p>
            <p className="text-muted-foreground mb-4">
              Crea la primera cancha para esta sucursal
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Crear cancha
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <Card key={resource.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{resource.name}</CardTitle>
                    <Badge variant="outline" className="mt-1">
                      {resource.sport?.name || "Sin deporte"}
                    </Badge>
                  </div>
                  <Badge variant={resource.isActive ? "success" : "secondary"}>
                    {resource.isActive ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {resource.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {resource.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {resource.slotMinutes} min
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-primary">
                    <DollarSign className="h-4 w-4" />
                    {formatCurrency(resource.pricePerHour, resource.currency)}
                    /hr
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditDialog(resource)}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setDeleteConfirm(resource)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingResource ? "Editar cancha" : "Nueva cancha"}
            </DialogTitle>
            <DialogDescription>
              {editingResource
                ? `Modifica los datos de ${editingResource.name}`
                : `Agrega una nueva cancha a ${branch?.name}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="res-name">Nombre *</Label>
              <Input
                id="res-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ej: Cancha 1, Cancha Techada A"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="res-sport">Deporte *</Label>
              <Select
                value={formData.sportId?.toString() || ""}
                onValueChange={(v) =>
                  setFormData({ ...formData, sportId: parseInt(v) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un deporte" />
                </SelectTrigger>
                <SelectContent>
                  {sports.map((sport) => (
                    <SelectItem key={sport.id} value={sport.id.toString()}>
                      {sport.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="res-description">Descripción</Label>
              <Textarea
                id="res-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descripción de la cancha (opcional)"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="res-price">Precio por hora (CLP) *</Label>
                <Input
                  id="res-price"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.pricePerHour}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pricePerHour: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="15000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="res-slot">Duración slot (min) *</Label>
                <Select
                  value={formData.slotMinutes?.toString() || "60"}
                  onValueChange={(v) =>
                    setFormData({ ...formData, slotMinutes: parseInt(v) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="60">60 minutos</SelectItem>
                    <SelectItem value="90">90 minutos</SelectItem>
                    <SelectItem value="120">120 minutos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.pricePerHour ? (
              <p className="text-sm text-muted-foreground">
                Precio: {formatCurrency(formData.pricePerHour, "CLP")} por hora
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !formData.name || !formData.sportId || !formData.pricePerHour
              }
              isLoading={isSubmitting}
            >
              {editingResource ? "Guardar cambios" : "Crear cancha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar cancha?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará{" "}
              <strong>{deleteConfirm?.name}</strong> y todas sus reservas
              asociadas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
