"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "@/lib/toast";
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
} from "@/components/ui";
import {
  Plus,
  GraduationCap,
  Users,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  DollarSign,
  X,
  RefreshCw,
  SlidersHorizontal,
  Search,
} from "lucide-react";
import { classesApi, sportsApi, branchesApi } from "@/lib/api";
import {
  SportClass,
  ClassEnrollment,
  ClassForm,
  RecurringClassForm,
  Sport,
  Resource,
  BranchHours,
} from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { useAuth, useTenantSwitcher } from "@/contexts";

const DOW_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
function getTimeOfDay(isoString: string): "mañana" | "tarde" | "noche" {
  const h = new Date(isoString).getHours();
  if (h < 12) return "mañana";
  if (h < 18) return "tarde";
  return "noche";
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Build time-slot options between openTime and closeTime in 30-min increments */
function buildTimeOptions(openTime: string, closeTime: string): string[] {
  const slots: string[] = [];
  const [oh, om] = openTime.split(":").map(Number);
  const [ch, cm] = closeTime.split(":").map(Number);
  let h = oh;
  let m = om;
  while (h * 60 + m <= ch * 60 + cm) {
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    m += 30;
    if (m >= 60) { h += 1; m = 0; }
  }
  return slots;
}

/** Given branch hours array and selected days, find the widest time window */
function getTimeWindow(hours: BranchHours[], daysOfWeek: number[]): { open: string; close: string } {
  const relevant = hours.filter((h) => daysOfWeek.includes(h.dayOfWeek) && !h.isClosed);
  if (relevant.length === 0) return { open: "08:00", close: "22:00" };
  const open = relevant.reduce((min, h) => (h.openTime < min ? h.openTime : min), relevant[0].openTime);
  const close = relevant.reduce((max, h) => (h.closeTime > max ? h.closeTime : max), relevant[0].closeTime);
  return { open, close };
}

function formatDateTimeLocal(iso: string) {
  if (!iso) return "";
  return iso.slice(0, 16);
}

const DOW_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DOW_EN = [0, 1, 2, 3, 4, 5, 6]; // Sun=0

const DEFAULT_SINGLE: ClassForm = {
  name: "", sportId: 0, resourceId: undefined,
  description: "", instructor: "",
  startsAt: "", endsAt: "",
  maxCapacity: 20, price: 0, currency: "CLP",
};

const DEFAULT_RECURRING: RecurringClassForm = {
  name: "", sportId: 0, resourceId: undefined,
  description: "", instructor: "",
  daysOfWeek: [1], // Monday
  startDate: "", endDate: "",
  startTime: "09:00", endTime: "10:00",
  maxCapacity: 20, price: 0, currency: "CLP",
};

const SPORT_EMOJI: Record<string, string> = {
  Fútbol: "⚽", Tenis: "🎾", Pádel: "🏸", Básquetbol: "🏀",
  Voleibol: "🏐", Natación: "🏊", Yoga: "🧘", Boxeo: "🥊",
};

// ── Component ──────────────────────────────────────────────────────────────

export default function BranchClassesPage() {
  const { user } = useAuth();
  const { selectedBranchId } = useTenantSwitcher();

  const [classes, setClasses] = useState<SportClass[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [branchHours, setBranchHours] = useState<BranchHours[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  // Create/Edit dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"single" | "recurring">("single");
  const [editingClass, setEditingClass] = useState<SportClass | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forms
  const [singleForm, setSingleForm] = useState<ClassForm>(DEFAULT_SINGLE);
  const [recurringForm, setRecurringForm] = useState<RecurringClassForm>(DEFAULT_RECURRING);

  // Enrollments dialog
  const [enrollmentsDialog, setEnrollmentsDialog] = useState<{
    open: boolean;
    data: { class: SportClass; enrollments: ClassEnrollment[] } | null;
  }>({ open: false, data: null });

  // Deactivate dialog
  const [deleteConfirm, setDeleteConfirm] = useState<SportClass | null>(null);

  // ── Filters ────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [sportFilterF, setSportFilterF] = useState("all");
  const [instructorFilter, setInstructorFilter] = useState("all");
  const [courtFilter, setCourtFilter] = useState("all");
  const [dowFilter, setDowFilter] = useState("all");
  const [timeOfDayFilter, setTimeOfDayFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("upcoming"); // upcoming | past | available | full
  const [showFilters, setShowFilters] = useState(false);

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

  const availableSportsInClasses = useMemo(
    () => sports.filter((s) => classes.some((c) => c.sportId === s.sportId)),
    [classes, sports],
  );

  const now = new Date();

  const filteredClasses = useMemo(() => {
    return classes.filter((sc) => {
      const spotsLeft = sc.spotsLeft ?? sc.maxCapacity;
      const isPast = new Date(sc.startsAt) < now;

      if (search && !sc.name.toLowerCase().includes(search.toLowerCase()) &&
          !sc.instructor?.toLowerCase().includes(search.toLowerCase())) return false;
      if (sportFilterF !== "all" && sc.sportId.toString() !== sportFilterF) return false;
      if (instructorFilter !== "all" && sc.instructor !== instructorFilter) return false;
      if (courtFilter !== "all" && sc.resourceId?.toString() !== courtFilter) return false;
      if (dowFilter !== "all" && new Date(sc.startsAt).getDay().toString() !== dowFilter) return false;
      if (timeOfDayFilter !== "all" && getTimeOfDay(sc.startsAt) !== timeOfDayFilter) return false;
      if (statusFilter === "upcoming" && isPast) return false;
      if (statusFilter === "past" && !isPast) return false;
      if (statusFilter === "available" && spotsLeft === 0) return false;
      if (statusFilter === "full" && spotsLeft > 0) return false;

      return true;
    });
  }, [classes, search, sportFilterF, instructorFilter, courtFilter, dowFilter, timeOfDayFilter, statusFilter]);

  const activeFilterCount = [
    search, sportFilterF !== "all", instructorFilter !== "all",
    courtFilter !== "all", dowFilter !== "all",
    timeOfDayFilter !== "all", statusFilter !== "upcoming",
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSearch(""); setSportFilterF("all"); setInstructorFilter("all");
    setCourtFilter("all"); setDowFilter("all"); setTimeOfDayFilter("all"); setStatusFilter("upcoming");
  };

  // ── Time options derived from branch hours ──────────────────────────────
  const timeOptionsForSingle = useMemo(() => {
    // use the selected days (0–6 from startsAt date) or all open days
    const openDays = branchHours.filter((h) => !h.isClosed);
    if (openDays.length === 0) return buildTimeOptions("08:00", "22:00");
    const { open, close } = getTimeWindow(branchHours, openDays.map((h) => h.dayOfWeek));
    return buildTimeOptions(open, close);
  }, [branchHours]);

  const timeOptionsForRecurring = useMemo(() => {
    const dow = recurringForm.daysOfWeek;
    const { open, close } = getTimeWindow(branchHours, dow.length > 0 ? dow : [0, 1, 2, 3, 4, 5, 6]);
    return buildTimeOptions(open, close);
  }, [branchHours, recurringForm.daysOfWeek]);

  // ── Data loading ──────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!selectedBranchId) return;
    try {
      const [classesData, sportsData, hoursData] = await Promise.all([
        classesApi.getByBranch(selectedBranchId, { upcoming: !showAll }),
        sportsApi.list(),
        branchesApi.getHours(selectedBranchId),
      ]);
      setClasses(classesData);
      setSports(Array.isArray(sportsData) ? sportsData : []);
      const hours = Array.isArray(hoursData) ? hoursData : (hoursData as any).data || [];
      setBranchHours(hours);

      // Load resources (to allow linking a class to a court)
      try {
        const res = await branchesApi.getResources(selectedBranchId);
        setResources(Array.isArray(res) ? res : (res as any).data || []);
      } catch {
        setResources([]);
      }
    } catch {
      toast.error("Error al cargar clases");
    } finally {
      setIsLoading(false);
    }
  }, [selectedBranchId, showAll]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Dialogs ──────────────────────────────────────────────────────────
  const openCreateDialog = () => {
    setEditingClass(null);
    setSingleForm({
      ...DEFAULT_SINGLE,
      sportId: sports.length > 0 ? sports[0].sportId : 0,
    });
    setRecurringForm({
      ...DEFAULT_RECURRING,
      sportId: sports.length > 0 ? sports[0].sportId : 0,
    });
    setDialogMode("single");
    setIsDialogOpen(true);
  };

  const openEditDialog = (sc: SportClass) => {
    setEditingClass(sc);
    setSingleForm({
      name: sc.name,
      sportId: sc.sportId,
      resourceId: sc.resourceId,
      description: sc.description || "",
      instructor: sc.instructor || "",
      startsAt: formatDateTimeLocal(sc.startsAt),
      endsAt: formatDateTimeLocal(sc.endsAt),
      maxCapacity: sc.maxCapacity,
      price: sc.price,
      currency: sc.currency,
    });
    setDialogMode("single");
    setIsDialogOpen(true);
  };

  const openEnrollments = async (sc: SportClass) => {
    try {
      const data = await classesApi.getEnrollments(sc.classId);
      setEnrollmentsDialog({ open: true, data });
    } catch {
      toast.error("Error al cargar inscritos");
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────
  const handleSingleSubmit = async () => {
    if (!selectedBranchId) return;
    if (!singleForm.name || !singleForm.sportId || !singleForm.startsAt || !singleForm.endsAt) {
      toast.warning("Completa todos los campos requeridos");
      return;
    }

    const payload = {
      ...singleForm,
      startsAt: new Date(singleForm.startsAt).toISOString(),
      endsAt: new Date(singleForm.endsAt).toISOString(),
    };

    setIsSubmitting(true);
    try {
      if (editingClass) {
        await toast.promise(classesApi.update(editingClass.classId, payload), {
          loading: "Actualizando clase...", success: "Clase actualizada", error: "Error al guardar clase",
        });
      } else {
        await toast.promise(classesApi.create(selectedBranchId, payload), {
          loading: "Creando clase...", success: "Clase creada", error: "Error al crear clase",
        });
      }
      setIsDialogOpen(false);
      loadData();
    } catch {
      // handled
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecurringSubmit = async () => {
    if (!selectedBranchId) return;
    const f = recurringForm;
    if (!f.name || !f.sportId || !f.startDate || !f.endDate || f.daysOfWeek.length === 0) {
      toast.warning("Completa todos los campos requeridos");
      return;
    }
    if (f.startTime >= f.endTime) {
      toast.warning("La hora de inicio debe ser anterior a la hora de término");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await toast.promise(classesApi.createBulk(selectedBranchId, f), {
        loading: "Creando clases recurrentes...",
        success: (r) => `${r.count} clases creadas exitosamente`,
        error: "Error al crear clases",
      });
      if (result) {
        setIsDialogOpen(false);
        loadData();
      }
    } catch {
      // handled
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (sc: SportClass) => {
    try {
      await toast.promise(classesApi.delete(sc.classId), {
        loading: "Desactivando clase...", success: "Clase desactivada", error: "Error al desactivar",
      });
      setDeleteConfirm(null);
      loadData();
    } catch { /* handled */ }
  };

  const toggleDay = (dow: number) => {
    setRecurringForm((f) => ({
      ...f,
      daysOfWeek: f.daysOfWeek.includes(dow)
        ? f.daysOfWeek.filter((d) => d !== dow)
        : [...f.daysOfWeek, dow].sort(),
    }));
  };

  // ── Shared props ──────────────────────────────────────────────────────
  const sharedFields = (
    form: ClassForm | RecurringClassForm,
    setForm: (f: any) => void,
    timeOptions: string[],
  ) => (
    <>
      <div className="space-y-2">
        <Label htmlFor="cls-name">Nombre *</Label>
        <Input
          id="cls-name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Ej: Yoga fluyente, Fútbol para adultos"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Deporte *</Label>
          <Select
            value={form.sportId?.toString() || ""}
            onValueChange={(v) => setForm({ ...form, sportId: parseInt(v) })}
          >
            <SelectTrigger><SelectValue placeholder="Deporte" /></SelectTrigger>
            <SelectContent>
              {sports.map((s) => (
                <SelectItem key={s.sportId} value={s.sportId.toString()}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Cancha (opcional)</Label>
          <Select
            value={form.resourceId?.toString() || "none"}
            onValueChange={(v) => setForm({ ...form, resourceId: v === "none" ? undefined : parseInt(v) })}
          >
            <SelectTrigger><SelectValue placeholder="Sin cancha" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin cancha específica</SelectItem>
              {resources.map((r) => (
                <SelectItem key={r.resourceId} value={r.resourceId.toString()}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Instructor</Label>
        <Input
          value={form.instructor || ""}
          onChange={(e) => setForm({ ...form, instructor: e.target.value })}
          placeholder="Nombre del instructor"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Cupos máx. (1–20)</Label>
          <Input
            type="number" min={1} max={20}
            value={form.maxCapacity}
            onChange={(e) => setForm({ ...form, maxCapacity: Math.min(20, Math.max(1, parseInt(e.target.value) || 1)) })}
          />
        </div>
        <div className="space-y-2">
          <Label>Precio (CLP)</Label>
          <Input
            type="number" min={0} step={1000}
            value={form.price}
            onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Descripción</Label>
        <Textarea
          value={form.description || ""}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Descripción de la clase (opcional)"
          rows={2}
        />
      </div>
    </>
  );

  // ── Render ────────────────────────────────────────────────────────────
  if (!selectedBranchId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No se encontró la sucursal asignada</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Clases</h1>
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Clases</h1>
          <p className="text-muted-foreground">
            Gestiona las clases deportivas de tu sucursal ({classes.length} total)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAll(!showAll)}>
            {showAll ? "Ver próximas" : "Ver todas"}
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />Nueva clase
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar por nombre, instructor..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button variant="outline" onClick={() => setShowFilters((v) => !v)} className="gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
            {activeFilterCount > 0 && (
              <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">{activeFilterCount}</span>
            )}
          </Button>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="icon" onClick={resetFilters} title="Limpiar"><X className="h-4 w-4" /></Button>
          )}
        </div>

        {showFilters && (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 p-4 border rounded-xl bg-muted/20">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Estado</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Próximas</SelectItem>
                  <SelectItem value="past">Pasadas</SelectItem>
                  <SelectItem value="available">Con cupos</SelectItem>
                  <SelectItem value="full">Clase completa</SelectItem>
                  <SelectItem value="all">Todas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {availableSportsInClasses.length > 1 && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Deporte</label>
                <Select value={sportFilterF} onValueChange={setSportFilterF}>
                  <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {availableSportsInClasses.map((s) => (
                      <SelectItem key={s.sportId} value={s.sportId.toString()}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

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

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Horario</label>
              <Select value={timeOfDayFilter} onValueChange={setTimeOfDayFilter}>
                <SelectTrigger><SelectValue placeholder="Cualquiera" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Cualquiera</SelectItem>
                  <SelectItem value="mañana">🌅 Mañana</SelectItem>
                  <SelectItem value="tarde">☀️ Tarde</SelectItem>
                  <SelectItem value="noche">🌙 Noche</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {(search || activeFilterCount > 0) && (
          <p className="text-sm text-muted-foreground">
            Mostrando <strong>{filteredClasses.length}</strong> de {classes.length} clases
          </p>
        )}
      </div>

      {/* Grid */}
      {classes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium">No hay clases</p>
            <p className="text-muted-foreground mb-4">Crea la primera clase para tu sucursal</p>
            <Button onClick={openCreateDialog}><Plus className="h-4 w-4 mr-2" />Crear clase</Button>
          </CardContent>
        </Card>
      ) : filteredClasses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium">Sin resultados</p>
            <p className="text-muted-foreground mb-4">No hay clases que coincidan con los filtros seleccionados</p>
            <Button variant="outline" onClick={resetFilters}><X className="h-4 w-4 mr-2" />Limpiar filtros</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClasses.map((sc) => {
            const spotsLeft = sc.spotsLeft ?? sc.maxCapacity;
            const isFull = spotsLeft === 0;
            const enrolled = sc.maxCapacity - spotsLeft;
            return (
              <Card key={sc.classId} className="overflow-hidden flex flex-col">
                <div className="bg-linear-to-br from-primary/20 to-accent/20 px-4 py-5 flex items-center gap-3">
                  <span className="text-3xl">{SPORT_EMOJI[sc.sport?.name ?? ""] ?? "🏃"}</span>
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate">{sc.name}</CardTitle>
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">{sc.sport?.name || "Sin deporte"}</Badge>
                      {sc.resource && (
                        <Badge variant="secondary" className="text-xs">🏟 {sc.resource.name}</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <CardContent className="flex-1 flex flex-col gap-3 pt-4">
                  {sc.instructor && (
                    <p className="text-sm text-muted-foreground">👤 {sc.instructor}</p>
                  )}

                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(sc.startsAt).toLocaleDateString("es-CL", {
                        weekday: "short", day: "numeric", month: "short", year: "numeric",
                      })}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(sc.startsAt).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                      {" → "}
                      {new Date(sc.endsAt).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    {sc.price > 0 && (
                      <div className="flex items-center gap-1 text-primary font-semibold">
                        <DollarSign className="h-3.5 w-3.5" />
                        {formatCurrency(sc.price, sc.currency)}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">
                      <span className="font-semibold">{enrolled}</span>
                      <span className="text-muted-foreground">/{sc.maxCapacity} inscritos</span>
                    </span>
                    <Badge variant={isFull ? "destructive" : spotsLeft <= 3 ? "warning" : "success"}>
                      {isFull ? "Completa" : `${spotsLeft} cupo${spotsLeft !== 1 ? "s" : ""}`}
                    </Badge>
                  </div>

                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${isFull ? "bg-destructive" : "bg-primary"}`}
                      style={{ width: `${Math.min(100, (enrolled / sc.maxCapacity) * 100)}%` }}
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEnrollments(sc)}>
                      <Users className="h-3.5 w-3.5 mr-1" />Inscritos
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(sc)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive" onClick={() => setDeleteConfirm(sc)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingClass ? "Editar clase" : "Nueva clase"}</DialogTitle>
            <DialogDescription>
              {editingClass ? `Modifica "${editingClass.name}"` : "Crea una clase o un rango recurrente"}
            </DialogDescription>
          </DialogHeader>

          {/* Mode tabs — only when creating */}
          {!editingClass && (
            <div className="flex gap-2 border rounded-lg p-1 bg-muted/30">
              <button
                className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${dialogMode === "single" ? "bg-background shadow-sm font-semibold" : "text-muted-foreground"}`}
                onClick={() => setDialogMode("single")}
              >
                Clase única
              </button>
              <button
                className={`flex-1 py-1.5 text-sm rounded-md transition-colors flex items-center justify-center gap-1.5 ${dialogMode === "recurring" ? "bg-background shadow-sm font-semibold" : "text-muted-foreground"}`}
                onClick={() => setDialogMode("recurring")}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Recurrente
              </button>
            </div>
          )}

          {/* ── SINGLE ── */}
          {dialogMode === "single" && (
            <div className="space-y-4">
              {sharedFields(singleForm, setSingleForm, timeOptionsForSingle)}

              {/* Date + time (single) */}
              <div className="space-y-2">
                <Label>Fecha de inicio *</Label>
                <Input
                  type="date"
                  value={singleForm.startsAt?.slice(0, 10) || ""}
                  onChange={(e) => {
                    const date = e.target.value;
                    const time = singleForm.startsAt?.slice(11, 16) || "09:00";
                    setSingleForm({ ...singleForm, startsAt: `${date}T${time}` });
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Hora inicio *</Label>
                  <Select
                    value={singleForm.startsAt?.slice(11, 16) || ""}
                    onValueChange={(v) => {
                      const date = singleForm.startsAt?.slice(0, 10) || "";
                      setSingleForm({ ...singleForm, startsAt: `${date}T${v}` });
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="--:--" /></SelectTrigger>
                    <SelectContent>
                      {timeOptionsForSingle.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Hora término *</Label>
                  <Select
                    value={singleForm.endsAt?.slice(11, 16) || ""}
                    onValueChange={(v) => {
                      const date = singleForm.endsAt?.slice(0, 10) || singleForm.startsAt?.slice(0, 10) || "";
                      setSingleForm({ ...singleForm, endsAt: `${date}T${v}` });
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="--:--" /></SelectTrigger>
                    <SelectContent>
                      {timeOptionsForSingle.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button
                  onClick={handleSingleSubmit}
                  disabled={!singleForm.name || !singleForm.sportId || !singleForm.startsAt || !singleForm.endsAt}
                  isLoading={isSubmitting}
                >
                  {editingClass ? "Guardar cambios" : "Crear clase"}
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* ── RECURRING ── */}
          {dialogMode === "recurring" && (
            <div className="space-y-4">
              {sharedFields(recurringForm, setRecurringForm, timeOptionsForRecurring)}

              {/* Day-of-week selector */}
              <div className="space-y-2">
                <Label>Días de la semana *</Label>
                <div className="flex gap-1.5 flex-wrap">
                  {DOW_EN.map((dow) => (
                    <button
                      key={dow}
                      type="button"
                      onClick={() => toggleDay(dow)}
                      className={`w-10 h-10 rounded-full text-sm font-medium border transition-colors ${
                        recurringForm.daysOfWeek.includes(dow)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border hover:border-primary/50"
                      }`}
                    >
                      {DOW_LABELS[dow]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date range */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Fecha inicio *</Label>
                  <Input
                    type="date"
                    value={recurringForm.startDate}
                    onChange={(e) => setRecurringForm({ ...recurringForm, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha término *</Label>
                  <Input
                    type="date"
                    value={recurringForm.endDate}
                    min={recurringForm.startDate}
                    onChange={(e) => setRecurringForm({ ...recurringForm, endDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Time range using branch hours */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Hora inicio *</Label>
                  <Select
                    value={recurringForm.startTime}
                    onValueChange={(v) => setRecurringForm({ ...recurringForm, startTime: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {timeOptionsForRecurring.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Hora término *</Label>
                  <Select
                    value={recurringForm.endTime}
                    onValueChange={(v) => setRecurringForm({ ...recurringForm, endTime: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {timeOptionsForRecurring
                        .filter((t) => t > recurringForm.startTime)
                        .map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Preview count */}
              {recurringForm.startDate && recurringForm.endDate && recurringForm.daysOfWeek.length > 0 && (
                <p className="text-sm text-muted-foreground bg-muted/40 rounded-md px-3 py-2">
                  {(() => {
                    const start = new Date(recurringForm.startDate + "T00:00:00");
                    const end = new Date(recurringForm.endDate + "T00:00:00");
                    let count = 0;
                    const cur = new Date(start);
                    while (cur <= end) {
                      if (recurringForm.daysOfWeek.includes(cur.getDay())) count++;
                      cur.setDate(cur.getDate() + 1);
                    }
                    return `Se crearán ${count} clase${count !== 1 ? "s" : ""}`;
                  })()}
                </p>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button
                  onClick={handleRecurringSubmit}
                  disabled={
                    !recurringForm.name || !recurringForm.sportId ||
                    !recurringForm.startDate || !recurringForm.endDate ||
                    recurringForm.daysOfWeek.length === 0
                  }
                  isLoading={isSubmitting}
                >
                  Crear clases
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Enrollments Dialog */}
      <Dialog open={enrollmentsDialog.open} onOpenChange={(open) => setEnrollmentsDialog({ open, data: enrollmentsDialog.data })}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Inscritos en "{enrollmentsDialog.data?.class.name}"</DialogTitle>
            <DialogDescription>
              {enrollmentsDialog.data?.enrollments.length ?? 0} de {enrollmentsDialog.data?.class.maxCapacity} cupos ocupados
            </DialogDescription>
          </DialogHeader>

          {enrollmentsDialog.data?.enrollments.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">Nadie inscrito aún.</p>
          ) : (
            <ul className="divide-y">
              {enrollmentsDialog.data?.enrollments.map((e) => (
                <li key={e.enrollmentId} className="py-3 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                    {e.user?.firstName?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{e.user?.firstName} {e.user?.lastName}</p>
                    <p className="text-xs text-muted-foreground truncate">{e.user?.email}</p>
                  </div>
                  <Badge variant="success" className="ml-auto shrink-0 text-xs">✓</Badge>
                </li>
              ))}
            </ul>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEnrollmentsDialog({ open: false, data: null })}>
              <X className="h-4 w-4 mr-1" />Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Desactivar clase?</DialogTitle>
            <DialogDescription>
              La clase <strong>{deleteConfirm?.name}</strong> será desactivada y no aparecerá para nuevas inscripciones.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDeactivate(deleteConfirm)}>
              Desactivar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
