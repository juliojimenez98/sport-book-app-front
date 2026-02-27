"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Label,
  Textarea,
} from "@/components/ui";
import { CalendarDays, Activity, Users, Clock, CheckCircle, XCircle } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { branchesApi, bookingsApi } from "@/lib/api";
import { BranchDashboardStats, Booking } from "@/lib/types";
import { useAuth } from "@/contexts";
import { toast } from "@/lib/toast";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";

export default function BranchAdminDashboardPage() {
  const { user } = useAuth();
  const branchRole = user?.roles?.find((r) => r.branchId);
  const branchId = branchRole?.branchId;

  const [stats, setStats] = useState<BranchDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    booking: Booking | null;
  }>({ open: false, booking: null });
  const [rejectionReason, setRejectionReason] = useState("");

  const loadDashboard = useCallback(async () => {
    if (!branchId) return;
    setIsLoading(true);
    try {
      const res = await branchesApi.getDashboardStats(branchId);
      setStats(res as unknown as BranchDashboardStats);
    } catch (error) {
      console.error("Error fetching branch stats", error);
      toast.error("Error al cargar el dashboard");
    } finally {
      setIsLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleConfirmBooking = async (booking: Booking) => {
    setIsSubmitting(true);
    try {
      await toast.promise(
        bookingsApi.confirm(booking.bookingId),
        {
          loading: "Confirmando reserva...",
          success: "Reserva confirmada",
          error: "Error al confirmar reserva"
        }
      );
      loadDashboard();
    } catch {
      // handled by toast.promise
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectBooking = async () => {
    if (!rejectDialog.booking || !rejectionReason) return;
    
    setIsSubmitting(true);
    try {
      await toast.promise(
        bookingsApi.reject(rejectDialog.booking.bookingId, rejectionReason),
        {
          loading: "Rechazando reserva...",
          success: "Reserva rechazada",
          error: "Error al rechazar reserva"
        }
      );
      setRejectDialog({ open: false, booking: null });
      setRejectionReason("");
      loadDashboard();
    } catch {
      // handled by toast.promise
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  const pendingBookingsList = stats?.pendingBookingsList || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Panel de administración de sucursal
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reservas hoy</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.stats.todayBookings ?? 0}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Total</p>
              {(stats?.stats.pendingBookings ?? 0) > 0 && (
                <Badge variant="warning" className="text-[10px] h-4">
                  {stats?.stats.pendingBookings} pendientes
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Canchas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.stats.activeResources ?? 0}</div>
            <p className="text-xs text-muted-foreground">Activas de {stats?.stats.totalResources ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ocupación</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.stats.occupancyRate ?? 0}%</div>
            <p className="text-xs text-muted-foreground">Hoy estimada</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.stats.pendingBookings ?? 0}</div>
            <p className="text-xs text-muted-foreground">Por confirmar hoy</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Bookings Highlight */}
      {pendingBookingsList.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/10 dark:bg-amber-950/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Reservas por aprobar ({pendingBookingsList.length})
            </CardTitle>
            <CardDescription>
              Acciones requeridas para confirmar las reservas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pendingBookingsList.map((booking) => (
                <div key={booking.bookingId} className="flex flex-col gap-3 p-3 bg-background rounded-lg border shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">
                        {booking.resource?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(booking.startAt)} · {formatTime(booking.startAt)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        👤 {booking.user?.firstName} {booking.user?.lastName}
                      </p>
                      <p className="text-xs font-semibold mt-1">
                        {formatCurrency(booking.totalPrice, booking.currency)}
                      </p>
                    </div>
                    <Badge variant="warning">Pendiente</Badge>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-7 text-xs border-red-200 hover:bg-red-50 text-red-700"
                      onClick={() => setRejectDialog({ open: true, booking })}
                    >
                      Rechazar
                    </Button>
                    <Button 
                      size="sm" 
                      className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => handleConfirmBooking(booking)}
                      disabled={isSubmitting}
                    >
                      Aprobar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Próximas reservas</CardTitle>
            <CardDescription>Reservas programadas</CardDescription>
          </CardHeader>
          <CardContent>
            {!stats?.upcomingBookings || stats.upcomingBookings.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No hay reservas próximas
              </p>
            ) : (
              <div className="space-y-4">
                {stats.upcomingBookings.map((booking) => (
                  <div key={booking.bookingId} className="flex items-center gap-4 p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="p-2 rounded-full bg-primary/10">
                      <CalendarDays className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {booking.resource?.name || "Cancha"}
                      </p>
                      <div className="flex items-center text-xs text-muted-foreground mt-1 space-x-2">
                        <span className="flex items-center gap-1">
                           <Clock className="h-3 w-3" />
                           {formatDate(booking.startAt)} {formatTime(booking.startAt)} - {formatTime(booking.endAt)}
                        </span>
                        <span>•</span>
                        <span className="truncate">
                          {booking.user?.firstName} {booking.user?.lastName}
                        </span>
                      </div>
                    </div>
                    <div>
                      <Badge variant={
                        booking.status === "pending" ? "warning" :
                        booking.status === "confirmed" ? "default" : "secondary"
                      }>
                        {booking.status === "pending" ? "Pendiente" : 
                         booking.status === "confirmed" ? "Confirmada" : booking.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado de canchas</CardTitle>
            <CardDescription>Disponibilidad actual</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-muted mb-4">
              <Activity className="h-10 w-10 text-muted-foreground opacity-50" />
            </div>
            <p className="text-muted-foreground text-sm font-medium">
              Viendo disponibilidad en tiempo real
            </p>
            <Button variant="link" size="sm" asChild className="mt-2">
              <a href="/branch-admin/calendar">Ir al Calendario</a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialog.open}
        onOpenChange={(open) =>
          !open && setRejectDialog({ open: false, booking: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Reserva</DialogTitle>
            <DialogDescription>
              Indica el motivo del rechazo para informar al usuario.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Textarea
                placeholder="Ej: Mantenimiento imprevisto, horario no disponible..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialog({ open: false, booking: null })}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectBooking}
              disabled={!rejectionReason || isSubmitting}
            >
              Rechazar Reserva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
