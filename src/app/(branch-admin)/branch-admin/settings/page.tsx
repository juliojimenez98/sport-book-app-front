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
  Switch,
  Textarea,
} from "@/components/ui";
import { branchesApi } from "@/lib/api";
import { Branch } from "@/lib/types";
import { ImageUpload } from "@/components/ui/image-upload";
import { useAuth } from "@/contexts/AuthContext";

const branchSettingsSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  timezone: z.string().optional(),
  regionId: z.string().optional(),
  comunaId: z.string().optional(),
  hasParking: z.boolean().optional(),
  hasBathrooms: z.boolean().optional(),
  hasShowers: z.boolean().optional(),
  hasLockers: z.boolean().optional(),
  hasWifi: z.boolean().optional(),
  hasCafeteria: z.boolean().optional(),
  hasEquipmentRental: z.boolean().optional(),
  amenitiesDescription: z.string().optional(),
  images: z.array(z.string()).optional(),
});

type BranchSettingsFormData = z.infer<typeof branchSettingsSchema>;

export default function BranchSettingsPage() {
  const { getBranchId } = useAuth();
  const [branch, setBranch] = useState<Branch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BranchSettingsFormData>({
    resolver: zodResolver(branchSettingsSchema),
  });

  const imagesValue = watch("images") || [];
  const branchId = getBranchId();

  useEffect(() => {
    if (branchId) {
      loadBranch(branchId);
    }
  }, [branchId]);

  const loadBranch = async (id: number) => {
    try {
      const data = await branchesApi.get(id);
      setBranch(data);
      reset({
        name: data.name,
        address: data.address || "",
        phone: data.phone || "",
        email: data.email || "",
        timezone: data.timezone || "America/Santiago",
        regionId: data.regionId || "",
        comunaId: data.comunaId || "",
        hasParking: data.hasParking || false,
        hasBathrooms: data.hasBathrooms || false,
        hasShowers: data.hasShowers || false,
        hasLockers: data.hasLockers || false,
        hasWifi: data.hasWifi || false,
        hasCafeteria: data.hasCafeteria || false,
        hasEquipmentRental: data.hasEquipmentRental || false,
        amenitiesDescription: data.amenitiesDescription || "",
        images: data.images?.map((img) => img.imageUrl) || [],
      });
    } catch (error) {
      console.error("Error loading branch:", error);
      toast.error("Error al cargar la información de la sucursal");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: BranchSettingsFormData) => {
    if (!branchId) return;
    setIsSubmitting(true);
    try {
      await toast.promise(branchesApi.update(branchId, data), {
        loading: "Actualizando sucursal...",
        success: "Sucursal actualizada con éxito",
        error: "Error al actualizar",
      });
      loadBranch(branchId);
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
          <h1 className="text-3xl font-bold">Configuración de Sucursal</h1>
          <p className="text-muted-foreground">
            Administra los datos de esta sucursal
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
          <h1 className="text-3xl font-bold">Configuración de Sucursal</h1>
          <p className="text-muted-foreground">
            Administra los datos públicos y características de tu sucursal
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
            <CardDescription>
              Datos básicos de contacto y ubicación de la sucursal.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Sucursal</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Sucursal Principal"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="sucursal@empresa.com"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  placeholder="+56 9 1234 5678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  {...register("address")}
                  placeholder="Av. Principal 123, Ciudad"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Imágenes de la Sucursal</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {imagesValue.map((url, index) => (
                  <div key={index} className="relative aspect-square">
                    <ImageUpload
                      value={url}
                      onChange={(newUrl) => {
                        const newImages = [...imagesValue];
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comodidades y Servicios</CardTitle>
            <CardDescription>
              Marca los servicios que ofrece esta sucursal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="hasParking"
                  checked={watch("hasParking")}
                  onCheckedChange={(checked) => setValue("hasParking", !!checked)}
                />
                <Label htmlFor="hasParking">Estacionamiento</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="hasBathrooms"
                  checked={watch("hasBathrooms")}
                  onCheckedChange={(checked) => setValue("hasBathrooms", !!checked)}
                />
                <Label htmlFor="hasBathrooms">Baños</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="hasShowers"
                  checked={watch("hasShowers")}
                  onCheckedChange={(checked) => setValue("hasShowers", !!checked)}
                />
                <Label htmlFor="hasShowers">Duchas</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="hasLockers"
                  checked={watch("hasLockers")}
                  onCheckedChange={(checked) => setValue("hasLockers", !!checked)}
                />
                <Label htmlFor="hasLockers">Lockers</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="hasWifi"
                  checked={watch("hasWifi")}
                  onCheckedChange={(checked) => setValue("hasWifi", !!checked)}
                />
                <Label htmlFor="hasWifi">WiFi</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="hasCafeteria"
                  checked={watch("hasCafeteria")}
                  onCheckedChange={(checked) => setValue("hasCafeteria", !!checked)}
                />
                <Label htmlFor="hasCafeteria">Cafetería</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="hasEquipmentRental"
                  checked={watch("hasEquipmentRental")}
                  onCheckedChange={(checked) => setValue("hasEquipmentRental", !!checked)}
                />
                <Label htmlFor="hasEquipmentRental">Arriendo Equipos</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amenitiesDescription">Descripción Adicional</Label>
              <Textarea
                id="amenitiesDescription"
                {...register("amenitiesDescription")}
                placeholder="Describe otros servicios o detalles importantes..."
                className="h-32"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (branchId) loadBranch(branchId);
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
