"use client";

import Link from "next/link";
import { useAuth } from "@/contexts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
} from "@/components/ui";
import {
  CalendarDays,
  Clock,
  MapPin,
  ArrowRight,
  Search,
  Calendar,
} from "lucide-react";
import { RoleName } from "@/lib/types";

export default function DashboardPage() {
  const { user, isSuperAdmin, hasRole } = useAuth();

  // Check user roles for quick access links
  const isTenantAdmin = hasRole(RoleName.TENANT_ADMIN);
  const isBranchAdmin = hasRole(RoleName.BRANCH_ADMIN);
  const isStaff = hasRole(RoleName.STAFF);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold">
          ¡Hola, {user?.firstName || "Usuario"}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Bienvenido a tu panel de reservas
        </p>
      </div>

      {/* Admin Quick Access */}
      {(isSuperAdmin || isTenantAdmin || isBranchAdmin || isStaff) && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">
              Acceso rápido de administrador
            </CardTitle>
            <CardDescription>Tienes permisos de administración</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {isSuperAdmin && (
              <Button asChild variant="outline">
                <Link href="/super-admin">Panel Super Admin</Link>
              </Button>
            )}
            {(isSuperAdmin || isTenantAdmin) && (
              <Button asChild variant="outline">
                <Link href="/tenant-admin">Panel Centro Deportivo</Link>
              </Button>
            )}
            {(isSuperAdmin || isTenantAdmin || isBranchAdmin || isStaff) && (
              <Button asChild variant="outline">
                <Link href="/branch-admin">Panel Sucursal</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Buscar canchas</CardTitle>
              <CardDescription>
                Encuentra y reserva tu cancha ideal
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/browse">
                Buscar ahora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Mis reservas</CardTitle>
              <CardDescription>Gestiona tus reservas activas</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/bookings">
                Ver reservas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Historial</CardTitle>
              <CardDescription>Revisa tus reservas anteriores</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/bookings?status=completed">
                Ver historial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad reciente</CardTitle>
          <CardDescription>Tus últimas reservas y actividades</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No tienes reservas recientes</p>
            <Button asChild className="mt-4">
              <Link href="/browse">Hacer tu primera reserva</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tips Section */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">💡 Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 text-primary" />
              Puedes filtrar canchas por ubicación para encontrar las más
              cercanas
            </li>
            <li className="flex items-start gap-2">
              <Clock className="h-4 w-4 mt-0.5 text-primary" />
              Las reservas se pueden cancelar hasta 2 horas antes sin costo
            </li>
            <li className="flex items-start gap-2">
              <CalendarDays className="h-4 w-4 mt-0.5 text-primary" />
              Reserva con anticipación para asegurar tu horario preferido
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
