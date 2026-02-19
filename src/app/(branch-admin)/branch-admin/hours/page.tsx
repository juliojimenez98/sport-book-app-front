"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "@/lib/toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Skeleton,
  Badge,
  Switch,
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
import { Clock, Save, Plus, Trash2, Ban, CalendarOff } from "lucide-react";
import { branchesApi } from "@/lib/api";
import { useAuth } from "@/contexts";
import {
  BranchHours,
  BlockedSlot,
  BlockedSlotForm,
  Resource,
  RoleName,
  RoleScope,
} from "@/lib/types";

const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    TIME_OPTIONS.push(
      `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`,
    );
  }
}

export default function BranchAdminHoursPage() {
  const { user } = useAuth();

  // Get branchId from user's role
  const branchRole = user?.roles?.find((r) => {
    const roleName = r.roleName || r.role?.name;
    return (
      (roleName === RoleName.BRANCH_ADMIN || roleName === RoleName.STAFF) &&
      (r.scope === RoleScope.BRANCH || r.branchId)
    );
  });
  const branchId = branchRole?.branchId;
  const branchName = branchRole?.branch?.name;

  const [hours, setHours] = useState<BranchHours[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Block slot dialog
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [blockForm, setBlockForm] = useState<BlockedSlotForm>({
    date: "",
    startTime: "08:00",
    endTime: "09:00",
    reason: "",
    resourceId: null,
  });

  const loadData = useCallback(async () => {
    if (!branchId) return;
    setIsLoading(true);
    try {
      const [hoursData, resourcesData] = await Promise.all([
        branchesApi.getHours(branchId),
        branchesApi.getResources(branchId),
      ]);

      const hoursList = Array.isArray(hoursData) ? hoursData : [];
      const fullHours: BranchHours[] = [];
      for (let day = 0; day < 7; day++) {
        const existing = hoursList.find(
          (h: BranchHours) => h.dayOfWeek === day,
        );
        if (existing) {
          fullHours.push(existing);
        } else {
          fullHours.push({
            branchHoursId: 0,
            branchId,
            dayOfWeek: day,
            openTime: "08:00",
            closeTime: "22:00",
            isClosed: day === 0,
          });
        }
      }
      setHours(fullHours);

      const resList = Array.isArray(resourcesData) ? resourcesData : [];
      setResources(resList);

      const today = new Date();
      const in30Days = new Date();
      in30Days.setDate(today.getDate() + 30);
      const blockedData = await branchesApi.getBlockedSlots(branchId, {
        from: today.toISOString().split("T")[0],
        to: in30Days.toISOString().split("T")[0],
      });
      const blocked = Array.isArray(blockedData) ? blockedData : [];
      setBlockedSlots(blocked);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Error al cargar los datos");
    } finally {
      setIsLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateHour = (
    dayOfWeek: number,
    field: keyof BranchHours,
    value: string | boolean,
  ) => {
    setHours((prev) =>
      prev.map((h) =>
        h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h,
      ),
    );
    setHasChanges(true);
  };

  const handleSaveHours = async () => {
    if (!branchId) return;
    setIsSaving(true);
    try {
      await toast.promise(branchesApi.updateHours(branchId, hours), {
        loading: "Guardando horarios...",
        success: "Horarios actualizados correctamente",
        error: "Error al guardar los horarios",
      });
      setHasChanges(false);
    } catch {
      // handled by toast.promise
    } finally {
      setIsSaving(false);
    }
  };

  const openBlockDialog = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setBlockForm({
      date: tomorrow.toISOString().split("T")[0],
      startTime: "08:00",
      endTime: "09:00",
      reason: "",
      resourceId: null,
    });
    setIsBlockDialogOpen(true);
  };

  const handleCreateBlock = async () => {
    if (
      !branchId ||
      !blockForm.date ||
      !blockForm.startTime ||
      !blockForm.endTime
    )
      return;

    setIsBlocking(true);
    try {
      await toast.promise(branchesApi.createBlockedSlot(branchId, blockForm), {
        loading: "Bloqueando horario...",
        success: "Horario bloqueado correctamente",
        error: "Error al bloquear horario",
      });
      setIsBlockDialogOpen(false);
      loadData();
    } catch {
      // handled by toast.promise
    } finally {
      setIsBlocking(false);
    }
  };

  const handleDeleteBlock = async (id: number) => {
    if (!branchId) return;
    try {
      await toast.promise(branchesApi.deleteBlockedSlot(branchId, id), {
        loading: "Eliminando bloqueo...",
        success: "Bloqueo eliminado",
        error: "Error al eliminar bloqueo",
      });
      setBlockedSlots((prev) => prev.filter((s) => s.blockedSlotId !== id));
    } catch {
      // handled by toast.promise
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString("es-CL", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  if (!branchId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No se encontró la sucursal asignada a tu cuenta.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          Horarios{branchName ? `: ${branchName}` : ""}
        </h1>
        <p className="text-muted-foreground">
          Configura los horarios de atención y bloquea horarios específicos
        </p>
      </div>

      {/* Weekly Hours */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Horarios semanales
              </CardTitle>
              <CardDescription>
                Define los horarios de apertura y cierre para cada día
              </CardDescription>
            </div>
            <Button
              onClick={handleSaveHours}
              disabled={!hasChanges || isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Guardando..." : "Guardar horarios"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {hours.map((hour) => (
              <div
                key={hour.dayOfWeek}
                className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                  hour.isClosed
                    ? "bg-muted/50 border-muted"
                    : "bg-card border-border"
                }`}
              >
                <div className="w-28 shrink-0">
                  <span
                    className={`font-medium ${hour.isClosed ? "text-muted-foreground" : ""}`}
                  >
                    {DAY_NAMES[hour.dayOfWeek]}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={!hour.isClosed}
                    onCheckedChange={(checked) =>
                      updateHour(hour.dayOfWeek, "isClosed", !checked)
                    }
                  />
                  <span className="text-sm text-muted-foreground w-16">
                    {hour.isClosed ? "Cerrado" : "Abierto"}
                  </span>
                </div>

                {!hour.isClosed && (
                  <div className="flex items-center gap-2 flex-1">
                    <Select
                      value={hour.openTime}
                      onValueChange={(value) =>
                        updateHour(hour.dayOfWeek, "openTime", value)
                      }
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((time) => (
                          <SelectItem key={`open-${time}`} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <span className="text-muted-foreground">a</span>

                    <Select
                      value={hour.closeTime}
                      onValueChange={(value) =>
                        updateHour(hour.dayOfWeek, "closeTime", value)
                      }
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((time) => (
                          <SelectItem key={`close-${time}`} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Badge variant="outline" className="ml-2">
                      {(() => {
                        const [oh, om] = hour.openTime.split(":").map(Number);
                        const [ch, cm] = hour.closeTime.split(":").map(Number);
                        const totalMins = ch * 60 + cm - (oh * 60 + om);
                        const hrs = Math.floor(totalMins / 60);
                        const mins = totalMins % 60;
                        return `${hrs}h${mins > 0 ? ` ${mins}m` : ""}`;
                      })()}
                    </Badge>
                  </div>
                )}

                {hour.isClosed && (
                  <div className="flex-1">
                    <Badge variant="secondary">
                      <Ban className="h-3 w-3 mr-1" />
                      Cerrado todo el día
                    </Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Blocked Slots */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarOff className="h-5 w-5" />
                Horarios bloqueados
              </CardTitle>
              <CardDescription>
                Bloquea horarios específicos por fecha (mantenimiento, feriados,
                eventos privados, etc.)
              </CardDescription>
            </div>
            <Button onClick={openBlockDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Bloquear horario
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {blockedSlots.length === 0 ? (
            <div className="text-center py-8">
              <CalendarOff className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
              <p className="text-muted-foreground">
                No hay horarios bloqueados próximos
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Los bloqueos impiden que se realicen reservas en esos horarios
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {blockedSlots.map((slot) => (
                <div
                  key={slot.blockedSlotId}
                  className="flex items-center justify-between p-3 rounded-lg border bg-destructive/5 border-destructive/20"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-xs">
                          {formatDate(slot.date)}
                        </Badge>
                        <span className="text-sm font-medium">
                          {slot.startTime} - {slot.endTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {slot.resource ? (
                          <span className="text-xs text-muted-foreground">
                            🏟️ {slot.resource.name}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Todas las canchas
                          </span>
                        )}
                        {slot.reason && (
                          <span className="text-xs text-muted-foreground">
                            · {slot.reason}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteBlock(slot.blockedSlotId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Block Slot Dialog */}
      <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bloquear horario</DialogTitle>
            <DialogDescription>
              Bloquea un horario específico para impedir reservas. Puedes
              bloquear todas las canchas o una cancha específica.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="block-date">Fecha *</Label>
              <Input
                id="block-date"
                type="date"
                value={blockForm.date}
                onChange={(e) =>
                  setBlockForm({ ...blockForm, date: e.target.value })
                }
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hora inicio *</Label>
                <Select
                  value={blockForm.startTime}
                  onValueChange={(value) =>
                    setBlockForm({ ...blockForm, startTime: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((time) => (
                      <SelectItem key={`bs-${time}`} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Hora fin *</Label>
                <Select
                  value={blockForm.endTime}
                  onValueChange={(value) =>
                    setBlockForm({ ...blockForm, endTime: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((time) => (
                      <SelectItem key={`be-${time}`} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cancha (opcional)</Label>
              <Select
                value={blockForm.resourceId?.toString() || "all"}
                onValueChange={(value) =>
                  setBlockForm({
                    ...blockForm,
                    resourceId: value === "all" ? null : parseInt(value),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas las canchas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las canchas</SelectItem>
                  {resources.map((resource) => (
                    <SelectItem
                      key={resource.resourceId}
                      value={resource.resourceId.toString()}
                    >
                      {resource.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Si no seleccionas cancha, se bloqueará el horario en todas las
                canchas de la sucursal
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="block-reason">Motivo (opcional)</Label>
              <Input
                id="block-reason"
                value={blockForm.reason}
                onChange={(e) =>
                  setBlockForm({ ...blockForm, reason: e.target.value })
                }
                placeholder="Ej: Mantenimiento, evento privado, feriado..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsBlockDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleCreateBlock}
              disabled={
                !blockForm.date ||
                !blockForm.startTime ||
                !blockForm.endTime ||
                isBlocking
              }
            >
              {isBlocking ? "Bloqueando..." : "Bloquear horario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
