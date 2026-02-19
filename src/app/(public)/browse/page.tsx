"use client";

import { useEffect, useState, useCallback } from "react";
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
  X,
  Filter,
} from "lucide-react";
import { publicApi } from "@/lib/api";
import { Branch, Sport, Region } from "@/lib/types";

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

export default function BrowsePage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Filters
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedComuna, setSelectedComuna] = useState("");
  const [selectedSport, setSelectedSport] = useState("");

  useEffect(() => {
    loadFiltersData();
  }, []);

  const loadFiltersData = async () => {
    try {
      const [locData, sportsData] = await Promise.all([
        publicApi.getLocations(),
        publicApi.getSports(),
      ]);
      const locRegions = Array.isArray(locData)
        ? locData
        : (locData as unknown as { regions: Region[] }).regions || [];
      setRegions(locRegions);
      const sList = Array.isArray(sportsData)
        ? sportsData
        : (sportsData as unknown as { data: Sport[] }).data || [];
      setSports(sList);
    } catch {
      // Filters will be empty
    }
  };

  const loadBranches = useCallback(async () => {
    try {
      setIsLoading(true);
      const filters: { comunaId?: string; regionId?: string; sportId?: number } = {};
      if (selectedComuna) filters.comunaId = selectedComuna;
      else if (selectedRegion) filters.regionId = selectedRegion;
      if (selectedSport) filters.sportId = parseInt(selectedSport);

      const data = await publicApi.getBranches(
        Object.keys(filters).length > 0 ? filters : undefined,
      );
      const list = Array.isArray(data)
        ? data
        : (data as unknown as { data: Branch[] }).data || [];
      setBranches(list);
    } catch {
      toast.error("Error al cargar las sucursales");
    } finally {
      setIsLoading(false);
    }
  }, [selectedComuna, selectedRegion, selectedSport]);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  const getBranchAmenities = (branch: Branch) => {
    return AMENITIES.filter((amenity) => branch[amenity.key as keyof Branch]);
  };

  // Communes for selected region
  const communesForRegion = regions.find((r) => r.id === selectedRegion)?.communes || [];

  // Filter by text search (client-side)
  const filteredBranches = branches.filter((branch) => {
    const q = search.toLowerCase();
    if (!q) return true;
    if (branch.name.toLowerCase().includes(q)) return true;
    if (branch.address?.toLowerCase().includes(q)) return true;
    if (branch.tenant?.name.toLowerCase().includes(q)) return true;
    return false;
  });

  const hasActiveFilters = selectedRegion || selectedComuna || selectedSport;

  const clearFilters = () => {
    setSelectedRegion("");
    setSelectedComuna("");
    setSelectedSport("");
  };

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

          {/* Filters */}
          <div className="max-w-3xl mx-auto mt-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground font-medium">
                Filtrar por
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {/* Region filter */}
              <select
                value={selectedRegion}
                onChange={(e) => {
                  setSelectedRegion(e.target.value);
                  setSelectedComuna("");
                }}
                className="h-10 px-3 rounded-md border border-input bg-background text-sm min-w-[180px]"
              >
                <option value="">Todas las regiones</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.romanNumber} - {region.name}
                  </option>
                ))}
              </select>

              {/* Comuna filter (dependent on region) */}
              <select
                value={selectedComuna}
                onChange={(e) => setSelectedComuna(e.target.value)}
                disabled={!selectedRegion}
                className="h-10 px-3 rounded-md border border-input bg-background text-sm min-w-[180px] disabled:opacity-50"
              >
                <option value="">Todas las comunas</option>
                {communesForRegion.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Sport filter */}
              <select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className="h-10 px-3 rounded-md border border-input bg-background text-sm min-w-[160px]"
              >
                <option value="">Todos los deportes</option>
                {sports.map((sport) => (
                  <option key={sport.sportId} value={sport.sportId}>
                    {sport.name}
                  </option>
                ))}
              </select>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 h-10 px-3 rounded-md border border-destructive/30 text-destructive text-sm hover:bg-destructive/10 transition-colors"
                >
                  <X className="h-4 w-4" />
                  Limpiar
                </button>
              )}
            </div>
          </div>

          <p className="text-sm text-muted-foreground mt-4">
            {filteredBranches.length} sucursal
            {filteredBranches.length !== 1 ? "es" : ""} encontrada
            {filteredBranches.length !== 1 ? "s" : ""}
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
          ) : filteredBranches.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h2 className="text-xl font-semibold mb-2">
                {search || hasActiveFilters
                  ? "No se encontraron resultados"
                  : "No hay sucursales disponibles"}
              </h2>
              <p className="text-muted-foreground">
                {search || hasActiveFilters
                  ? "Intenta con otra búsqueda o cambia los filtros"
                  : "Vuelve pronto para ver nuevos centros deportivos."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredBranches.map((branch) => {
                const amenities = getBranchAmenities(branch);
                return (
                  <Link
                    key={branch.branchId}
                    href={`/${branch.tenant?.slug}/${branch.slug}`}
                    className="block group/card"
                  >
                    <Card className="h-full hover:shadow-lg transition-all hover:border-primary/50">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg group-hover/card:text-primary transition-colors">
                              {branch.name}
                            </CardTitle>
                            {branch.tenant && (
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {branch.tenant.name}
                              </p>
                            )}
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

                        {/* Sports badges */}
                        {branch.sports && branch.sports.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {branch.sports.map((sport) => (
                              <Badge key={sport.sportId} variant="default" className="text-xs">
                                {sport.name}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Amenities */}
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
      </section>
    </>
  );
}
