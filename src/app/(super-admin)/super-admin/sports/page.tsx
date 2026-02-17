"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
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
} from "@/components/ui";
import { Plus, Pencil, Trash2, Trophy } from "lucide-react";
import { sportsApi } from "@/lib/api";
import { Sport } from "@/lib/types";

const sportSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  description: z.string().optional(),
});

type SportFormData = z.infer<typeof sportSchema>;

export default function SportsPage() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSport, setEditingSport] = useState<Sport | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Sport | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SportFormData>({
    resolver: zodResolver(sportSchema),
  });

  useEffect(() => {
    loadSports();
  }, []);

  const loadSports = async () => {
    try {
      const response = await sportsApi.list();
      // Handle both array response and wrapped response
      const sportsList = Array.isArray(response) ? response : [];
      setSports(sportsList);
    } catch (error) {
      console.error("Error loading sports:", error);
      toast.error("Error al cargar deportes");
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingSport(null);
    reset({ name: "", description: "" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (sport: Sport) => {
    setEditingSport(sport);
    reset({
      name: sport.name,
      description: sport.description || "",
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: SportFormData) => {
    setIsSubmitting(true);
    try {
      if (editingSport) {
        await sportsApi.update(editingSport.id, data);
        toast.success("Deporte actualizado");
      } else {
        await sportsApi.create(data);
        toast.success("Deporte creado");
      }
      setIsDialogOpen(false);
      loadSports();
    } catch (error) {
      toast.error(editingSport ? "Error al actualizar" : "Error al crear");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (sport: Sport) => {
    try {
      await sportsApi.delete(sport.id);
      toast.success("Deporte eliminado");
      setDeleteConfirm(null);
      loadSports();
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Deportes</h1>
            <p className="text-muted-foreground">
              Gestiona los deportes del sistema
            </p>
          </div>
          <Skeleton className="h-10 w-32" />
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
          <h1 className="text-3xl font-bold">Deportes</h1>
          <p className="text-muted-foreground">
            Gestiona los deportes del sistema ({sports.length} total)
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo deporte
        </Button>
      </div>

      {/* Sports List */}
      {sports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium">No hay deportes</p>
            <p className="text-muted-foreground mb-4">
              Crea tu primer deporte para comenzar
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Crear deporte
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sports.map((sport) => (
            <Card key={sport.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Trophy className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{sport.name}</h3>
                        {sport.isActive !== undefined && (
                          <Badge
                            variant={sport.isActive ? "success" : "secondary"}
                          >
                            {sport.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        )}
                      </div>
                      {sport.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {sport.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(sport)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => setDeleteConfirm(sport)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSport ? "Editar deporte" : "Nuevo deporte"}
            </DialogTitle>
            <DialogDescription>
              {editingSport
                ? "Modifica los datos del deporte"
                : "Completa el formulario para crear un nuevo deporte"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                placeholder="Fútbol"
                {...register("name")}
                error={errors.name?.message}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Input
                id="description"
                placeholder="Fútbol 5, 7 u 11 jugadores"
                {...register("description")}
                error={errors.description?.message}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                {editingSport ? "Guardar cambios" : "Crear deporte"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar deporte?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará el deporte{" "}
              <strong>{deleteConfirm?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
