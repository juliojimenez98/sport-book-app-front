"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "@/lib/toast";
import {
  Card,
  CardContent,
  Button,
  Input,
  Label,
  Skeleton,
  Badge,
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
  Search,
  Users,
  Shield,
  Trash2,
  ChevronLeft,
  ChevronRight,
  UserPlus,
} from "lucide-react";
import { usersApi, branchesApi } from "@/lib/api";
import { useAuth } from "@/contexts";
import { UserProfile, Role, Branch, RoleName, RoleScope } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function TenantUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Search
  const [searchTerm, setSearchTerm] = useState("");
  const [searchDebounce, setSearchDebounce] = useState("");

  // Role assignment dialog
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get tenant ID from current user's role
  const tenantRole = currentUser?.roles?.find((r) => {
    const roleName = r.roleName || r.role?.name;
    return (
      roleName === RoleName.TENANT_ADMIN &&
      (r.scope === RoleScope.TENANT || r.tenantId)
    );
  });
  const tenantId = tenantRole?.tenantId;

  const loadInitialData = useCallback(async () => {
    try {
      const [rolesResponse, branchesResponse] = await Promise.all([
        usersApi.getRoles(),
        branchesApi.list(),
      ]);

      const rolesList = Array.isArray(rolesResponse) ? rolesResponse : [];
      // Only show branch_admin and staff roles (tenant admin shouldn't assign super_admin or tenant_admin)
      const filteredRoles = rolesList.filter(
        (r) => r.name === RoleName.BRANCH_ADMIN || r.name === RoleName.STAFF,
      );
      setRoles(filteredRoles);

      const branchesList = Array.isArray(branchesResponse)
        ? branchesResponse
        : (branchesResponse as { data?: Branch[] })?.data || [];
      setBranches(branchesList);
    } catch (error) {
      console.error("Error loading initial data:", error);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    if (!tenantId) return;

    setIsLoading(true);
    try {
      // When searching, search all users so tenant admin can find and add new people
      // When not searching, show only users already in the tenant
      const response = await usersApi.list({
        page: currentPage,
        limit: pageSize,
        search: searchDebounce || undefined,
        tenantId: searchDebounce ? undefined : tenantId,
      });

      if (Array.isArray(response)) {
        setUsers(response);
        setTotalUsers(response.length);
        setTotalPages(1);
      } else {
        const data = response?.data || [];
        const total = response?.pagination?.total || 0;
        const pages =
          response?.pagination?.totalPages || Math.ceil(total / pageSize) || 1;

        setUsers(data);
        setTotalUsers(total);
        setTotalPages(pages);
      }
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Error al cargar usuarios");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, searchDebounce, tenantId]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const openRoleDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setSelectedRoleId("");
    setSelectedBranchId("");
    setIsRoleDialogOpen(true);
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRoleId || !selectedBranchId || !tenantId)
      return;

    setIsSubmitting(true);
    try {
      await toast.promise(
        usersApi.assignRole(selectedUser.userId, {
          roleId: parseInt(selectedRoleId),
          scope: "branch",
          tenantId: tenantId,
          branchId: parseInt(selectedBranchId),
        }),
        {
          loading: "Asignando rol...",
          success: "Rol asignado correctamente",
          error: "Error al asignar rol",
        },
      );
      setIsRoleDialogOpen(false);
      loadUsers();
    } catch {
      // error already handled by toast.promise
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveRole = async (userId: number, roleId: number) => {
    try {
      await toast.promise(usersApi.removeRole(userId, roleId), {
        loading: "Removiendo rol...",
        success: "Rol removido",
        error: "Error al remover rol",
      });
      loadUsers();
    } catch {
      // error already handled by toast.promise
    }
  };

  const getRoleBadgeVariant = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case "super_admin":
        return "destructive";
      case "tenant_admin":
        return "default";
      case "branch_admin":
        return "warning";
      case "staff":
        return "info";
      default:
        return "secondary";
    }
  };

  const formatRoleName = (roleName: string) => {
    const names: Record<string, string> = {
      super_admin: "Super Admin",
      tenant_admin: "Admin Centro",
      branch_admin: "Admin Sucursal",
      staff: "Staff",
    };
    return names[roleName.toLowerCase()] || roleName.replace(/_/g, " ");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestiona el equipo de tu centro deportivo
          </p>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-1/3 mb-2" />
                <Skeleton className="h-4 w-1/4" />
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestiona el equipo de tu centro deportivo ({totalUsers} usuarios)
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuarios por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {searchTerm
            ? "Buscando en todos los usuarios registrados"
            : "Mostrando usuarios de tu centro deportivo"}
        </p>
      </div>

      {/* Users List */}
      {users.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium">No hay usuarios</p>
            <p className="text-muted-foreground">
              {searchTerm
                ? "No se encontraron usuarios con esa búsqueda"
                : "No hay usuarios asociados a tu centro deportivo"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {users.map((user: UserProfile) => (
            <Card key={user.userId}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary">
                        {user.firstName?.[0]}
                        {user.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                      {user.phone && (
                        <p className="text-sm text-muted-foreground">
                          {user.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Roles */}
                    <div className="flex flex-wrap gap-2">
                      {((user.roles || user.userRoles) ?? []).length > 0 ? (
                        ((user.roles || user.userRoles) ?? []).map(
                          (userRole: any, idx: number) => {
                            const roleName =
                              userRole.roleName || userRole.role?.name || "";
                            const branchName = userRole.branch?.name;

                            return (
                              <div
                                key={idx}
                                className="flex items-center gap-1 group"
                              >
                                <div className="flex flex-col">
                                  <Badge
                                    variant={getRoleBadgeVariant(roleName)}
                                  >
                                    {formatRoleName(roleName)}
                                  </Badge>
                                  {branchName && (
                                    <span
                                      className="text-xs text-muted-foreground mt-0.5 max-w-[150px] truncate"
                                      title={branchName}
                                    >
                                      📍 {branchName}
                                    </span>
                                  )}
                                </div>
                                {/* Only allow removing branch_admin and staff roles */}
                                {(roleName === "branch_admin" ||
                                  roleName === "staff") && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() =>
                                      handleRemoveRole(
                                        user.userId,
                                        userRole.roleId ||
                                          userRole.role?.roleId,
                                      )
                                    }
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            );
                          },
                        )
                      ) : (
                        <Badge variant="outline">Sin roles</Badge>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openRoleDialog(user)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Asignar rol
                    </Button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex items-center gap-6 text-sm text-muted-foreground">
                  {user.createdAt && (
                    <span>Registrado: {formatDate(user.createdAt)}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalUsers > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">
              Mostrando {(currentPage - 1) * pageSize + 1} -{" "}
              {Math.min(currentPage * pageSize, totalUsers)} de {totalUsers}{" "}
              usuarios
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Por página:</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(parseInt(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      className="w-9"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Assign Role Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar rol en sucursal</DialogTitle>
            <DialogDescription>
              Asigna un rol a{" "}
              <strong>
                {selectedUser?.firstName} {selectedUser?.lastName}
              </strong>{" "}
              en una de tus sucursales.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Role Selection */}
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem
                      key={role.roleId}
                      value={role.roleId.toString()}
                    >
                      {formatRoleName(role.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedRoleId && (
                <p className="text-xs text-muted-foreground">
                  {roles.find((r) => r.roleId.toString() === selectedRoleId)
                    ?.name === "branch_admin"
                    ? "Admin Sucursal: puede gestionar la sucursal, sus canchas y reservas."
                    : "Staff: puede ver y gestionar las reservas de la sucursal."}
                </p>
              )}
            </div>

            {/* Branch Selection */}
            <div className="space-y-2">
              <Label>Sucursal</Label>
              <Select
                value={selectedBranchId}
                onValueChange={setSelectedBranchId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      branches.length === 0
                        ? "No hay sucursales disponibles"
                        : "Selecciona una sucursal"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem
                      key={branch.branchId}
                      value={branch.branchId.toString()}
                    >
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRoleDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAssignRole}
              disabled={!selectedRoleId || !selectedBranchId}
              isLoading={isSubmitting}
            >
              Asignar rol
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
