"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Skeleton,
  Badge,
} from "@/components/ui";
import {
  Plus,
  Activity,
  Clock,
  DollarSign,
  Pencil,
  Trash2,
} from "lucide-react";
import { branchesApi } from "@/lib/api";
import { Resource } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/contexts";

export default function BranchResourcesPage() {
  const { getBranchId } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const branchId = getBranchId();

  useEffect(() => {
    if (branchId) {
      loadResources();
    }
  }, [branchId]);

  const loadResources = async () => {
    if (!branchId) return;

    try {
      const data = await branchesApi.getResources(branchId);
      setResources(data);
    } catch (error) {
      toast.error("Error al cargar canchas");
    } finally {
      setIsLoading(false);
    }
  };

  if (!branchId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No se encontró la sucursal asignada
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Canchas</h1>
            <p className="text-muted-foreground">
              Gestiona las canchas de tu sucursal
            </p>
          </div>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Canchas</h1>
          <p className="text-muted-foreground">
            Gestiona las canchas de tu sucursal ({resources.length} total)
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nueva cancha
        </Button>
      </div>

      {resources.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium">No hay canchas</p>
            <p className="text-muted-foreground mb-4">
              Crea tu primera cancha para comenzar
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Crear cancha
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <Card key={resource.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{resource.name}</CardTitle>
                    <Badge variant="outline" className="mt-1">
                      {resource.sport?.name}
                    </Badge>
                  </div>
                  <Badge variant={resource.isActive ? "success" : "secondary"}>
                    {resource.isActive ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {resource.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {resource.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {resource.slotMinutes} min
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-primary">
                    <DollarSign className="h-4 w-4" />
                    {formatCurrency(resource.pricePerHour, resource.currency)}
                    /hr
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Pencil className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
