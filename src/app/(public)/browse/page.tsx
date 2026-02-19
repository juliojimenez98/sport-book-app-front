"use client";

import { useEffect, useState } from "react";
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
  Input,
} from "@/components/ui";
import {
  Building2,
  MapPin,
  Phone,
  ArrowRight,
  Search,
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

interface TenantWithBranches extends Tenant {
  branches?: Branch[];
}

export default function BrowsePage() {
  const [tenants, setTenants] = useState<TenantWithBranches[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setIsLoading(true);
      const data = await publicApi.getTenants();
      const list = Array.isArray(data)
        ? data
        : (data as unknown as { data: TenantWithBranches[] }).data || [];
      setTenants(list);
    } catch (error) {
      toast.error("Error al cargar los centros deportivos");
    } finally {
      setIsLoading(false);
    }
  };

  const getBranchAmenities = (branch: Branch) => {
    return AMENITIES.filter((amenity) => branch[amenity.key as keyof Branch]);
  };

  // Filter tenants by search
  const filteredTenants = tenants.filter((tenant) => {
    const q = search.toLowerCase();
    if (!q) return true;
    if (tenant.name.toLowerCase().includes(q)) return true;
    if (
      tenant.branches?.some(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.address?.toLowerCase().includes(q),
      )
    )
      return true;
    return false;
  });

  // Count total branches
  const totalBranches = tenants.reduce(
    (acc, t) => acc + (t.branches?.length || 0),
    0,
  );

  return (
    <>
      {/* Hero */}
      <section className="bg-linear-to-br from-primary/10 via-background to-secondary/10 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            Buscar canchas deportivas
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Explora los centros deportivos disponibles y reserva tu cancha
            favorita.
          </p>

          {/* Search */}
          <div className="max-w-lg mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, ubicación..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>

          <p className="text-sm text-muted-foreground mt-4">
            {tenants.length} centro{tenants.length !== 1 ? "s" : ""} deportivo
            {tenants.length !== 1 ? "s" : ""} · {totalBranches} sucursal
            {totalBranches !== 1 ? "es" : ""}
          </p>
        </div>
      </section>

      {/* Results */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-4" />
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredTenants.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h2 className="text-xl font-semibold mb-2">
                {search
                  ? "No se encontraron resultados"
                  : "No hay centros deportivos disponibles"}
              </h2>
              <p className="text-muted-foreground">
                {search
                  ? "Intenta con otra búsqueda"
                  : "Vuelve pronto para ver nuevos centros deportivos."}
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {filteredTenants.map((tenant) => (
                <div key={tenant.tenantId}>
                  {/* Tenant Header */}
                  <Link
                    href={`/${tenant.slug}`}
                    className="group inline-flex items-center gap-3 mb-4"
                  >
                    {tenant.logoUrl ? (
                      <img
                        src={tenant.logoUrl}
                        alt={tenant.name}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div>
                      <h2 className="text-xl font-bold group-hover:text-primary transition-colors">
                        {tenant.name}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {tenant.branches?.length || 0} sucursal
                        {(tenant.branches?.length || 0) !== 1 ? "es" : ""}
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </Link>

                  {/* Branches */}
                  {tenant.branches && tenant.branches.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {tenant.branches.map((branch) => {
                        const amenities = getBranchAmenities(branch);
                        return (
                          <Link
                            key={branch.branchId}
                            href={`/${tenant.slug}/${branch.slug}`}
                            className="block group/card"
                          >
                            <Card className="h-full hover:shadow-lg transition-all hover:border-primary/50">
                              <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <CardTitle className="text-lg group-hover/card:text-primary transition-colors">
                                      {branch.name}
                                    </CardTitle>
                                    {branch.address && (
                                      <CardDescription className="flex items-start gap-1 mt-1">
                                        <MapPin className="h-3 w-3 mt-1 shrink-0" />
                                        {branch.address}
                                      </CardDescription>
                                    )}
                                  </div>
                                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover/card:text-primary group-hover/card:translate-x-1 transition-all shrink-0" />
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
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Sin sucursales disponibles
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
