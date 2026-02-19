"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Clock,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Car,
  Wifi,
  ShowerHead,
  Lock,
  Coffee,
  Dumbbell,
  Bath,
  Info,
  CheckCircle2,
  ClipboardCheck,
  Ban,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  publicApi,
  bookingsApi,
  resourcesApi,
  branchesApi,
} from "@/lib/api/endpoints";
import { Resource, BranchHours, CalendarBooking, CalendarBlockedSlot } from "@/lib/types";
import { formatCurrency, formatDate, cn, generateTimeSlots } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantTheme } from "@/components/TenantThemeProvider";

// Amenities configuration
const AMENITIES = [
  { key: "hasParking", label: "Estacionamiento", icon: Car },
  { key: "hasBathrooms", label: "Baños", icon: Bath },
  { key: "hasShowers", label: "Duchas", icon: ShowerHead },
  { key: "hasLockers", label: "Lockers", icon: Lock },
  { key: "hasWifi", label: "WiFi", icon: Wifi },
  { key: "hasCafeteria", label: "Cafetería", icon: Coffee },
  { key: "hasEquipmentRental", label: "Renta de equipo", icon: Dumbbell },
] as const;

// CalendarBooking and CalendarBlockedSlot are imported from @/lib/types

export default function ResourceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { applyTheme, clearTheme } = useTenantTheme();

  const tenantSlug = params.tenantSlug as string;
  const branchSlug = params.branchSlug as string;
  const resourceId = params.resourceId as string;

  const [resource, setResource] = useState<Resource | null>(null);
  const [branchHours, setBranchHours] = useState<BranchHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [blockedSlotsList, setBlockedSlotsList] = useState<
    CalendarBlockedSlot[]
  >([]);
  const [booking, setBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<{
    status: string;
  } | null>(null);

  // Get branch hours for selected date
  const getHoursForDate = useCallback(
    (date: Date) => {
      const dayOfWeek = date.getDay();
      return branchHours.find((h) => h.dayOfWeek === dayOfWeek);
    },
    [branchHours],
  );

  // Check if the selected day is closed
  const isDayClosed = useCallback(
    (date: Date) => {
      const hours = getHoursForDate(date);
      return hours?.isClosed ?? false;
    },
    [getHoursForDate],
  );

  // Generate time slots based on branch hours for the selected date
  const timeSlots = (() => {
    const hours = getHoursForDate(selectedDate);
    if (!hours || hours.isClosed) return [];
    return generateTimeSlots(
      hours.openTime,
      hours.closeTime,
      resource?.slotMinutes || 60,
    );
  })();

  useEffect(() => {
    fetchResource();
    return () => clearTheme();
  }, [resourceId]);

  useEffect(() => {
    if (resource) {
      fetchCalendarData();
    }
  }, [resource, selectedDate]);

  const fetchResource = async () => {
    try {
      setLoading(true);
      const data = await publicApi.getResource(resourceId);
      setResource(data);
      // Apply tenant theme
      if (data.branch?.tenant) {
        applyTheme(data.branch.tenant);
      }
      // Fetch branch hours
      if (data.branchId) {
        try {
          const hours = await branchesApi.getHours(data.branchId);
          const hData = Array.isArray(hours)
            ? hours
            : (hours as unknown as { data: BranchHours[] }).data || [];
          setBranchHours(hData);
        } catch {
          // Branch hours not available, will use defaults
        }
      }
    } catch (error) {
      toast.error("Error al cargar el recurso");
      router.push(`/${tenantSlug}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendarData = async () => {
    if (!resource) return;
    try {
      const dateStr = selectedDate.toISOString().split("T")[0];
      const calendarData = await resourcesApi.getCalendar(
        resource.resourceId,
        dateStr,
        dateStr,
      );

      // Map bookings to booked start times
      const bookings = calendarData.bookings || [];
      const booked = bookings.map((b: CalendarBooking) => {
        const startDate = new Date(b.startAt);
        return startDate.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        });
      });
      setBookedSlots(booked);

      // Store blocked slots
      setBlockedSlotsList(calendarData.blockedSlots || []);
    } catch (error) {
      console.error("Error fetching calendar data:", error);
      setBookedSlots([]);
      setBlockedSlotsList([]);
    }
  };

  const handleDateChange = (days: number) => {
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    const newDate = new Date(selectedDate);
    
    // Skip closed days (try up to 7 days to avoid infinite loop)
    for (let i = 0; i < 7; i++) {
      newDate.setDate(newDate.getDate() + days);
      // Don't allow past dates
      if (newDate < today) return;
      // If this day is open, use it
      if (!isDayClosed(newDate)) {
        setSelectedDate(new Date(newDate));
        setSelectedSlot(null);
        setBookingSuccess(null);
        return;
      }
    }
  };

  const isSlotBlocked = (time: string) => {
    const dateStr = selectedDate.toISOString().split("T")[0];
    return blockedSlotsList.some(
      (bs) => bs.date === dateStr && time >= bs.startTime && time < bs.endTime,
    );
  };

  const handleBooking = async () => {
    if (!selectedSlot || !resource) return;

    if (!user) {
      toast.error("Debes iniciar sesión para reservar");
      router.push("/login");
      return;
    }

    try {
      setBooking(true);
      const dateStr = selectedDate.toISOString().split("T")[0];
      const slot = timeSlots.find((s) => s.start === selectedSlot);
      const endTime = slot?.end || selectedSlot;

      const requiresApproval = resource.branch?.requiresApproval;

      const result = await toast.promise(
        bookingsApi.createAsUser({
          resourceId: resource.resourceId,
          startAt: `${dateStr}T${selectedSlot}:00`,
          endAt: `${dateStr}T${endTime}:00`,
        }),
        {
          loading: "Realizando reserva...",
          success: requiresApproval
            ? "Reserva enviada. Pendiente de aprobación."
            : "¡Reserva confirmada con éxito!",
          error: "Error al realizar la reserva",
        },
      );

      // Show success state instead of navigating away
      const bookingData =
        (result as unknown as { data?: { status: string } }).data || result;
      setBookingSuccess({
        status:
          (bookingData as { status?: string }).status ||
          (requiresApproval ? "pending" : "confirmed"),
      });
      setSelectedSlot(null);
      // Refresh calendar data
      fetchCalendarData();
    } catch {
      // handled by toast.promise
    } finally {
      setBooking(false);
    }
  };

  const isSlotBooked = (time: string) => bookedSlots.includes(time);
  const isSlotPast = (time: string) => {
    const today = new Date();
    const slotDate = new Date(selectedDate);
    const [hours, minutes] = time.split(":").map(Number);
    slotDate.setHours(hours, minutes, 0, 0);
    return slotDate < today;
  };

  const getBranchAmenities = () => {
    if (!resource?.branch) return [];
    return AMENITIES.filter(
      (amenity) =>
        resource.branch![amenity.key as keyof typeof resource.branch],
    );
  };

  // Get branch hours display string
  const getBranchHoursDisplay = () => {
    const hours = getHoursForDate(selectedDate);
    if (!hours || hours.isClosed) return null;
    return `${hours.openTime} - ${hours.closeTime}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Skeleton className="h-64 w-full rounded-lg mb-4" />
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div>
            <Skeleton className="h-96 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!resource) {
    return null;
  }

  const amenities = getBranchAmenities();
  const requiresApproval = resource.branch?.requiresApproval;
  const dayClosed = isDayClosed(selectedDate);
  const hoursDisplay = getBranchHoursDisplay();

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href={`/${tenantSlug}/${branchSlug}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Volver a {resource.branch?.name}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Resource Info */}
        <div className="lg:col-span-2">
          <div className="relative h-64 md:h-80 bg-muted rounded-lg overflow-hidden mb-6">
            {resource.imageUrl ? (
              <img
                src={resource.imageUrl}
                alt={resource.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10">
                <span className="text-6xl">
                  {resource.sport?.name === "Fútbol" && "⚽"}
                  {resource.sport?.name === "Tenis" && "🎾"}
                  {resource.sport?.name === "Pádel" && "🏸"}
                  {resource.sport?.name === "Básquetbol" && "🏀"}
                  {resource.sport?.name === "Voleibol" && "🏐"}
                  {!resource.sport?.name && "🏟️"}
                </span>
              </div>
            )}
            <Badge className="absolute top-4 right-4" variant="secondary">
              {resource.sport?.name || "Deporte"}
            </Badge>
          </div>

          <h1 className="text-3xl font-bold mb-2">{resource.name}</h1>

          <div className="flex flex-wrap gap-4 text-muted-foreground mb-4">
            {resource.branch && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>
                  {resource.branch.name}
                  {resource.branch.tenant &&
                    ` - ${resource.branch.tenant.name}`}
                </span>
              </div>
            )}
            {hoursDisplay && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{hoursDisplay}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              <span>{formatCurrency(resource.pricePerHour)}/hora</span>
            </div>
          </div>

          {/* Approval notice */}
          {requiresApproval && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 mb-6">
              <ClipboardCheck className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  Esta sucursal requiere aprobación
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  Tu reserva quedará pendiente hasta que un administrador la
                  confirme.
                </p>
              </div>
            </div>
          )}

          {resource.description && (
            <p className="text-muted-foreground mb-6">{resource.description}</p>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Características</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Tipo</span>
                  <p className="font-medium">{resource.type || "Cancha"}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    Duración por slot
                  </span>
                  <p className="font-medium">
                    {resource.slotMinutes || 60} minutos
                  </p>
                </div>
                {resource.capacity && (
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Capacidad
                    </span>
                    <p className="font-medium">{resource.capacity} personas</p>
                  </div>
                )}
                {resource.surface && (
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Superficie
                    </span>
                    <p className="font-medium">{resource.surface}</p>
                  </div>
                )}
                {resource.indoor !== undefined && (
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Ubicación
                    </span>
                    <p className="font-medium">
                      {resource.indoor ? "Techada" : "Al aire libre"}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Branch Amenities */}
          {amenities.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Amenidades de la sucursal</CardTitle>
                <CardDescription>{resource.branch?.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {amenities.map((amenity) => {
                    const Icon = amenity.icon;
                    return (
                      <div
                        key={amenity.key}
                        className="flex items-center gap-2"
                      >
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-sm">{amenity.label}</span>
                      </div>
                    );
                  })}
                </div>
                {resource.branch?.amenitiesDescription && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    {resource.branch.amenitiesDescription}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Booking Panel */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Reservar</CardTitle>
              <CardDescription>Selecciona fecha y horario</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Booking success message */}
              {bookingSuccess && (
                <div
                  className={cn(
                    "flex items-start gap-3 p-4 rounded-lg border",
                    bookingSuccess.status === "confirmed"
                      ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                      : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
                  )}
                >
                  {bookingSuccess.status === "confirmed" ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                  ) : (
                    <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p
                      className={cn(
                        "text-sm font-medium",
                        bookingSuccess.status === "confirmed"
                          ? "text-emerald-800 dark:text-emerald-300"
                          : "text-amber-800 dark:text-amber-300",
                      )}
                    >
                      {bookingSuccess.status === "confirmed"
                        ? "¡Reserva confirmada!"
                        : "Reserva pendiente de aprobación"}
                    </p>
                    <p
                      className={cn(
                        "text-xs mt-1",
                        bookingSuccess.status === "confirmed"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-amber-600 dark:text-amber-400",
                      )}
                    >
                      {bookingSuccess.status === "confirmed"
                        ? "Puedes ver tus reservas en tu perfil."
                        : "Un administrador revisará y confirmará tu reserva."}
                    </p>
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto mt-2"
                      onClick={() => router.push("/bookings")}
                    >
                      Ver mis reservas
                    </Button>
                  </div>
                </div>
              )}

              {/* Date Selector */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDateChange(-1)}
                  disabled={
                    selectedDate <= new Date(new Date().setHours(0, 0, 0, 0))
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-center">
                  <p className="font-medium">
                    {formatDate(selectedDate.toISOString())}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDate.toLocaleDateString("es-ES", {
                      weekday: "long",
                    })}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDateChange(1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Closed day message */}
              {dayClosed ? (
                <div className="flex items-center gap-3 p-6 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center">
                  <Ban className="h-5 w-5 text-zinc-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Cerrado
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      La sucursal no opera este día
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Time Slots */}
                  <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                    {timeSlots.map((slot) => {
                      const booked = isSlotBooked(slot.start);
                      const blocked = isSlotBlocked(slot.start);
                      const past = isSlotPast(slot.start);
                      const disabled = booked || blocked || past;
                      const selected = selectedSlot === slot.start;

                      return (
                        <Button
                          key={slot.start}
                          variant={selected ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "text-xs",
                            disabled &&
                              "opacity-50 cursor-not-allowed line-through",
                            booked &&
                              "bg-red-100 dark:bg-red-900/20 border-red-300",
                            blocked &&
                              "bg-zinc-100 dark:bg-zinc-900/20 border-zinc-300",
                          )}
                          disabled={disabled}
                          onClick={() => setSelectedSlot(slot.start)}
                        >
                          {slot.start}
                        </Button>
                      );
                    })}
                  </div>

                  {timeSlots.length === 0 && (
                    <p className="text-sm text-center text-muted-foreground py-4">
                      No hay horarios disponibles para este día
                    </p>
                  )}
                </>
              )}

              {/* Selected Slot Summary */}
              {selectedSlot && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">
                    Resumen de reserva
                  </p>
                  <p className="font-medium">
                    {formatDate(selectedDate.toISOString())} a las{" "}
                    {selectedSlot}
                  </p>
                  <p className="text-lg font-bold text-primary mt-2">
                    {formatCurrency(resource.pricePerHour)}
                  </p>
                  {requiresApproval && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Sujeta a aprobación del administrador
                    </p>
                  )}
                </div>
              )}

              {/* Book Button */}
              <Button
                className="w-full"
                size="lg"
                disabled={!selectedSlot || booking || dayClosed}
                onClick={handleBooking}
              >
                {booking
                  ? "Reservando..."
                  : requiresApproval
                    ? "Solicitar Reserva"
                    : "Confirmar Reserva"}
              </Button>

              {!user && (
                <p className="text-xs text-center text-muted-foreground">
                  Debes{" "}
                  <Link href="/login" className="text-primary hover:underline">
                    iniciar sesión
                  </Link>{" "}
                  para reservar
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
