"use client";

import { useState, useEffect } from "react";
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
  Users,
  CalendarDays,
  Activity,
  TrendingUp,
  Layers,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { tenantsApi } from "@/lib/api";
import { Tenant, Branch, Booking, SuperAdminDashboardStats } from "@/lib/types";
import { formatDate, formatTime } from "@/lib/utils";

export default function SuperAdminDashboardPage() {
  const [dashboardData, setDashboardData] =
    useState<SuperAdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await tenantsApi.getSuperAdminStats();
      setDashboardData(data as unknown as SuperAdminDashboardStats);
    } catch (error) {
      console.error("Error loading dashboard:", error);
      toast.error("Error al cargar datos del dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Pendiente",
      confirmed: "Confirmada",
      cancelled: "Cancelada",
      completed: "Completada",
      no_show: "No asistió",
    };
    return labels[status] || status;
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "warning" as const;
      case "confirmed":
        return "default" as const;
      case "cancelled":
        return "destructive" as const;
      case "completed":
        return "secondary" as const;
      default:
        return "outline" as const;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Panel de Super Administrador</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12 mb-1" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-12 w-full" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const stats = dashboardData?.stats;
  const recentTenants = dashboardData?.recentTenants || [];
  const recentBookings = dashboardData?.recentBookings || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Panel de Super Administrador</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Centros Deportivos
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTenants ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeTenants ?? 0} activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sucursales</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalBranches ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeBranches ?? 0} activas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers ?? 0}</div>
            <p className="text-xs text-muted-foreground">Registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reservas hoy</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.todayBookings ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {(stats?.pendingBookingsToday ?? 0) > 0
                ? `${stats?.pendingBookingsToday} pendientes`
                : "Sin pendientes"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <Layers className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total canchas
                </p>
                <p className="text-2xl font-bold">
                  {stats?.totalResources ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats?.activeResources ?? 0} activas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <TrendingUp className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Reservas este mes
                </p>
                <p className="text-2xl font-bold">
                  {stats?.monthlyBookings ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <CalendarDays className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total reservas
                </p>
                <p className="text-2xl font-bold">
                  {stats?.totalBookings ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">Históricas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Centros deportivos
            </CardTitle>
            <CardDescription>
              Últimos centros deportivos registrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentTenants.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
                <p className="text-muted-foreground">
                  No hay centros deportivos registrados
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTenants.map((tenant) => (
                  <div
                    key={tenant.tenantId}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{tenant.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {tenant.email}
                      </p>
                      {tenant.branches && tenant.branches.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          📍 {tenant.branches.length}{" "}
                          {tenant.branches.length === 1
                            ? "sucursal"
                            : "sucursales"}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={tenant.isActive ? "default" : "destructive"}
                    >
                      {tenant.isActive ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {tenant.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Reservas recientes
            </CardTitle>
            <CardDescription>Últimas reservas en la plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            {recentBookings.length === 0 ? (
              <div className="text-center py-8">
                <CalendarDays className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
                <p className="text-muted-foreground">
                  No hay reservas recientes
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentBookings.map((booking: Booking) => (
                  <div
                    key={booking.bookingId}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {booking.resource?.name ||
                            `Recurso #${booking.resourceId}`}
                        </p>
                        <Badge variant={getStatusVariant(booking.status)}>
                          {getStatusLabel(booking.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground truncate">
                          {(booking as any).branch?.tenant?.name &&
                            `${(booking as any).branch.tenant.name} · `}
                          {(booking as any).branch?.name || "—"}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(booking.startAt)} ·{" "}
                        {formatTime(booking.startAt)} -{" "}
                        {formatTime(booking.endAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
