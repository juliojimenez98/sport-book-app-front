"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
  Button,
} from "@/components/ui";
import {
  Building2,
  MapPin,
  Phone,
  ArrowLeft,
  Clock,
  DollarSign,
  Car,
  Wifi,
  ShowerHead,
  Lock,
  Coffee,
  Dumbbell,
  Bath,
} from "lucide-react";
import { publicApi } from "@/lib/api";
import { Tenant, Branch, Resource } from "@/lib/types";
import { useTenantTheme } from "@/components/TenantThemeProvider";
import { formatCurrency } from "@/lib/utils";

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

export default function BranchPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const branchSlug = params.branchSlug as string;
  const { applyTheme, clearTheme } = useTenantTheme();

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFoundError, setNotFoundError] = useState(false);

  useEffect(() => {
    loadBranch();
    return () => clearTheme();
  }, [tenantSlug, branchSlug]);

  const loadBranch = async () => {
    try {
      setIsLoading(true);
      const data = await publicApi.getBranchBySlug(tenantSlug, branchSlug);
      setTenant(data.tenant);
      setBranch(data.branch);
      setResources((data.branch as any).resources || []);
      applyTheme(data.tenant);
    } catch (error: any) {
      if (error.status === 404) {
        setNotFoundError(true);
      } else {
        toast.error("Error al cargar la sucursal");
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
          <h1 className="text-2xl font-bold mb-2">Sucursal no encontrada</h1>
          <p className="text-muted-foreground mb-4">
            La sucursal que buscas no existe o no está disponible.
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
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-10 w-1/2 mb-2" />
        <Skeleton className="h-6 w-1/3 mb-8" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-0">
                <Skeleton className="h-40 rounded-t-lg" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!tenant || !branch) return null;

  const amenities = getBranchAmenities(branch);

  return (
    <>
      {/* Header */}
      <section className="bg-linear-to-br from-primary/10 via-background to-secondary/10 py-12">
        <div className="container mx-auto px-4">
          <Link
            href={`/${tenantSlug}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver a {tenant.name}
          </Link>

          <div className="max-w-4xl">
            <p className="text-sm text-muted-foreground mb-1">{tenant.name}</p>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
              {branch.name}
            </h1>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
              {branch.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {branch.address}
                </span>
              )}
              {branch.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {branch.phone}
                </span>
              )}
            </div>

            {amenities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {amenities.map((amenity) => {
                  const Icon = amenity.icon;
                  return (
                    <Badge
                      key={amenity.key}
                      variant="secondary"
                      className="gap-1.5"
                    >
                      <Icon className="h-3 w-3" />
                      {amenity.label}
                    </Badge>
                  );
                })}
              </div>
            )}

            {branch.amenitiesDescription && (
              <p className="mt-4 text-sm text-muted-foreground">
                {branch.amenitiesDescription}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">
            Canchas Disponibles ({resources.length})
          </h2>

          {resources.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium">
                  No hay canchas disponibles
                </p>
                <p className="text-muted-foreground">
                  Esta sucursal aún no tiene canchas activas.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {resources.map((resource) => (
                <Card
                  key={resource.resourceId}
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="h-40 bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <span className="text-4xl">
                      {resource.sport?.name === "Fútbol" && "⚽"}
                      {resource.sport?.name === "Tenis" && "🎾"}
                      {resource.sport?.name === "Pádel" && "🏸"}
                      {resource.sport?.name === "Básquetbol" && "🏀"}
                      {resource.sport?.name === "Voleibol" && "🏐"}
                      {!resource.sport?.name && "🏟️"}
                    </span>
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{resource.name}</CardTitle>
                    <CardDescription>
                      {resource.sport?.name || "Cancha"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {resource.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {resource.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {resource.slotMinutes} min
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-primary">
                        <DollarSign className="h-4 w-4" />
                        {formatCurrency(
                          resource.pricePerHour,
                          resource.currency,
                        )}
                        /hr
                      </span>
                    </div>

                    <Button asChild className="w-full">
                      <Link
                        href={`/${tenantSlug}/${branchSlug}/${resource.resourceId}`}
                      >
                        Ver disponibilidad
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
