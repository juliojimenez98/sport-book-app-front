"use client";

import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Skeleton,
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { Plus, Tag, Clock, Pencil, Trash2, ShieldCheck, ShieldOff } from "lucide-react";
import { Discount, DiscountForm, DiscountType, DiscountConditionType, Branch, Resource } from "@/lib/types";
import { discountsApi, branchesApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

interface DiscountManagerProps {
  tenantId: number;
  branchId?: number; // If provided, limits scope to this branch
  title?: string;
  description?: string;
}

const DAYS_OF_WEEK = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

export function DiscountManager({ tenantId, branchId, title = "Descuentos y Promociones", description = "Gestiona códigos de descuento y ofertas automáticas por horario." }: DiscountManagerProps) {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchResources, setBranchResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialogs
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);

  // Form State
  const [formData, setFormData] = useState<DiscountForm>({
    tenantId,
    branchId: branchId || undefined,
    name: "",
    type: DiscountType.PERCENTAGE,
    value: 10,
    conditionType: DiscountConditionType.PROMO_CODE,
    code: "",
    daysOfWeek: [],
    startTime: "",
    endTime: "",
  });

  useEffect(() => {
    fetchData();
  }, [tenantId, branchId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [discountsRes, branchesRes] = await Promise.all([
        discountsApi.list(branchId ? { branchId } : { tenantId }),
        // Only fetch branches if tenant-level. Re-fetch might be required using tenant ID.
        // Assuming we are tenant admin if branchId isn't provided (or globally).
        !branchId ? branchesApi.list() : Promise.resolve({ data: [] })
      ]);
      setDiscounts(discountsRes);
      // Backend for branchesApi.list() currently fetches them for the tenant if scoped
      if (branchesRes && Array.isArray(branchesRes)) {
        setBranches(branchesRes);
      }
    } catch (error) {
      toast.error("Error al cargar descuentos");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (formData.branchId) {
      branchesApi.getResources(formData.branchId)
        .then(res => setBranchResources(res as any)) // getResources returns Axios response implicitly mapped by client or directly data
        .catch(() => setBranchResources([]));
    } else {
      setBranchResources([]);
    }
  }, [formData.branchId]);

  const openCreateDialog = () => {
    setEditingDiscount(null);
    setFormData({
      tenantId,
      branchId: branchId || undefined,
      name: "",
      type: DiscountType.PERCENTAGE,
      value: 10,
      conditionType: DiscountConditionType.PROMO_CODE,
      code: "",
      daysOfWeek: [],
      startTime: "",
      endTime: "",
      resourceIds: [],
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (d: Discount) => {
    setEditingDiscount(d);
    setFormData({
      tenantId: d.tenantId,
      branchId: d.branchId || undefined,
      name: d.name,
      type: d.type,
      value: d.value,
      conditionType: d.conditionType,
      code: d.code || "",
      daysOfWeek: d.daysOfWeek || [],
      startTime: d.startTime ? d.startTime.substring(0, 5) : "",
      endTime: d.endTime ? d.endTime.substring(0, 5) : "",
      resourceIds: d.resources?.map(r => r.resourceId) || [],
    });
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Clean up body conditionally
      const payload: any = { ...formData };
      
      if (payload.conditionType === DiscountConditionType.PROMO_CODE) {
        payload.daysOfWeek = [];
        payload.startTime = null;
        payload.endTime = null;
        if (!payload.code) throw new Error("El código promocional es obligatorio");
      } else {
        payload.code = null;
        if (!payload.daysOfWeek || payload.daysOfWeek.length === 0) throw new Error("Selecciona al menos un día");
        if (!payload.startTime || !payload.endTime) throw new Error("Rango de horas obligatorio");
      }

      if (editingDiscount) {
        payload.isActive = editingDiscount.isActive;
        await discountsApi.update(editingDiscount.discountId, payload);
        toast.success("Descuento actualizado");
      } else {
        await discountsApi.create(payload as DiscountForm);
        toast.success("Descuento creado con éxito");
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar el descuento");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (d: Discount) => {
    try {
      await discountsApi.update(d.discountId, { isActive: !d.isActive });
      toast.success(d.isActive ? "Descuento pausado" : "Descuento activado");
      fetchData();
    } catch (error) {
      toast.error("Error al cambiar estado");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Seguro que deseas eliminar este descuento? Ya no se podrá usar en nuevas reservas.")) return;
    setIsDeletingId(id);
    try {
      await discountsApi.delete(id);
      toast.success("Descuento eliminado");
      fetchData();
    } catch {
      toast.error("Error al eliminar");
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleDayToggle = (day: number) => {
    setFormData(prev => {
      const current = prev.daysOfWeek || [];
      return {
        ...prev,
        daysOfWeek: current.includes(day) ? current.filter(d => d !== day) : [...current, day]
      };
    });
  };

  const handleResourceToggle = (resourceId: number) => {
    setFormData(prev => {
      const current = prev.resourceIds || [];
      return {
        ...prev,
        resourceIds: current.includes(resourceId) ? current.filter(id => id !== resourceId) : [...current, resourceId]
      };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Crear Descuento
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
        </div>
      ) : discounts.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-2">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Tag className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-medium mb-2">No hay descuentos activos</h3>
          <p className="text-muted-foreground max-w-sm mb-6">
            Crea códigos promocionales o descuentos automáticos por horario para impulsar tus reservas.
          </p>
          <Button onClick={openCreateDialog}>Crear mi primer descuento</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {discounts.map(discount => {
            const isPromo = discount.conditionType === DiscountConditionType.PROMO_CODE;
            return (
              <Card key={discount.discountId} className={`relative overflow-hidden transition-all hover:shadow-md ${!discount.isActive ? 'opacity-75 grayscale-[30%]' : ''}`}>
                <div className={`absolute top-0 w-full h-1.5 ${discount.isActive ? 'bg-primary' : 'bg-muted-foreground'}`} />
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge variant={isPromo ? "default" : "secondary"} className="mb-2 uppercase tracking-tight text-[10px]">
                        {isPromo ? "Código Promocional" : "Por Horario"}
                      </Badge>
                      <CardTitle className="text-xl">{discount.name}</CardTitle>
                    </div>
                    <Switch 
                      checked={discount.isActive} 
                      onCheckedChange={() => handleToggleActive(discount)}
                      title={discount.isActive ? "Desactivar" : "Activar"}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-primary">
                      {discount.type === DiscountType.PERCENTAGE ? `${discount.value}%` : `-${formatCurrency(discount.value)}`}
                    </span>
                    <span className="text-sm font-medium text-muted-foreground uppercase leading-tight">
                      De <br/> Descuento
                    </span>
                  </div>

                  <div className="bg-muted p-3 rounded-lg text-sm space-y-2">
                    {isPromo ? (
                      <div className="flex items-center gap-2 justify-between">
                        <span className="text-muted-foreground">Código:</span>
                        <code className="bg-background px-2 py-1 rounded border font-mono font-bold text-primary">{discount.code}</code>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium text-foreground">{discount.startTime?.substring(0,5)} a {discount.endTime?.substring(0,5)}</p>
                            <p className="text-xs text-muted-foreground">
                              {discount.daysOfWeek?.map(d => DAYS_OF_WEEK.find(dw => dw.value === d)?.label.substring(0,3)).join(', ')}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {!branchId && branches.length > 0 && discount.branchId && (
                      <div className="border-t pt-2 mt-2 flex justify-between">
                         <span className="text-muted-foreground text-xs">Aplica a:</span>
                         <span className="font-medium text-xs truncate max-w-[150px]">{branches.find(b => b.branchId === discount.branchId)?.name || 'Sucursal Específica'}</span>
                      </div>
                    )}

                    {discount.resources && discount.resources.length > 0 && (
                      <div className="border-t pt-2 mt-2 flex justify-between">
                         <span className="text-muted-foreground text-xs">Canchas:</span>
                         <span className="font-medium text-xs truncate max-w-[150px]">{discount.resources.length} seleccionada(s)</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(discount)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(discount.discountId)} disabled={isDeletingId === discount.discountId}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* CREATE/EDIT DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingDiscount ? "Editar Descuento" : "Crear Nuevo Descuento"}</DialogTitle>
            <DialogDescription>Configura las condiciones de esta oferta. Puede ser un código que los usuarios ingresan, o un beneficio automático en ciertos horarios.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Nombre de la Oferta</Label>
                <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej. Promoción de Verano" />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Descuento</Label>
                <Select value={formData.type} onValueChange={(v: DiscountType) => setFormData({...formData, type: v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={DiscountType.PERCENTAGE}>Porcentaje (%)</SelectItem>
                    <SelectItem value={DiscountType.FIXED_AMOUNT}>Monto Fijo ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Valor {formData.type === DiscountType.PERCENTAGE ? "(%)" : "($)"}</Label>
                <Input required type="number" min="0" step="1" value={formData.value} onChange={e => setFormData({...formData, value: parseFloat(e.target.value)})} />
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Condición de Aplicación</Label>
                <Select value={formData.conditionType} onValueChange={(v: DiscountConditionType) => setFormData({...formData, conditionType: v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={DiscountConditionType.PROMO_CODE}>Usando Código Promocional</SelectItem>
                    <SelectItem value={DiscountConditionType.TIME_BASED}>Automático por Días/Horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.conditionType === DiscountConditionType.PROMO_CODE ? (
              <div className="space-y-2 p-4 bg-muted/50 rounded-lg border">
                <Label>Código Promocional</Label>
                <Input required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase().replace(/\s/g, '')})} placeholder="Ej. VERANO20" className="uppercase font-mono font-bold" />
                <p className="text-xs text-muted-foreground mt-1">El cliente deberá ingresarlo exactamente igual (sin espacios) al momento de reservar.</p>
              </div>
            ) : (
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
                <div className="space-y-2">
                  <Label>Días de Aplicación</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {DAYS_OF_WEEK.map((day) => (
                      <Badge
                        key={day.value}
                        variant={formData.daysOfWeek?.includes(day.value) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => handleDayToggle(day.value)}
                      >
                        {day.label.substring(0, 3)}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hora Inicio</Label>
                    <Input type="time" required value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Hora Fin</Label>
                    <Input type="time" required value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} />
                  </div>
                </div>
              </div>
            )}

            {!branchId && branches.length > 0 && (
               <div className="space-y-2 border-t pt-4">
                 <Label>Limitar a Sucursal (Opcional)</Label>
                 <Select value={formData.branchId ? formData.branchId.toString() : "all"} onValueChange={(v) => {
                   setFormData({...formData, branchId: v === "all" ? undefined : parseInt(v), resourceIds: []});
                 }}>
                  <SelectTrigger><SelectValue placeholder="Aplica a todas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las sucursales</SelectItem>
                    {branches.map(b => (
                      <SelectItem key={b.branchId} value={b.branchId.toString()}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
               </div>
            )}

            {formData.branchId && branchResources.length > 0 && (
               <div className="space-y-2 border-t pt-4">
                 <Label>Limitar a Canchas (Opcional)</Label>
                 <p className="text-xs text-muted-foreground">Si no seleccionas ninguna, aplicará para <b>todas</b> las canchas de la sucursal.</p>
                 <div className="grid grid-cols-2 gap-2 mt-2">
                   {branchResources.map(r => (
                     <div key={r.resourceId} className="flex items-center space-x-2 border rounded-md p-2 hover:bg-muted cursor-pointer" onClick={() => handleResourceToggle(r.resourceId!)}>
                       <div className={`w-4 h-4 rounded-sm border flex items-center justify-center ${formData.resourceIds?.includes(r.resourceId!) ? 'bg-primary border-primary' : 'border-input'}`}>
                         {formData.resourceIds?.includes(r.resourceId!) && <div className="w-2 h-2 bg-background rounded-sm" />}
                       </div>
                       <Label className="cursor-pointer truncate text-sm">{r.name}</Label>
                     </div>
                   ))}
                 </div>
               </div>
            )}

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Guardando..." : "Guardar Descuento"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
