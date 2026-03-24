"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "@/lib/toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Skeleton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
} from "@/components/ui";
import {
  ArrowLeft,
  GraduationCap,
  Calendar,
  Clock,
  Users,
  DollarSign,
  CheckCircle2,
  XCircle,
  SlidersHorizontal,
  X,
  Search,
} from "lucide-react";
import { classesApi, sportsApi, publicApi } from "@/lib/api/endpoints";
import { SportClass, Sport, Tenant, Branch } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantTheme } from "@/components/TenantThemeProvider";

const SPORT_EMOJI: Record<string, string> = {
  Fútbol: "⚽", Tenis: "🎾", Pádel: "🏸", Básquetbol: "🏀",
  Voleibol: "🏐", Natación: "🏊", Yoga: "🧘", Boxeo: "🥊",
};

const DOW_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function getTimeOfDay(isoString: string): "mañana" | "tarde" | "noche" {
  const h = new Date(isoString).getHours();
  if (h < 12) return "mañana";
  if (h < 18) return "tarde";
  return "noche";
}

export default function BranchClassesPublicPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;
  const branchSlug = params.branchSlug as string;
  const { user } = useAuth();
  const { applyTheme, clearTheme } = useTenantTheme();

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [classes, setClasses] = useState<SportClass[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [enrolledClassIds, setEnrolledClassIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // ── filters ─────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [sportFilter, setSportFilter] = useState("all");
  const [instructorFilter, setInstructorFilter] = useState("all");
  const [courtFilter, setCourtFilter] = useState("all");
  const [dowFilter, setDowFilter] = useState("all");       // "all" | "0"–"6"
  const [timeOfDayFilter, setTimeOfDayFilter] = useState("all"); // all | mañana | tarde | noche
  const [availabilityFilter, setAvailabilityFilter] = useState("all"); // all | available | full | myClasses
  const [priceFilter, setPriceFilter] = useState("all");   // all | free | paid

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const branchData = await publicApi.getBranchBySlug(tenantSlug, branchSlug);
      setTenant(branchData.tenant);
      setBranch(branchData.branch);
      applyTheme(branchData.tenant);

      const [classesData, sportsData] = await Promise.all([
        classesApi.getByBranch(branchData.branch.branchId, { upcoming: false }),
        sportsApi.list(),
      ]);
      setClasses(classesData);
      setSports(Array.isArray(sportsData) ? sportsData : []);

      if (user) {
        try {
          const myEnrollments = await classesApi.getMyEnrollments();
          setEnrolledClassIds(new Set(myEnrollments.map((e) => e.classId)));
        } catch { /* not critical */ }
      }
    } catch {
      toast.error("Error al cargar las clases");
    } finally {
      setIsLoading(false);
    }
  }, [tenantSlug, branchSlug, user]);

  useEffect(() => {
    loadData();
    return () => clearTheme();
  }, [loadData]);

  // ── derived filter options ────────────────────────────────────────────
  const instructors = useMemo(() => {
    const set = new Set<string>();
    classes.forEach((c) => { if (c.instructor) set.add(c.instructor); });
    return [...set].sort();
  }, [classes]);

  const courts = useMemo(() => {
    const map = new Map<number, string>();
    classes.forEach((c) => { if (c.resourceId && c.resource?.name) map.set(c.resourceId, c.resource.name); });
    return [...map.entries()];
  }, [classes]);

  const availableSports = useMemo(
    () => sports.filter((s) => classes.some((c) => c.sportId === s.sportId)),
    [classes, sports],
  );

  // ── active filter count ───────────────────────────────────────────────
  const activeFilterCount = [
    search, sportFilter !== "all", instructorFilter !== "all",
    courtFilter !== "all", dowFilter !== "all",
    timeOfDayFilter !== "all", availabilityFilter !== "all", priceFilter !== "all",
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSearch(""); setSportFilter("all"); setInstructorFilter("all");
    setCourtFilter("all"); setDowFilter("all"); setTimeOfDayFilter("all");
    setAvailabilityFilter("all"); setPriceFilter("all");
  };

  // ── filtered classes ──────────────────────────────────────────────────
  const filteredClasses = useMemo(() => {
    return classes.filter((sc) => {
      const spotsLeft = sc.spotsLeft ?? sc.maxCapacity;
      const isEnrolled = enrolledClassIds.has(sc.classId);

      if (search && !sc.name.toLowerCase().includes(search.toLowerCase()) &&
          !sc.instructor?.toLowerCase().includes(search.toLowerCase()) &&
          !sc.description?.toLowerCase().includes(search.toLowerCase())) return false;
      if (sportFilter !== "all" && sc.sportId.toString() !== sportFilter) return false;
      if (instructorFilter !== "all" && sc.instructor !== instructorFilter) return false;
      if (courtFilter !== "all" && sc.resourceId?.toString() !== courtFilter) return false;
      if (dowFilter !== "all" && new Date(sc.startsAt).getDay().toString() !== dowFilter) return false;
      if (timeOfDayFilter !== "all" && getTimeOfDay(sc.startsAt) !== timeOfDayFilter) return false;
      if (availabilityFilter === "available" && spotsLeft === 0) return false;
      if (availabilityFilter === "full" && spotsLeft > 0) return false;
      if (availabilityFilter === "myClasses" && !isEnrolled) return false;
      if (priceFilter === "free" && sc.price > 0) return false;
      if (priceFilter === "paid" && sc.price === 0) return false;

      return true;
    });
  }, [classes, search, sportFilter, instructorFilter, courtFilter, dowFilter, timeOfDayFilter, availabilityFilter, priceFilter, enrolledClassIds]);

  // ── enroll / cancel ───────────────────────────────────────────────────
  const handleEnroll = async (sc: SportClass) => {
    if (!user) {
      toast.info("Debes iniciar sesión para inscribirte");
      router.push(`/login?redirect=/${tenantSlug}/${branchSlug}/classes`);
      return;
    }
    setEnrollingId(sc.classId);
    try {
      const result = await classesApi.enroll(sc.classId);
      toast.success(`¡Inscripción exitosa! Quedan ${result.spotsLeft} cupo${result.spotsLeft !== 1 ? "s" : ""}.`);
      setEnrolledClassIds((prev) => new Set([...prev, sc.classId]));
      setClasses((prev) => prev.map((c) => c.classId === sc.classId ? { ...c, spotsLeft: result.spotsLeft } : c));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Error al inscribirse");
    } finally {
      setEnrollingId(null);
    }
  };

  const handleCancelEnrollment = async (sc: SportClass) => {
    setEnrollingId(sc.classId);
    try {
      const result = await classesApi.cancelEnrollment(sc.classId);
      toast.success("Inscripción cancelada");
      setEnrolledClassIds((prev) => { const n = new Set(prev); n.delete(sc.classId); return n; });
      setClasses((prev) => prev.map((c) => c.classId === sc.classId ? { ...c, spotsLeft: result.spotsLeft } : c));
    } catch {
      toast.error("Error al cancelar inscripción");
    } finally {
      setEnrollingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-1/2" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-9 w-full mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <section className="bg-linear-to-br from-primary/10 via-background to-secondary/10 py-12">
        <div className="container mx-auto px-4">
          <Link
            href={`/${tenantSlug}/${branchSlug}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver a {branch?.name}
          </Link>
          <div className="max-w-4xl">
            <p className="text-sm text-muted-foreground mb-1">{tenant?.name} · {branch?.name}</p>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              Clases Deportivas
            </h1>
            <p className="text-muted-foreground">
              Inscríbete en clases grupales y conoce cuántos cupos quedan disponibles.
            </p>
          </div>
        </div>
      </section>

      {/* Classes Section */}
      <section className="py-10">
        <div className="container mx-auto px-4">

          {/* ── Filter bar ── */}
          <div className="mb-6 space-y-3">
            {/* Search + toggle */}
            <div className="flex gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Buscar por nombre, instructor..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters((v) => !v)}
                className="gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filtros
                {activeFilterCount > 0 && (
                  <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="icon" onClick={resetFilters} title="Limpiar filtros">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Expanded filter panel */}
            {showFilters && (
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 p-4 border rounded-xl bg-muted/20">
                {/* Sport */}
                {availableSports.length > 1 && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Deporte</label>
                    <Select value={sportFilter} onValueChange={setSportFilter}>
                      <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {availableSports.map((s) => (
                          <SelectItem key={s.sportId} value={s.sportId.toString()}>
                            {SPORT_EMOJI[s.name] ?? "🏃"} {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Instructor */}
                {instructors.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Instructor</label>
                    <Select value={instructorFilter} onValueChange={setInstructorFilter}>
                      <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {instructors.map((i) => (
                          <SelectItem key={i} value={i}>👤 {i}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Court */}
                {courts.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cancha</label>
                    <Select value={courtFilter} onValueChange={setCourtFilter}>
                      <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {courts.map(([id, name]) => (
                          <SelectItem key={id} value={id.toString()}>🏟 {name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Day of week */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Día de semana</label>
                  <Select value={dowFilter} onValueChange={setDowFilter}>
                    <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {[1,2,3,4,5,6,0].map((d) => (
                        <SelectItem key={d} value={d.toString()}>{DOW_SHORT[d]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Time of day */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Horario</label>
                  <Select value={timeOfDayFilter} onValueChange={setTimeOfDayFilter}>
                    <SelectTrigger><SelectValue placeholder="Cualquiera" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Cualquiera</SelectItem>
                      <SelectItem value="mañana">🌅 Mañana (antes de 12:00)</SelectItem>
                      <SelectItem value="tarde">☀️ Tarde (12:00–18:00)</SelectItem>
                      <SelectItem value="noche">🌙 Noche (después de 18:00)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Availability */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Disponibilidad</label>
                  <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                    <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="available">Con cupos disponibles</SelectItem>
                      <SelectItem value="full">Clase completa</SelectItem>
                      {user && <SelectItem value="myClasses">✓ Mis clases</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Precio</label>
                  <Select value={priceFilter} onValueChange={setPriceFilter}>
                    <SelectTrigger><SelectValue placeholder="Cualquier precio" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Cualquier precio</SelectItem>
                      <SelectItem value="free">🎁 Gratis</SelectItem>
                      <SelectItem value="paid">💰 De pago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Active filter chips */}
            {activeFilterCount > 0 && (
              <div className="flex gap-2 flex-wrap text-xs">
                {search && (
                  <span className="flex items-center gap-1 bg-primary/10 text-primary rounded-full px-3 py-1 font-medium">
                    "{search}"
                    <button onClick={() => setSearch("")} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {sportFilter !== "all" && (
                  <span className="flex items-center gap-1 bg-primary/10 text-primary rounded-full px-3 py-1 font-medium">
                    {SPORT_EMOJI[availableSports.find(s => s.sportId.toString() === sportFilter)?.name ?? ""] ?? "🏃"} {availableSports.find(s => s.sportId.toString() === sportFilter)?.name}
                    <button onClick={() => setSportFilter("all")} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {instructorFilter !== "all" && (
                  <span className="flex items-center gap-1 bg-primary/10 text-primary rounded-full px-3 py-1 font-medium">
                    👤 {instructorFilter}
                    <button onClick={() => setInstructorFilter("all")} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {courtFilter !== "all" && (
                  <span className="flex items-center gap-1 bg-primary/10 text-primary rounded-full px-3 py-1 font-medium">
                    🏟 {courts.find(([id]) => id.toString() === courtFilter)?.[1]}
                    <button onClick={() => setCourtFilter("all")} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {dowFilter !== "all" && (
                  <span className="flex items-center gap-1 bg-primary/10 text-primary rounded-full px-3 py-1 font-medium">
                    📅 {DOW_SHORT[parseInt(dowFilter)]}
                    <button onClick={() => setDowFilter("all")} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {timeOfDayFilter !== "all" && (
                  <span className="flex items-center gap-1 bg-primary/10 text-primary rounded-full px-3 py-1 font-medium">
                    {timeOfDayFilter === "mañana" ? "🌅" : timeOfDayFilter === "tarde" ? "☀️" : "🌙"} {timeOfDayFilter}
                    <button onClick={() => setTimeOfDayFilter("all")} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {availabilityFilter !== "all" && (
                  <span className="flex items-center gap-1 bg-primary/10 text-primary rounded-full px-3 py-1 font-medium">
                    {availabilityFilter === "available" ? "Con cupos" : availabilityFilter === "full" ? "Completas" : "Mis clases"}
                    <button onClick={() => setAvailabilityFilter("all")} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {priceFilter !== "all" && (
                  <span className="flex items-center gap-1 bg-primary/10 text-primary rounded-full px-3 py-1 font-medium">
                    {priceFilter === "free" ? "🎁 Gratis" : "💰 De pago"}
                    <button onClick={() => setPriceFilter("all")} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
                  </span>
                )}
                <p className="text-muted-foreground self-center">
                  {filteredClasses.length} resultado{filteredClasses.length !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </div>

          {/* Classes grid */}
          {filteredClasses.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
                <p className="text-lg font-medium">
                  {activeFilterCount > 0 ? "Sin resultados" : "No hay clases disponibles"}
                </p>
                <p className="text-muted-foreground mb-4">
                  {activeFilterCount > 0 ? "Prueba con otros filtros." : "Esta sucursal no tiene clases por ahora."}
                </p>
                {activeFilterCount > 0 && (
                  <Button variant="outline" onClick={resetFilters}>
                    <X className="h-4 w-4 mr-2" />Limpiar filtros
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredClasses.map((sc) => {
                const spotsLeft = sc.spotsLeft ?? sc.maxCapacity;
                const isFull = spotsLeft === 0;
                const isEnrolled = enrolledClassIds.has(sc.classId);
                const isProcessing = enrollingId === sc.classId;

                return (
                  <Card key={sc.classId} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="bg-linear-to-r from-primary/20 to-accent/20 px-4 py-5 flex items-start gap-3">
                      <span className="text-3xl mt-0.5">{SPORT_EMOJI[sc.sport?.name ?? ""] ?? "🏃"}</span>
                      <div className="min-w-0">
                        <CardTitle className="text-base leading-tight">{sc.name}</CardTitle>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <p className="text-xs text-muted-foreground">{sc.sport?.name}</p>
                          {sc.resource && (
                            <Badge variant="secondary" className="text-[10px] py-0">🏟 {sc.resource.name}</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <CardContent className="flex-1 flex flex-col gap-3 pt-4">
                      {sc.instructor && <p className="text-sm text-muted-foreground">👤 {sc.instructor}</p>}
                      {sc.description && <p className="text-sm text-muted-foreground line-clamp-2">{sc.description}</p>}

                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          {new Date(sc.startsAt).toLocaleDateString("es-CL", {
                            weekday: "long", day: "numeric", month: "long",
                          })}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          {new Date(sc.startsAt).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                          {" → "}
                          {new Date(sc.endsAt).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        {sc.price > 0 && (
                          <div className="flex items-center gap-1.5 font-semibold text-primary">
                            <DollarSign className="h-3.5 w-3.5 shrink-0" />
                            {formatCurrency(sc.price, sc.currency)}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Users className="h-3.5 w-3.5" />
                            {sc.maxCapacity - spotsLeft}/{sc.maxCapacity} inscritos
                          </span>
                          <Badge variant={isEnrolled ? "success" : isFull ? "destructive" : spotsLeft <= 3 ? "warning" : "secondary"}>
                            {isEnrolled ? "✓ Inscrito" : isFull ? "Clase completa" : `${spotsLeft} cupo${spotsLeft !== 1 ? "s" : ""}`}
                          </Badge>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${isFull ? "bg-destructive" : isEnrolled ? "bg-success" : "bg-primary"}`}
                            style={{ width: `${Math.min(100, ((sc.maxCapacity - spotsLeft) / sc.maxCapacity) * 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-auto pt-2">
                        {isEnrolled ? (
                          <Button
                            variant="outline"
                            className="w-full text-destructive border-destructive/40 hover:bg-destructive/5"
                            onClick={() => handleCancelEnrollment(sc)}
                            isLoading={isProcessing}
                          >
                            <XCircle className="h-4 w-4 mr-2" />Cancelar inscripción
                          </Button>
                        ) : (
                          <Button
                            className="w-full"
                            onClick={() => handleEnroll(sc)}
                            disabled={isFull || isProcessing}
                            isLoading={isProcessing}
                          >
                            {isFull ? "Clase completa" : (
                              <><CheckCircle2 className="h-4 w-4 mr-2" />Inscribirme</>
                            )}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
