"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import {
  Card,
  CardContent,
  Button,
  Badge,
  Skeleton,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import {
  Calendar,
  Clock,
  MapPin,
  X,
  AlertCircle,
  SlidersHorizontal,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { usersApi, bookingsApi } from "@/lib/api";
import { Booking, BookingStatus } from "@/lib/types";
import { formatDate, formatTime, formatCurrency, getStatusColor, cn } from "@/lib/utils";

// ── helpers ────────────────────────────────────────────────────────────────

const statusLabels: Record<BookingStatus, string> = {
  [BookingStatus.PENDING]: "Pendiente",
  [BookingStatus.PENDING_PAYMENT]: "Pago pendiente",
  [BookingStatus.CONFIRMED]: "Confirmada",
  [BookingStatus.CANCELLED]: "Cancelada",
  [BookingStatus.REJECTED]: "Rechazada",
  [BookingStatus.COMPLETED]: "Completada",
  [BookingStatus.NO_SHOW]: "No asistió",
};

const statusVariant: Partial<Record<BookingStatus, "success" | "warning" | "destructive" | "secondary" | "outline">> = {
  [BookingStatus.CONFIRMED]: "success",
  [BookingStatus.PENDING]: "warning",
  [BookingStatus.PENDING_PAYMENT]: "warning",
  [BookingStatus.REJECTED]: "destructive",
  [BookingStatus.CANCELLED]: "outline",
  [BookingStatus.COMPLETED]: "secondary",
  [BookingStatus.NO_SHOW]: "outline",
};

function isPastBooking(b: Booking) {
  return new Date(b.endAt ?? b.startAt) < new Date();
}

function canCancelBooking(b: Booking) {
  if (isPastBooking(b)) return false;
  return (
    b.status === BookingStatus.PENDING ||
    b.status === BookingStatus.CONFIRMED ||
    b.status === BookingStatus.PENDING_PAYMENT
  );
}

// ── component ─────────────────────────────────────────────────────────────

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; booking: Booking | null }>({
    open: false, booking: null,
  });
  const [isCancelling, setIsCancelling] = useState(false);

  // ── filters ───────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState<"upcoming" | "past" | "all">("upcoming");
  const [courtFilter, setCourtFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { loadBookings(); }, []);

  const loadBookings = async () => {
    try {
      const response = await usersApi.getMyBookings();
      setBookings(response.data);
    } catch {
      toast.error("Error al cargar las reservas");
    } finally {
      setIsLoading(false);
    }
  };

  // ── derived filter options ─────────────────────────────────────────────
  const courts = useMemo(() => {
    const map = new Map<string, string>();
    bookings.forEach((b) => {
      if (b.resource?.resourceId) {
        map.set(b.resource.resourceId.toString(), b.resource.name);
      }
    });
    return [...map.entries()];
  }, [bookings]);

  const branches = useMemo(() => {
    const map = new Map<string, string>();
    bookings.forEach((b) => {
      const branch = b.resource?.branch;
      if (branch?.branchId) {
        map.set(branch.branchId.toString(), branch.name);
      }
    });
    return [...map.entries()];
  }, [bookings]);

  const activeFilterCount = [
    search,
    timeFilter !== "upcoming",
    courtFilter !== "all",
    branchFilter !== "all",
    statusFilter !== "all",
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSearch("");
    setTimeFilter("upcoming");
    setCourtFilter("all");
    setBranchFilter("all");
    setStatusFilter("all");
  };

  // ── filtered list ─────────────────────────────────────────────────────
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const past = isPastBooking(b);

      if (timeFilter === "upcoming" && past) return false;
      if (timeFilter === "past" && !past) return false;

      if (courtFilter !== "all" && b.resource?.resourceId?.toString() !== courtFilter) return false;
      if (branchFilter !== "all" && b.resource?.branch?.branchId?.toString() !== branchFilter) return false;
      if (statusFilter !== "all" && b.status !== statusFilter) return false;

      if (search) {
        const q = search.toLowerCase();
        if (
          !b.resource?.name?.toLowerCase().includes(q) &&
          !b.resource?.branch?.name?.toLowerCase().includes(q)
        ) return false;
      }

      return true;
    });
  }, [bookings, timeFilter, courtFilter, branchFilter, statusFilter, search]);

  // ── cancel ────────────────────────────────────────────────────────────
  const handleCancelBooking = async () => {
    if (!cancelDialog.booking) return;
    setIsCancelling(true);
    try {
      await toast.promise(bookingsApi.cancel(cancelDialog.booking.bookingId), {
        loading: "Cancelando reserva...",
        success: "Reserva cancelada exitosamente",
        error: "Error al cancelar la reserva",
      });
      setCancelDialog({ open: false, booking: null });
      loadBookings();
    } catch {
      // handled by toast.promise
    } finally {
      setIsCancelling(false);
    }
  };

  // ── render: skeleton ─────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mis reservas</h1>
          <p className="text-muted-foreground mt-1">Gestiona tus reservas activas e historial</p>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <Skeleton className="h-24 w-24 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ── render: main ──────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Mis reservas</h1>
        <p className="text-muted-foreground mt-1">
          {bookings.length} reserva{bookings.length !== 1 ? "s" : ""} en total
        </p>
      </div>

      {/* ── Filter bar ── */}
      <div className="space-y-3">
        {/* Time tabs (always visible) */}
        <div className="flex gap-1 bg-muted/40 rounded-lg p-1 w-fit">
          {([
            { value: "upcoming", label: "Próximas" },
            { value: "past", label: "Historial" },
            { value: "all", label: "Todas" },
          ] as const).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setTimeFilter(value)}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                timeFilter === value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
              <span className="ml-1.5 text-xs opacity-60">
                ({bookings.filter((b) => {
                  const p = isPastBooking(b);
                  return value === "upcoming" ? !p : value === "past" ? p : true;
                }).length})
              </span>
            </button>
          ))}
        </div>

        {/* Search + more filters */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por cancha o sucursal..."
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
            {(activeFilterCount - (timeFilter !== "upcoming" ? 1 : 0)) > 0 && (
              <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFilterCount - (timeFilter !== "upcoming" ? 1 : 0)}
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
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 p-4 border rounded-xl bg-muted/20">
            {/* Court */}
            {courts.length > 0 && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cancha</label>
                <Select value={courtFilter} onValueChange={setCourtFilter}>
                  <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las canchas</SelectItem>
                    {courts.map(([id, name]) => (
                      <SelectItem key={id} value={id}>🏟 {name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Branch */}
            {branches.length > 1 && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sucursal</label>
                <Select value={branchFilter} onValueChange={setBranchFilter}>
                  <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las sucursales</SelectItem>
                    {branches.map(([id, name]) => (
                      <SelectItem key={id} value={id}>📍 {name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Status */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Estado</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value={BookingStatus.CONFIRMED}>✅ Confirmada</SelectItem>
                  <SelectItem value={BookingStatus.PENDING}>⏳ Pendiente</SelectItem>
                  <SelectItem value={BookingStatus.COMPLETED}>✔ Completada</SelectItem>
                  <SelectItem value={BookingStatus.CANCELLED}>✖ Cancelada</SelectItem>
                  <SelectItem value={BookingStatus.REJECTED}>🚫 Rechazada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Result count */}
        <p className="text-sm text-muted-foreground">
          Mostrando <strong>{filteredBookings.length}</strong> de {bookings.length} reservas
        </p>
      </div>

      {/* ── Booking list ── */}
      {filteredBookings.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
            <p className="text-lg font-medium">
              {bookings.length === 0
                ? "No tienes reservas aún"
                : "No hay reservas que coincidan"}
            </p>
            {bookings.length === 0 ? (
              <Button className="mt-4" onClick={() => router.push("/browse")}>
                Buscar canchas
              </Button>
            ) : (
              <Button variant="outline" className="mt-4" onClick={resetFilters}>
                <X className="h-4 w-4 mr-2" />Limpiar filtros
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredBookings.map((booking) => {
            const past = isPastBooking(booking);
            const cancellable = canCancelBooking(booking);

            return (
              <Card
                key={booking.bookingId}
                className={cn(
                  "overflow-hidden transition-all",
                  past && "opacity-75 hover:opacity-100",
                )}
              >
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Date column */}
                    <div className={cn(
                      "p-5 flex flex-col items-center justify-center md:w-36 shrink-0",
                      past ? "bg-muted/40" : "bg-primary/10",
                    )}>
                      <Calendar className={cn("h-6 w-6 mb-1.5", past ? "text-muted-foreground" : "text-primary")} />
                      <p className="text-sm font-semibold text-center leading-tight">
                        {formatDate(booking.startAt, { weekday: "short", month: "short", day: "numeric" })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatTime(booking.startAt)} – {formatTime(booking.endAt)}
                      </p>
                    </div>

                    {/* Info */}
                    <div className="flex-1 p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-base truncate">{booking.resource?.name}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {booking.resource?.branch?.name}
                          </p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant={statusVariant[booking.status] ?? "outline"}>
                              {statusLabels[booking.status]}
                            </Badge>
                            {past && (
                              <span className="text-[11px] text-muted-foreground italic">Pasada</span>
                            )}
                          </div>
                          {booking.status === BookingStatus.REJECTED && booking.rejectionReason && (
                            <div className="mt-2 bg-destructive/10 px-3 py-1.5 rounded-md text-xs text-destructive">
                              <span className="font-medium">Motivo: </span>{booking.rejectionReason}
                            </div>
                          )}
                        </div>

                        {/* Price + actions */}
                        <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-1 shrink-0">
                          <div className="flex flex-col items-end">
                            {booking.originalPrice && booking.originalPrice !== booking.totalPrice && (
                              <p className="text-xs line-through text-muted-foreground">
                                {formatCurrency(booking.originalPrice, booking.currency)}
                              </p>
                            )}
                            <p className={cn(
                              "font-semibold text-base",
                              booking.originalPrice && booking.originalPrice !== booking.totalPrice
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "",
                            )}>
                              {formatCurrency(booking.totalPrice, booking.currency)}
                            </p>
                          </div>

                          {cancellable ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 sm:mt-1"
                              onClick={() => setCancelDialog({ open: true, booking })}
                            >
                              <X className="h-3.5 w-3.5 mr-1" />
                              Cancelar
                            </Button>
                          ) : past && booking.status === BookingStatus.CONFIRMED ? (
                            <span className="text-xs text-muted-foreground sm:mt-1 italic">Completada</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={cancelDialog.open}
        onOpenChange={(open) => !isCancelling && setCancelDialog({ open, booking: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Cancelar reserva
            </DialogTitle>
            <DialogDescription asChild>
              <div>
                ¿Estás seguro de que deseas cancelar esta reserva?
                {cancelDialog.booking && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <span className="block font-medium">{cancelDialog.booking.resource?.name}</span>
                    <span className="block text-sm text-muted-foreground">
                      {formatDate(cancelDialog.booking.startAt)} •{" "}
                      {formatTime(cancelDialog.booking.startAt)} –{" "}
                      {formatTime(cancelDialog.booking.endAt)}
                    </span>
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialog({ open: false, booking: null })}
              disabled={isCancelling}
            >
              Volver
            </Button>
            <Button variant="destructive" onClick={handleCancelBooking} isLoading={isCancelling}>
              Confirmar cancelación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
