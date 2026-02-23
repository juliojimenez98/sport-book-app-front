"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/lib/toast";
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
} from "@/components/ui";
import { tenantsApi } from "@/lib/api";
import { Tenant } from "@/lib/types";
import { ImageUpload } from "@/components/ui/image-upload";
import { useAuth } from "@/contexts/AuthContext";

const tenantSettingsSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  slug: z
    .string()
    .min(2, "Mínimo 2 caracteres")
    .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  logoUrl: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  images: z.array(z.string()).optional(),
});

type TenantSettingsFormData = z.infer<typeof tenantSettingsSchema>;

const DEFAULT_COLORS = {
  primary: "#14b8a6",
  secondary: "#0d9488",
  accent: "#2dd4bf",
};

export default function TenantSettingsPage() {
  const { user } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  } = useForm<TenantSettingsFormData>({
    resolver: zodResolver(tenantSettingsSchema),
  });

  const logoUrlValue = watch("logoUrl");
  const imagesValue = watch("images") || [];

  const tenantId = user?.roles?.find((r) => r.scope === "tenant")?.tenantId;

  useEffect(() => {
    if (tenantId) {
      loadTenant(tenantId);
    }
  }, [tenantId]);

  const loadTenant = async (id: number) => {
    try {
      const data = await tenantsApi.get(id);
      setTenant(data);
      reset({
        name: data.name,
        slug: data.slug,
        email: data.email,
        phone: data.phone || "",
        logoUrl: data.logoUrl || "",
        images: data.images?.map((img) => img.imageUrl) || [],
      });
      setPrimaryColor(data.primaryColor || DEFAULT_COLORS.primary);
      setSecondaryColor(data.secondaryColor || DEFAULT_COLORS.secondary);
      setAccentColor(data.accentColor || DEFAULT_COLORS.accent);
    } catch (error) {
      console.error("Error loading tenant:", error);
      toast.error("Error al cargar la información del centro deportivo");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: TenantSettingsFormData) => {
    if (!tenant) return;
    setIsSubmitting(true);
    try {
      const submitData = {
        ...data,
        primaryColor: primaryColor || undefined,
        secondaryColor: secondaryColor || undefined,
        accentColor: accentColor || undefined,
      };

      await toast.promise(tenantsApi.update(tenant.tenantId, submitData), {
        loading: "Actualizando configuración...",
        success: "Configuración actualizada con éxito",
        error: "Error al actualizar",
      });
      
      loadTenant(tenant.tenantId);
    } catch {
      // error handled by toast
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold">Configuración</h1>
          <p className="text-muted-foreground">
            Administra los datos públicos de tu centro deportivo
          </p>
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configuración</h1>
          <p className="text-muted-foreground">
            Administra los datos públicos de tu centro deportivo
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
            <CardDescription>
              Datos básicos de tu centro deportivo. Esta información será visible
              para tus clientes.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 text-muted-foreground opacity-80" title="Contacta a soporte técnico para cambiar este valor">
                <Label htmlFor="name">Nombre de la Empresa</Label>
                <Input
                  id="name"
                  {...register("name")}
                  readOnly
                  disabled
                  title="Contacta a soporte técnico para cambiar este valor"
                />
              </div>

              <div className="space-y-2 text-muted-foreground opacity-80" title="Contacta a soporte técnico para cambiar este valor">
                <Label htmlFor="slug">Slug (URL)</Label>
                <Input
                  id="slug"
                  {...register("slug")}
                  readOnly
                  disabled
                  title="Contacta a soporte técnico para cambiar este valor"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico (Público)</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="contacto@empresa.com"
                />
                {errors.email && (
                  <p className="text-sm text-destructive font-medium">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono (Público)</Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  placeholder="+56 9 1234 5678"
                />
                {errors.phone && (
                  <p className="text-sm text-destructive font-medium">
                    {errors.phone.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Logo de la Empresa</Label>
              <div className="max-w-xs">
                <ImageUpload
                  value={logoUrlValue}
                  onChange={(url) => setValue("logoUrl", url)}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Formatos recomendados: PNG o JPG transparente. Tamaño cuadrado.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Imágenes Adicionales</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Agrega fotos que representen a tu centro deportivo. Estas se
                mostrarán en la página pública del centro.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {imagesValue.map((url, index) => (
                  <div key={index} className="relative aspect-square">
                    <ImageUpload
                      value={url}
                      onChange={(newUrl) => {
                        const newImages = [...imagesValue];
                        // If empty string, user clicked X
                        if (!newUrl) {
                          newImages.splice(index, 1);
                        } else {
                          newImages[index] = newUrl;
                        }
                        setValue("images", newImages);
                      }}
                    />
                  </div>
                ))}
                {imagesValue.length < 5 && (
                  <div className="relative aspect-square">
                    <ImageUpload
                      onChange={(url) => {
                        if (url) {
                           setValue("images", [...imagesValue, url]);
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-4 pt-4 border-t">
               <h3 className="font-medium">Identidad Visual</h3>
               <div className="grid gap-4 md:grid-cols-3">
                 <div className="space-y-2">
                   <Label>Color Principal</Label>
                   <div className="flex gap-2">
                     <Input
                       type="color"
                       value={primaryColor}
                       onChange={(e) => setPrimaryColor(e.target.value)}
                       className="w-12 h-10 p-1 cursor-pointer"
                     />
                     <Input
                       type="text"
                       value={primaryColor}
                       onChange={(e) => setPrimaryColor(e.target.value)}
                       className="flex-1 uppercase font-mono"
                     />
                   </div>
                 </div>
                 <div className="space-y-2">
                   <Label>Color Secundario</Label>
                   <div className="flex gap-2">
                     <Input
                       type="color"
                       value={secondaryColor}
                       onChange={(e) => setSecondaryColor(e.target.value)}
                       className="w-12 h-10 p-1 cursor-pointer"
                     />
                     <Input
                       type="text"
                       value={secondaryColor}
                       onChange={(e) => setSecondaryColor(e.target.value)}
                       className="flex-1 uppercase font-mono"
                     />
                   </div>
                 </div>
                 <div className="space-y-2">
                   <Label>Color de Acento</Label>
                   <div className="flex gap-2">
                     <Input
                       type="color"
                       value={accentColor}
                       onChange={(e) => setAccentColor(e.target.value)}
                       className="w-12 h-10 p-1 cursor-pointer"
                     />
                     <Input
                       type="text"
                       value={accentColor}
                       onChange={(e) => setAccentColor(e.target.value)}
                       className="flex-1 uppercase font-mono"
                     />
                   </div>
                 </div>
               </div>
               
               <div className="mt-4 p-4 rounded-lg border bg-card">
                 <p className="text-sm font-medium mb-3">Vista Previa de Colores</p>
                 <div className="flex gap-2 h-16 rounded-md overflow-hidden">
                   <div className="flex-1" style={{ backgroundColor: primaryColor }} />
                   <div className="flex-1" style={{ backgroundColor: secondaryColor }} />
                   <div className="flex-1" style={{ backgroundColor: accentColor }} />
                 </div>
               </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (tenant) {
                 loadTenant(tenant.tenantId);
              }
            }}
            disabled={isSubmitting}
          >
            Descartar cambios
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar Configuración"}
          </Button>
        </div>
      </form>
    </div>
  );
}
