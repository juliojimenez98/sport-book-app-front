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
  Shield,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
  Users,
} from "lucide-react";
import { usersApi, tenantsApi } from "@/lib/api";
import { UserProfile, Role, Tenant, Branch } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTenantId, setFilterTenantId] = useState<string>("");
  const [filterRoleId, setFilterRoleId] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [searchDebounce, setSearchDebounce] = useState("");

  // Role assignment dialog
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [selectedScope, setSelectedScope] = useState<string>("global");
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadInitialData = async () => {
    try {
      const [rolesResponse, tenantsResponse] = await Promise.all([
        usersApi.getRoles(),
        tenantsApi.list({ limit: 100 }),
      ]);

      const rolesList = Array.isArray(rolesResponse) ? rolesResponse : [];
      const tenantsList = Array.isArray(tenantsResponse)
        ? tenantsResponse
        : tenantsResponse?.data || [];

      setRoles(rolesList);
      setTenants(tenantsList);
    } catch (error) {
      console.error("Error loading initial data:", error);
    }
  };

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await usersApi.list({
        page: currentPage,
        limit: pageSize,
        search: searchDebounce || undefined,
        tenantId: filterTenantId ? parseInt(filterTenantId) : undefined,
        roleId: filterRoleId ? parseInt(filterRoleId) : undefined,
      });

      // Handle response format
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
  }, [currentPage, pageSize, searchDebounce, filterTenantId, filterRoleId]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load initial data (roles and tenants)
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load users when filters/pagination change
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Load branches when tenant is selected for branch scope
  useEffect(() => {
    const loadBranches = async () => {
      if (selectedScope === "branch" && selectedTenantId) {
        setIsLoadingBranches(true);
        setSelectedBranchId(""); // Reset branch selection
        try {
          const branchesResponse = await tenantsApi.getBranches(
            parseInt(selectedTenantId),
          );
          // Handle both array and paginated response formats
          const branchesList = Array.isArray(branchesResponse)
            ? branchesResponse
            : (branchesResponse as { data?: Branch[] })?.data || [];
          setBranches(branchesList);
        } catch (error) {
          console.error("Error loading branches:", error);
          setBranches([]);
        } finally {
          setIsLoadingBranches(false);
        }
      } else {
        setBranches([]);
        setSelectedBranchId("");
      }
    };
    loadBranches();
  }, [selectedScope, selectedTenantId]);

  const clearFilters = () => {
    setSearchTerm("");
    setFilterTenantId("");
    setFilterRoleId("");
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || filterTenantId || filterRoleId;

  const openRoleDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setSelectedRoleId("");
    setSelectedScope("global");
    setSelectedTenantId("");
    setSelectedBranchId("");
    setBranches([]);
    setIsRoleDialogOpen(true);
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRoleId) return;

    setIsSubmitting(true);
    try {
      await toast.promise(
        usersApi.assignRole(selectedUser.userId, {
          roleId: parseInt(selectedRoleId),
          scope: selectedScope,
          ...(selectedScope === "tenant" &&
            selectedTenantId && { tenantId: parseInt(selectedTenantId) }),
          ...(selectedScope === "branch" &&
            selectedTenantId && { tenantId: parseInt(selectedTenantId) }),
          ...(selectedScope === "branch" &&
            selectedBranchId && { branchId: parseInt(selectedBranchId) }),
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
    return roleName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Usuarios</h1>
            <p className="text-muted-foreground">
              Gestiona los usuarios del sistema
            </p>
          </div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestiona los usuarios del sistema ({totalUsers} total)
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant={showFilters ? "secondary" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
            {hasActiveFilters && (
              <Badge
                variant="destructive"
                className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                !
              </Badge>
            )}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Limpiar
            </Button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <Card>
            <CardContent className="p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Centro Deportivo</Label>
                  <Select
                    value={filterTenantId}
                    onValueChange={(v) => {
                      setFilterTenantId(v === "all" ? "" : v);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los centros deportivos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        Todos los centros deportivos
                      </SelectItem>
                      {tenants.map((tenant) => (
                        <SelectItem
                          key={tenant.tenantId}
                          value={tenant.tenantId.toString()}
                        >
                          {tenant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Rol</Label>
                  <Select
                    value={filterRoleId}
                    onValueChange={(v) => {
                      setFilterRoleId(v === "all" ? "" : v);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los roles</SelectItem>
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
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Users List */}
      {users.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium">No hay usuarios</p>
            <p className="text-muted-foreground">
              {hasActiveFilters
                ? "No se encontraron usuarios con esos filtros"
                : "No hay usuarios registrados"}
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
                            const tenantName = userRole.tenant?.name;
                            const branchName = userRole.branch?.name;
                            const branchTenantName =
                              userRole.branch?.tenant?.name;

                            // Build context string
                            let contextStr = "";
                            if (branchName) {
                              contextStr = `${branchName}${branchTenantName ? ` • ${branchTenantName}` : ""}`;
                            } else if (tenantName) {
                              contextStr = tenantName;
                            }

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
                                  {contextStr && (
                                    <span
                                      className="text-xs text-muted-foreground mt-0.5 max-w-[150px] truncate"
                                      title={contextStr}
                                    >
                                      📍 {contextStr}
                                    </span>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() =>
                                    handleRemoveRole(
                                      user.userId,
                                      userRole.roleId || userRole.role?.roleId,
                                    )
                                  }
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
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
                      <Shield className="h-4 w-4 mr-2" />
                      Asignar rol
                    </Button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex items-center gap-6 text-sm text-muted-foreground">
                  <span>ID: {user.userId}</span>
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
            <DialogTitle>Asignar rol</DialogTitle>
            <DialogDescription>
              Asigna un rol a{" "}
              <strong>
                {selectedUser?.firstName} {selectedUser?.lastName}
              </strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select
                value={selectedRoleId}
                onValueChange={(value) => {
                  setSelectedRoleId(value);
                  // Auto-select scope based on role
                  const role = roles.find((r) => r.roleId.toString() === value);
                  if (role) {
                    if (role.name === "super_admin") {
                      setSelectedScope("global");
                    } else if (role.name === "tenant_admin") {
                      setSelectedScope("tenant");
                    } else {
                      setSelectedScope("branch");
                    }
                  }
                }}
              >
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
            </div>

            {/* Show scope info */}
            {selectedRoleId && (
              <div className="p-3 bg-muted rounded-md text-sm">
                <p className="text-muted-foreground">
                  <strong>Alcance:</strong>{" "}
                  {selectedScope === "global" &&
                    "Global (acceso a todo el sistema)"}
                  {selectedScope === "tenant" &&
                    "Por centro deportivo (requiere seleccionar centro deportivo)"}
                  {selectedScope === "branch" &&
                    "Por sucursal (requiere seleccionar centro deportivo y sucursal)"}
                </p>
              </div>
            )}

            {selectedScope === "tenant" && (
              <div className="space-y-2">
                <Label>Centro Deportivo</Label>
                <Select
                  value={selectedTenantId}
                  onValueChange={setSelectedTenantId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un centro deportivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((tenant) => (
                      <SelectItem
                        key={tenant.tenantId}
                        value={tenant.tenantId.toString()}
                      >
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedScope === "branch" && (
              <>
                <div className="space-y-2">
                  <Label>Centro Deportivo</Label>
                  <Select
                    value={selectedTenantId}
                    onValueChange={setSelectedTenantId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un centro deportivo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map((tenant) => (
                        <SelectItem
                          key={tenant.tenantId}
                          value={tenant.tenantId.toString()}
                        >
                          {tenant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sucursal</Label>
                  <Select
                    value={selectedBranchId}
                    onValueChange={setSelectedBranchId}
                    disabled={!selectedTenantId || isLoadingBranches}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          isLoadingBranches
                            ? "Cargando sucursales..."
                            : !selectedTenantId
                              ? "Primero selecciona un centro deportivo"
                              : branches.length === 0
                                ? "No hay sucursales"
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
              </>
            )}
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
              disabled={
                !selectedRoleId ||
                (selectedScope === "tenant" && !selectedTenantId) ||
                (selectedScope === "branch" &&
                  (!selectedTenantId || !selectedBranchId))
              }
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
