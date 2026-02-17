"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Clock,
  DollarSign,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Car,
  Wifi,
  ShowerHead,
  Lock,
  Coffee,
  Dumbbell,
  Bath,
} from "lucide-react";
import { toast } from "sonner";
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
import { publicApi, bookingsApi } from "@/lib/api/endpoints";
import { Resource } from "@/lib/types";
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

export default function ResourceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { applyTheme, clearTheme } = useTenantTheme();

  const tenantSlug = params.tenantSlug as string;
  const branchSlug = params.branchSlug as string;
  const resourceId = params.resourceId as string;

  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [booking, setBooking] = useState(false);

  // Generate time slots for the resource
  const timeSlots = resource
    ? generateTimeSlots(
        resource.openTime || "08:00",
        resource.closeTime || "22:00",
        resource.slotMinutes || 60,
      )
    : [];

  useEffect(() => {
    fetchResource();
    return () => clearTheme();
  }, [resourceId]);

  useEffect(() => {
    if (resource) {
      fetchBookedSlots();
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
    } catch (error) {
      toast.error("Error al cargar el recurso");
      router.push(`/${tenantSlug}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookedSlots = async () => {
    try {
      // In a real app, this would fetch bookings for the specific date
      const dateStr = selectedDate.toISOString().split("T")[0];
      // Simulating random booked slots for demo
      const randomBooked = timeSlots
        .filter(() => Math.random() > 0.7)
        .map((slot) => slot.start);
      setBookedSlots(randomBooked);
    } catch (error) {
      console.error("Error fetching booked slots:", error);
    }
  };

  const handleDateChange = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    // Don't allow past dates
    if (newDate >= new Date(new Date().setHours(0, 0, 0, 0))) {
      setSelectedDate(newDate);
      setSelectedSlot(null);
    }
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

      await bookingsApi.createAsUser({
        resourceId: resource.id,
        startAt: `${dateStr}T${selectedSlot}:00`,
        endAt: `${dateStr}T${endTime}:00`,
      });

      toast.success("¡Reserva realizada con éxito!");
      router.push("/bookings");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Error al realizar la reserva",
      );
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
      (amenity) => resource.branch![amenity.key as keyof typeof resource.branch],
    );
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
                    {resource.branch.tenant && ` - ${resource.branch.tenant.name}`}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>
                  {resource.openTime || "08:00"} - {resource.closeTime || "22:00"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                <span>{formatCurrency(resource.pricePerHour)}/hora</span>
              </div>
            </div>

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
                    <p className="font-medium">{resource.slotMinutes} minutos</p>
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
                        <div key={amenity.key} className="flex items-center gap-2">
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

                {/* Time Slots */}
                <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                  {timeSlots.map((slot) => {
                    const booked = isSlotBooked(slot.start);
                    const past = isSlotPast(slot.start);
                    const disabled = booked || past;
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
                        )}
                        disabled={disabled}
                        onClick={() => setSelectedSlot(slot.start)}
                      >
                        {slot.start}
                      </Button>
                    );
                  })}
                </div>

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
                  </div>
                )}

                {/* Book Button */}
                <Button
                  className="w-full"
                  size="lg"
                  disabled={!selectedSlot || booking}
                  onClick={handleBooking}
                >
                  {booking ? "Reservando..." : "Confirmar Reserva"}
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
