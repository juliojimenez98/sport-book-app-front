"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { toast } from "@/lib/toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  Badge,
} from "@/components/ui";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  Car,
  Wifi,
  ShowerHead,
  Lock,
  Coffee,
  Dumbbell,
  Bath,
} from "lucide-react";
import { publicApi } from "@/lib/api";
import { Tenant, Branch } from "@/lib/types";
import { useTenantTheme } from "@/components/TenantThemeProvider";
import { getAssetUrl } from "@/lib/api/endpoints";
import { ImageGallery } from "@/components/ui/image-gallery";

// Amenities configuration
const AMENITIES = [
  { key: "hasParking", label: "Estacionamiento", icon: Car },
  { key: "hasBathrooms", label: "Baños", icon: Bath },
  { key: "hasShowers", label: "Duchas", icon: ShowerHead },
  { key: "hasLockers", label: "Lockers", icon: Lock },
  { key: "hasWifi", label: "WiFi", icon: Wifi },
  { key: "hasCafeteria", label: "Cafetería", icon: Coffee },
  { key: "hasEquipmentRental", label: "Renta de equipo", icon: Dumbbell },
] as const;

export default function TenantPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const { applyTheme, clearTheme } = useTenantTheme();

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFoundError, setNotFoundError] = useState(false);

  useEffect(() => {
    loadTenant();
    return () => clearTheme();
  }, [tenantSlug]);

  const loadTenant = async () => {
    try {
      setIsLoading(true);
      const data = await publicApi.getTenantBySlug(tenantSlug);
      setTenant(data);
      applyTheme(data);
    } catch (error: any) {
      if (error.status === 404) {
        setNotFoundError(true);
      } else {
        toast.error("Error al cargar el centro deportivo");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getBranchAmenities = (branch: Branch) => {
    return AMENITIES.filter((amenity) => branch[amenity.key as keyof Branch]);
  };

  if (notFoundError) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center">
          <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h1 className="text-2xl font-bold mb-2">
            Centro deportivo no encontrado
          </h1>
          <p className="text-muted-foreground mb-4">
            El centro deportivo que buscas no existe o no está disponible.
          </p>
          <Link href="/" className="text-primary hover:underline">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-12 w-1/2 mb-2" />
          <Skeleton className="h-6 w-1/3 mb-8" />
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-2/3 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!tenant) return null;

  const branches = (tenant as any).branches || [];

  return (
    <>
      {/* Hero Section */}
      <section className="bg-linear-to-br from-primary/10 via-background to-secondary/10 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            {tenant.logoUrl && (
              <div className="h-20 w-20 mx-auto mb-6 rounded-lg overflow-hidden relative shadow-sm">
                <img
                  src={getAssetUrl(tenant.logoUrl)}
                  alt={tenant.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            )}
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              {tenant.name}
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Selecciona una sucursal para ver las canchas disponibles
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              {tenant.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {tenant.phone}
                </span>
              )}
              {tenant.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {tenant.email}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Branches Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">
              Nuestras Sucursales ({branches.length})
            </h2>

            {branches.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-lg font-medium">
                    No hay sucursales disponibles
                  </p>
                  <p className="text-muted-foreground">
                    Este centro deportivo aún no tiene sucursales activas.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {branches.map((branch: Branch) => {
                  const amenities = getBranchAmenities(branch);
                  return (
                    <Link
                      key={branch.branchId}
                      href={`/${tenantSlug}/${branch.slug}`}
                      className="block group"
                    >
                      <Card className="h-full hover:shadow-lg transition-all hover:border-primary/50 overflow-hidden flex flex-col">
                        <div className="h-40 relative bg-muted flex items-center justify-center shrink-0">
                          <ImageGallery 
                            images={branch.images?.map(i => getAssetUrl(i.imageUrl)) || []} 
                            alt={branch.name} 
                            hideThumbnails 
                            hideOverlay 
                            fallbackIcon={<Building2 className="h-10 w-10 text-primary/50" />}
                          />
                        </div>
                        <CardHeader className="pb-2 flex-none">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                                {branch.name}
                              </CardTitle>
                              {branch.address && (
                                <CardDescription className="flex items-start gap-1 mt-1">
                                  <MapPin className="h-3 w-3 mt-1 shrink-0" />
                                  {branch.address}
                                </CardDescription>
                              )}
                            </div>
                            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                          </div>
                        </CardHeader>
                        <CardContent>
                          {branch.phone && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
                              <Phone className="h-3 w-3" />
                              {branch.phone}
                            </p>
                          )}

                          {amenities.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {amenities.map((amenity) => {
                                const Icon = amenity.icon;
                                return (
                                  <Badge
                                    key={amenity.key}
                                    variant="secondary"
                                    className="gap-1 text-xs"
                                  >
                                    <Icon className="h-3 w-3" />
                                    {amenity.label}
                                  </Badge>
                                );
                              })}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
