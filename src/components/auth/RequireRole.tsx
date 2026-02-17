"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { RoleName, RoleScope } from "@/lib/types";
import { Skeleton } from "@/components/ui";

interface RequireRoleProps {
  children: React.ReactNode;
  roles: RoleName[];
  scope?: RoleScope;
  tenantId?: number;
  branchId?: number;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export function RequireRole({
  children,
  roles,
  scope,
  tenantId,
  branchId,
  redirectTo = "/dashboard",
  fallback,
}: RequireRoleProps) {
  const { isAuthenticated, isLoading, hasRole, isSuperAdmin } = useAuth();
  const router = useRouter();

  // Check if user has any of the required roles
  const hasRequiredRole =
    isSuperAdmin ||
    roles.some((role) => hasRole(role, scope, tenantId, branchId));

  useEffect(() => {
    if (!isLoading && isAuthenticated && !hasRequiredRole) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, hasRequiredRole, router, redirectTo]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 w-full max-w-md p-8">
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }

  if (!hasRequiredRole) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">
            Acceso denegado
          </h1>
          <p className="text-muted-foreground mt-2">
            No tienes permisos para acceder a esta sección.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
