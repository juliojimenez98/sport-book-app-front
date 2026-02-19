"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Skeleton,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import { Calendar, Clock, MapPin, X, AlertCircle } from "lucide-react";
import { usersApi, bookingsApi } from "@/lib/api";
import { Booking, BookingStatus } from "@/lib/types";
import {
  formatDate,
  formatTime,
  formatCurrency,
  getStatusColor,
} from "@/lib/utils";

const statusLabels: Record<BookingStatus, string> = {
  [BookingStatus.PENDING]: "Pendiente",
  [BookingStatus.CONFIRMED]: "Confirmada",
  [BookingStatus.CANCELLED]: "Cancelada",
  [BookingStatus.COMPLETED]: "Completada",
  [BookingStatus.NO_SHOW]: "No asistió",
};

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancelDialog, setCancelDialog] = useState<{
    open: boolean;
    booking: Booking | null;
  }>({ open: false, booking: null });
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const data = await usersApi.getMyBookings();
      setBookings(data);
    } catch (error) {
      toast.error("Error al cargar las reservas");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelDialog.booking) return;

    setIsCancelling(true);
    try {
      await toast.promise(bookingsApi.cancel(cancelDialog.booking.bookingId), {
        loading: "Cancelando reserva...",
        success: "Reserva cancelada exitosamente",
        error: "Error al cancelar la reserva",
      });
      setCancelDialog({ open: false, booking: null });
      loadBookings();
    } catch {
      // handled by toast.promise
    } finally {
      setIsCancelling(false);
    }
  };

  const activeBookings = bookings.filter(
    (b) =>
      b.status === BookingStatus.PENDING ||
      b.status === BookingStatus.CONFIRMED,
  );
  const pastBookings = bookings.filter(
    (b) =>
      b.status === BookingStatus.COMPLETED ||
      b.status === BookingStatus.CANCELLED ||
      b.status === BookingStatus.NO_SHOW,
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mis reservas</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tus reservas activas e historial
          </p>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <Skeleton className="h-24 w-24 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Mis reservas</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona tus reservas activas e historial
        </p>
      </div>

      {/* Active Bookings */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Reservas activas</h2>
        {activeBookings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                No tienes reservas activas
              </p>
              <Button className="mt-4" onClick={() => router.push("/browse")}>
                Buscar canchas
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {activeBookings.map((booking) => (
              <Card key={booking.bookingId} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="bg-primary/10 p-6 flex flex-col items-center justify-center md:w-40">
                      <Calendar className="h-8 w-8 text-primary mb-2" />
                      <p className="text-sm font-medium text-center">
                        {formatDate(booking.startAt, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(booking.startAt)} -{" "}
                        {formatTime(booking.endAt)}
                      </p>
                    </div>
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {booking.resource?.name}
                          </h3>
                          <p className="text-muted-foreground text-sm flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {booking.resource?.branch?.name}
                          </p>
                          <Badge
                            variant={
                              booking.status === BookingStatus.CONFIRMED
                                ? "success"
                                : "warning"
                            }
                            className="mt-2"
                          >
                            {statusLabels[booking.status]}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">
                            {formatCurrency(
                              booking.totalPrice,
                              booking.currency,
                            )}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive mt-2"
                            onClick={() =>
                              setCancelDialog({ open: true, booking })
                            }
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Past Bookings */}
      {pastBookings.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Historial</h2>
          <div className="grid gap-4">
            {pastBookings.map((booking) => (
              <Card
                key={booking.bookingId}
                className="opacity-75 hover:opacity-100 transition-opacity"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-sm font-medium">
                          {formatDate(booking.startAt, {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(booking.startAt)}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">{booking.resource?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.resource?.branch?.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={getStatusColor(booking.status)}>
                        {statusLabels[booking.status]}
                      </Badge>
                      <p className="font-medium">
                        {formatCurrency(booking.totalPrice, booking.currency)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Cancel Dialog */}
      <Dialog
        open={cancelDialog.open}
        onOpenChange={(open) =>
          !isCancelling && setCancelDialog({ open, booking: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Cancelar reserva
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas cancelar esta reserva?
              {cancelDialog.booking && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="font-medium">
                    {cancelDialog.booking.resource?.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(cancelDialog.booking.startAt)} •{" "}
                    {formatTime(cancelDialog.booking.startAt)} -{" "}
                    {formatTime(cancelDialog.booking.endAt)}
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialog({ open: false, booking: null })}
              disabled={isCancelling}
            >
              Volver
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelBooking}
              isLoading={isCancelling}
            >
              Confirmar cancelación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
