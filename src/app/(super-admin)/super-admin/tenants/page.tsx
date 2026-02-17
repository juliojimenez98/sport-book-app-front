"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Skeleton,
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Switch,
} from "@/components/ui";
import {
  Plus,
  Building2,
  Mail,
  Phone,
  Pencil,
  Trash2,
  Eye,
  Palette,
} from "lucide-react";
import { tenantsApi } from "@/lib/api";
import { Tenant, TenantForm } from "@/lib/types";
import { formatDate, slugify } from "@/lib/utils";

const tenantSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  slug: z
    .string()
    .min(2, "Mínimo 2 caracteres")
    .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  accentColor: z.string().optional(),
});

type TenantFormData = z.infer<typeof tenantSchema>;

// Default theme colors
const DEFAULT_COLORS = {
  primary: "#14b8a6",
  secondary: "#0d9488",
  accent: "#2dd4bf",
};

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Tenant | null>(null);
  const [isActiveValue, setIsActiveValue] = useState(true);

  // Color states
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_COLORS.primary);
  const [secondaryColor, setSecondaryColor] = useState(
    DEFAULT_COLORS.secondary,
  );
  const [accentColor, setAccentColor] = useState(DEFAULT_COLORS.accent);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
  });

  const nameValue = watch("name");

  useEffect(() => {
    loadTenants();
  }, []);

  // Auto-generate slug from name
  useEffect(() => {
    if (nameValue && !editingTenant) {
      setValue("slug", slugify(nameValue));
    }
  }, [nameValue, editingTenant, setValue]);

  const loadTenants = async () => {
    try {
      const response = await tenantsApi.list({ limit: 100 });
      // Handle both array response and paginated response
      const tenantsList = Array.isArray(response)
        ? response
        : response?.data || [];
      setTenants(tenantsList);
    } catch (error) {
      console.error("Error loading tenants:", error);
      toast.error("Error al cargar centros deportivos");
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingTenant(null);
    reset({ name: "", slug: "", email: "", phone: "" });
    setIsActiveValue(true);
    setPrimaryColor(DEFAULT_COLORS.primary);
    setSecondaryColor(DEFAULT_COLORS.secondary);
    setAccentColor(DEFAULT_COLORS.accent);
    setIsDialogOpen(true);
  };

  const openEditDialog = (tenant: Tenant) => {
    setEditingTenant(tenant);
    reset({
      name: tenant.name,
      slug: tenant.slug,
      email: tenant.email,
      phone: tenant.phone || "",
    });
    setIsActiveValue(tenant.isActive);
    setPrimaryColor(tenant.primaryColor || DEFAULT_COLORS.primary);
    setSecondaryColor(tenant.secondaryColor || DEFAULT_COLORS.secondary);
    setAccentColor(tenant.accentColor || DEFAULT_COLORS.accent);
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: TenantFormData) => {
    setIsSubmitting(true);
    try {
      const submitData = {
        ...data,
        isActive: isActiveValue,
        primaryColor: primaryColor || undefined,
        secondaryColor: secondaryColor || undefined,
        accentColor: accentColor || undefined,
      };
      if (editingTenant) {
        await tenantsApi.update(editingTenant.id, submitData);
        toast.success("Centro deportivo actualizado");
      } else {
        await tenantsApi.create(submitData);
        toast.success("Centro deportivo creado");
      }
      setIsDialogOpen(false);
      loadTenants();
    } catch (error) {
      toast.error(editingTenant ? "Error al actualizar" : "Error al crear");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (tenant: Tenant) => {
    try {
      await tenantsApi.delete(tenant.id);
      toast.success("Centro deportivo eliminado");
      setDeleteConfirm(null);
      loadTenants();
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Centros Deportivos</h1>
            <p className="text-muted-foreground">
              Gestiona los centros deportivos del sistema
            </p>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-1/3 mb-2" />
                <Skeleton className="h-4 w-1/4" />
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
          <h1 className="text-3xl font-bold">Centros Deportivos</h1>
          <p className="text-muted-foreground">
            Gestiona los centros deportivos del sistema ({tenants.length} total)
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo centro deportivo
        </Button>
      </div>

      {/* Tenants List */}
      {tenants.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium">No hay centros deportivos</p>
            <p className="text-muted-foreground mb-4">
              Crea tu primer centro deportivo para comenzar
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Crear centro deportivo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tenants.map((tenant) => (
            <Card key={tenant.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="h-12 w-12 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor: `${tenant.primaryColor || DEFAULT_COLORS.primary}20`,
                      }}
                    >
                      <Building2
                        className="h-6 w-6"
                        style={{
                          color: tenant.primaryColor || DEFAULT_COLORS.primary,
                        }}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{tenant.name}</h3>
                        <Badge
                          variant={tenant.isActive ? "success" : "secondary"}
                        >
                          {tenant.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                        {(tenant.primaryColor ||
                          tenant.secondaryColor ||
                          tenant.accentColor) && (
                          <div className="flex gap-1 ml-2">
                            {tenant.primaryColor && (
                              <div
                                className="w-4 h-4 rounded-full border"
                                style={{ backgroundColor: tenant.primaryColor }}
                                title="Color primario"
                              />
                            )}
                            {tenant.secondaryColor && (
                              <div
                                className="w-4 h-4 rounded-full border"
                                style={{
                                  backgroundColor: tenant.secondaryColor,
                                }}
                                title="Color secundario"
                              />
                            )}
                            {tenant.accentColor && (
                              <div
                                className="w-4 h-4 rounded-full border"
                                style={{ backgroundColor: tenant.accentColor }}
                                title="Color acento"
                              />
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        /{tenant.slug}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {tenant.email}
                        </span>
                        {tenant.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {tenant.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/super-admin/tenants/${tenant.id}/branches`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(tenant)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => setDeleteConfirm(tenant)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingTenant
                ? "Editar centro deportivo"
                : "Nuevo centro deportivo"}
            </DialogTitle>
            <DialogDescription>
              {editingTenant
                ? "Modifica los datos del centro deportivo"
                : "Completa el formulario para crear un nuevo centro deportivo"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                placeholder="Mi Centro Deportivo"
                {...register("name")}
                error={errors.name?.message}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input
                id="slug"
                placeholder="mi-centro-deportivo"
                {...register("slug")}
                error={errors.slug?.message}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@centrodeportivo.com"
                {...register("email")}
                error={errors.email?.message}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono (opcional)</Label>
              <Input
                id="phone"
                placeholder="+52 55 1234 5678"
                {...register("phone")}
                error={errors.phone?.message}
              />
            </div>

            {/* Theme Colors */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <Label>Colores del tema (opcional)</Label>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor" className="text-xs">
                    Primario
                  </Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      id="primaryColor"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#16a34a"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor" className="text-xs">
                    Secundario
                  </Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      id="secondaryColor"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border"
                    />
                    <Input
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      placeholder="#f97316"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accentColor" className="text-xs">
                    Acento
                  </Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      id="accentColor"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border"
                    />
                    <Input
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      placeholder="#8b5cf6"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Los colores personalizados se aplicarán a las páginas públicas
                de este centro deportivo.
              </p>
            </div>

            {editingTenant && (
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label htmlFor="isActive">Estado</Label>
                  <p className="text-sm text-muted-foreground">
                    {isActiveValue
                      ? "El centro deportivo está activo"
                      : "El centro deportivo está inactivo"}
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={isActiveValue}
                  onCheckedChange={setIsActiveValue}
                />
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                {editingTenant ? "Guardar cambios" : "Crear centro deportivo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar centro deportivo?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminarán todos los datos
              asociados a <strong>{deleteConfirm?.name}</strong>.
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
