"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { CalendarDays, Activity, Users, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { branchesApi } from "@/lib/api";
import { BranchDashboardStats } from "@/lib/types";
import { useAuth } from "@/contexts";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function BranchAdminDashboardPage() {
  const { user } = useAuth();
  const branchRole = user?.roles?.find((r) => r.branchId);
  const branchId = branchRole?.branchId;

  const [stats, setStats] = useState<BranchDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (branchId) {
      branchesApi.getDashboardStats(branchId)
        .then((res) => {
          // If the API wrapper returns the raw axios response use res.data, else use res or res.data
          // Let's assume the client returns the data directly or { success, data } based on typical wrapper but TypeScript says property data doesn't exist on BranchDashboardStats, so it's unpacked:
          setStats(res as unknown as BranchDashboardStats); 
          // Actually, if res IS of type BranchDashboardStats, it unpacks it automatically.
        })
        .catch((error) => console.error("Error fetching branch stats", error))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [branchId]);

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
            <p className="text-xs text-muted-foreground">Total</p>
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
                           {format(new Date(booking.startAt), "dd MMM")} {format(new Date(booking.startAt), "HH:mm")} - {format(new Date(booking.endAt), "HH:mm")}
                        </span>
                        <span>•</span>
                        <span className="truncate">
                          {booking.user?.firstName} {booking.user?.lastName}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                        booking.status === "pending" ? "bg-amber-100 text-amber-800" :
                        booking.status === "confirmed" ? "bg-green-100 text-green-800" : "bg-primary/10 text-primary"
                      }`}>
                        {booking.status.toLowerCase()}
                      </span>
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
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              Cargando mapa de canchas... (Próximamente)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
