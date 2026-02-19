"use client";

import { useState, useEffect, useCallback } from "react";
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
  CalendarDays,
  Users,
  TrendingUp,
  Layers,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  Shield,
} from "lucide-react";
import { useAuth } from "@/contexts";
import { tenantsApi } from "@/lib/api";
import {
  RoleName,
  RoleScope,
  TenantDashboardStats,
  TenantUser,
  Booking,
} from "@/lib/types";
import { formatDate, formatTime } from "@/lib/utils";
import { toast } from "@/lib/toast";

export default function TenantAdminDashboardPage() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] =
    useState<TenantDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get tenant ID from current user's role
  const tenantRole = user?.roles?.find((r) => {
    const roleName = r.roleName || r.role?.name;
    return (
      roleName === RoleName.TENANT_ADMIN &&
      (r.scope === RoleScope.TENANT || r.tenantId)
    );
  });
  const tenantId = tenantRole?.tenantId;

  const loadDashboard = useCallback(async () => {
    if (!tenantId) return;
    setIsLoading(true);
    try {
      const data = await tenantsApi.getDashboardStats(tenantId);
      setDashboardData(data as unknown as TenantDashboardStats);
    } catch (error) {
      console.error("Error loading dashboard:", error);
      toast.error("Error al cargar el dashboard");
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const formatRoleName = (roleName: string) => {
    const names: Record<string, string> = {
      super_admin: "Super Admin",
      tenant_admin: "Admin Centro",
      branch_admin: "Admin Sucursal",
      staff: "Staff",
    };
    return names[roleName?.toLowerCase()] || roleName?.replace(/_/g, " ");
  };

  const getRoleBadgeVariant = (roleName: string) => {
    switch (roleName?.toLowerCase()) {
      case "super_admin":
        return "destructive" as const;
      case "tenant_admin":
        return "default" as const;
      case "branch_admin":
        return "warning" as const;
      case "staff":
        return "info" as const;
      default:
        return "secondary" as const;
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
          <p className="text-muted-foreground">
            Panel de administración del centro deportivo
          </p>
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
  const recentBookings = dashboardData?.recentBookings || [];
  const branchSummary = dashboardData?.branchSummary || [];
  const tenantUsers = dashboardData?.tenantUsers || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Panel de administración del centro deportivo
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sucursales</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.activeBranches ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalBranches !== stats?.activeBranches
                ? `${stats?.totalBranches} total · ${stats?.activeBranches} activas`
                : "Activas"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Canchas</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.activeResources ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalResources !== stats?.activeResources
                ? `${stats?.totalResources} total · ${stats?.activeResources} activas`
                : "Total"}
            </p>
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
              {(stats?.pendingBookings ?? 0) > 0
                ? `${stats?.pendingBookings} pendientes`
                : "Sin pendientes"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Equipo</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.staffCount ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Usuarios con roles asignados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly bookings banner */}
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

      {/* Content - 2 columns */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Reservas recientes
            </CardTitle>
            <CardDescription>Últimas reservas realizadas</CardDescription>
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

        {/* Branch Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Sucursales
            </CardTitle>
            <CardDescription>Estado de tus sucursales</CardDescription>
          </CardHeader>
          <CardContent>
            {branchSummary.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
                <p className="text-muted-foreground">No hay sucursales</p>
              </div>
            ) : (
              <div className="space-y-3">
                {branchSummary.map((branch) => (
                  <div
                    key={branch.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-2.5 w-2.5 rounded-full ${branch.isActive ? "bg-green-500" : "bg-red-400"}`}
                      />
                      <div>
                        <p className="text-sm font-medium">{branch.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {branch.resourceCount}{" "}
                          {branch.resourceCount === 1 ? "cancha" : "canchas"}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={branch.isActive ? "default" : "destructive"}
                    >
                      {branch.isActive ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {branch.isActive ? "Activa" : "Bloqueada"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Users in tenant */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Equipo del centro deportivo
          </CardTitle>
          <CardDescription>
            Usuarios con roles asignados en tus sucursales ({tenantUsers.length}
            )
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tenantUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
              <p className="text-muted-foreground">No hay usuarios asignados</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {tenantUsers.map((tenantUser: TenantUser) => (
                <div
                  key={tenantUser.id}
                  className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-primary">
                      {tenantUser.firstName?.[0] || ""}
                      {tenantUser.lastName?.[0] || ""}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {tenantUser.firstName} {tenantUser.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {tenantUser.email}
                    </p>
                    {tenantUser.phone && (
                      <p className="text-xs text-muted-foreground">
                        📱 {tenantUser.phone}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {tenantUser.roles.map((role, idx) => (
                        <div key={idx} className="flex flex-col">
                          <Badge
                            variant={getRoleBadgeVariant(role.roleName)}
                            className="text-[10px] px-1.5 py-0"
                          >
                            {formatRoleName(role.roleName)}
                          </Badge>
                          {role.branchName && (
                            <span className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-30">
                              📍 {role.branchName}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
