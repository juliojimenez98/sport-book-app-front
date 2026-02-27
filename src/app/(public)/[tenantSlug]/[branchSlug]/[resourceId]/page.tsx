"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  BadgePercent,
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
import { Input } from "@/components/ui/input";
import {
  publicApi,
  bookingsApi,
  resourcesApi,
  branchesApi,
  getAssetUrl
} from "@/lib/api/endpoints";
import { Resource, BranchHours, CalendarBooking, CalendarBlockedSlot, Discount, DiscountType, CalendarResponse } from "@/lib/types";
import { formatCurrency, formatDate, cn, generateTimeSlots } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantTheme } from "@/components/TenantThemeProvider";
import { ImageGallery } from "@/components/ui/image-gallery";

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
  const [currentWeekDate, setCurrentWeekDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  
  // Selected slot is now an object with date (YYYY-MM-DD) and time (HH:MM)
  const [selectedSlot, setSelectedSlot] = useState<{date: string, time: string, pendingId?: number} | null>(null);
  
  // Changed to store arrays of { date, time } objects
  const [bookedSlots, setBookedSlots] = useState<{date: string, time: string}[]>([]);
  const [pendingBookingSlots, setPendingBookingSlots] = useState<{date: string, time: string, id: number}[]>([]);
  const [blockedSlotsList, setBlockedSlotsList] = useState<CalendarBlockedSlot[]>([]);
  
  const [booking, setBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<{ status: string } | null>(null);

  // Calendar Discounts
  const [calendarDiscounts, setCalendarDiscounts] = useState<CalendarResponse["discounts"]>([]);

  // Discount code state
  const [discountCode, setDiscountCode] = useState("");
  const [pricePreview, setPricePreview] = useState<{ originalPrice: number; totalPrice: number; discount: Discount | null } | null>(null);
  const [isCheckingDiscount, setIsCheckingDiscount] = useState(false);
  const [discountError, setDiscountError] = useState("");

  const bookingSectionRef = useRef<HTMLDivElement>(null);

  // Get week days based on currentWeekDate
  const weekDays = (() => {
    const startOfWeek = new Date(currentWeekDate);
    const day = startOfWeek.getDay();
    // Adjust to Monday (1)
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); 
    startOfWeek.setDate(diff);
    
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      return d;
    });
  })();

  // Helper to get local date string YYYY-MM-DD reliably
  const getLocalDateString = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const weekStartStr = getLocalDateString(weekDays[0]);
  const weekEndStr = getLocalDateString(weekDays[6]);

  // Compute dynamic Y-axis time slots based on branch hours across the week
  const gridTimeSlots = (() => {
    if (branchHours.length === 0) return generateTimeSlots(7, 23, resource?.slotMinutes || 60);
    const openDays = branchHours.filter(h => !h.isClosed);
    if (openDays.length === 0) return generateTimeSlots(7, 23, resource?.slotMinutes || 60);
    
    const earliestOpen = openDays.reduce((min, h) => h.openTime < min ? h.openTime : min, openDays[0].openTime);
    const latestClose = openDays.reduce((max, h) => h.closeTime > max ? h.closeTime : max, openDays[0].closeTime);
    
    return generateTimeSlots(earliestOpen, latestClose, resource?.slotMinutes || 60);
  })();

  // Get branch hours for a specific week day
  const getHoursForDate = useCallback(
    (date: Date) => {
      const dayOfWeek = date.getDay();
      return branchHours.find((h) => h.dayOfWeek === dayOfWeek);
    },
    [branchHours],
  );

  // Check if a specific day is closed
  const isDayClosed = useCallback(
    (date: Date) => {
      const hours = getHoursForDate(date);
      // If no hours are defined, treat as open to prevent blocking if not configured
      if (!hours) return false;
      return hours.isClosed;
    },
    [getHoursForDate],
  );

  useEffect(() => {
    fetchResource();
    return () => clearTheme();
  }, [resourceId]);

  useEffect(() => {
    if (resource) {
      fetchCalendarData();
    }
  }, [resource, currentWeekDate, user]);

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
      const calendarData = await resourcesApi.getCalendar(
        resource.resourceId,
        weekStartStr,
        weekEndStr,
      );

      const bookings = calendarData.bookings || [];
      const confirmed: {date: string, time: string}[] = [];
      const myPending: {date: string, time: string, id: number}[] = [];

      bookings.forEach((b: CalendarBooking) => {
        // Use local components directly based on the startAt value returned
        // We assume backend startAt represents the exact intended slot
        const startDate = new Date(b.startAt);
        const dateStr = getLocalDateString(startDate);
        const timeStr = startDate.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        });

        if (b.status === "confirmed") {
          confirmed.push({ date: dateStr, time: timeStr });
        } else if (
          b.status === "pending" &&
          user &&
          b.userId === user.userId
        ) {
          myPending.push({ date: dateStr, time: timeStr, id: b.id });
        }
      });

      setBookedSlots(confirmed);
      setPendingBookingSlots(myPending);
      setBlockedSlotsList(calendarData.blockedSlots || []);
      setCalendarDiscounts(calendarData.discounts || []);
    } catch (error) {
      console.error("Error fetching calendar data:", error);
      setBookedSlots([]);
      setBlockedSlotsList([]);
    }
  };

  const handleWeekChange = (offsetWeeks: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const newDate = new Date(currentWeekDate);
    newDate.setDate(newDate.getDate() + (offsetWeeks * 7));
    
    setCurrentWeekDate(newDate);
    setSelectedSlot(null);
    setPricePreview(null);
    setBookingSuccess(null);
  };

  const handleCancelBooking = async () => {
    if (!selectedSlot?.pendingId) return;

    try {
      setBooking(true);
      await toast.promise(
        bookingsApi.cancel(selectedSlot.pendingId, "Cancelada por el cliente"),
        {
          loading: "Anulando reserva...",
          success: "Reserva anulada con éxito",
          error: "Error al anular la reserva",
        }
      );

      setSelectedSlot(null);
      fetchCalendarData();
    } catch {
      // Handled by toast.promise
    } finally {
      setBooking(false);
    }
  };

  const calculatePrice = async (codeToApply?: string) => {
    if (!selectedSlot || !resource?.branch?.tenantId) return;
    
    setIsCheckingDiscount(true);
    setDiscountError("");
    setPricePreview(null);

    const dateStr = selectedSlot.date;
    const [hours, minutes] = selectedSlot.time.split(":").map(Number);
    const endDate = new Date(currentWeekDate);
    endDate.setHours(hours, minutes + (resource.slotMinutes || 60), 0, 0);
    const endHours = String(endDate.getHours()).padStart(2, '0');
    const endMinutes = String(endDate.getMinutes()).padStart(2, '0');
    const endStr = `${endHours}:${endMinutes}`;

    try {
      const res = await publicApi.calculateDiscount({
        code: codeToApply,
        tenantId: resource.branch.tenantId,
        branchId: resource.branch.branchId,
        resourceId: resource.resourceId,
        startAt: `${dateStr}T${selectedSlot.time}:00`,
        endAt: `${dateStr}T${endStr}:00`,
      });
      setPricePreview(res as any);
      if (codeToApply && res.discount) {
        toast.success("Código aplicado con éxito");
      } else if (codeToApply && !res.discount) {
        setDiscountError("Código inválido o expirado");
      }
    } catch (error: any) {
      if (codeToApply) {
        setDiscountError(error.message || "Código inválido");
      }
    } finally {
      setIsCheckingDiscount(false);
    }
  };

  useEffect(() => {
    if (selectedSlot && !selectedSlot.pendingId) {
      calculatePrice(discountCode);
    } else {
      setPricePreview(null);
    }
  }, [selectedSlot]);

  const handleBooking = async () => {
    if (!selectedSlot || !resource) return;

    if (!user) {
      toast.error("Debes iniciar sesión para reservar");
      router.push("/login");
      return;
    }

    try {
      setBooking(true);
      const dateStr = selectedSlot.date;
      const [hours, minutes] = selectedSlot.time.split(":").map(Number);
      const endDate = new Date(currentWeekDate);
      endDate.setHours(hours, minutes + (resource.slotMinutes || 60), 0, 0);
      const endStr = endDate.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const paramsForCheckout = new URLSearchParams({
        resourceId: resource.resourceId.toString(),
        startAt: `${dateStr}T${selectedSlot.time}:00`,
        endAt: `${dateStr}T${endStr}:00`,
      });

      if (pricePreview?.discount?.code) {
        paramsForCheckout.append("discountCode", pricePreview.discount.code);
      }

      router.push(`/${tenantSlug}/${branchSlug}/checkout?${paramsForCheckout.toString()}`);
    } catch (error) {
      console.error("Error in handleBooking:", error);
    } finally {
      setBooking(false);
    }
  };

  const getBranchAmenities = () => {
    if (!resource?.branch) return [];
    return AMENITIES.filter(
      (amenity) =>
        resource.branch![amenity.key as keyof typeof resource.branch],
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
  const requiresApproval = resource.branch?.requiresApproval;

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
        <div className="lg:col-span-1 lg:order-1">
          <div className="mb-6 relative h-64 md:h-80 rounded-xl overflow-hidden">
             <ImageGallery 
                images={resource.images?.map(img => getAssetUrl(img.imageUrl)) || (resource.imageUrl ? [getAssetUrl(resource.imageUrl)] : [])}
                alt={resource.name}
                fallbackIcon={<span className="text-6xl text-primary/50">
                   {resource.sport?.name === "Fútbol" && "⚽"}
                   {resource.sport?.name === "Tenis" && "🎾"}
                   {resource.sport?.name === "Pádel" && "🏸"}
                   {resource.sport?.name === "Básquetbol" && "🏀"}
                   {resource.sport?.name === "Voleibol" && "🏐"}
                   {!resource.sport?.name && "🏟️"}
                </span>}
             />
            <Badge className="absolute top-4 right-4 z-10 shadow-sm" variant="secondary">
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
        <div className="lg:col-span-2 lg:order-2">
          <Card>
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

              {/* Week Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleWeekChange(-1)}
                  disabled={
                    new Date(weekStartStr) <= new Date(new Date().setHours(0, 0, 0, 0))
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-center">
                  <p className="font-medium text-sm">
                    {formatDate(weekStartStr)} - {formatDate(weekEndStr)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleWeekChange(1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Weekly Calendar Grid */}
              <div className="border rounded-lg overflow-x-auto shadow-xs bg-card">
                <div className="min-w-[700px]">
                  {/* Grid Header (Days) */}
                  <div className="grid grid-cols-[auto_repeat(7,1fr)] bg-muted/50 border-b">
                    <div className="w-16 sticky left-0 bg-muted/50 border-r z-20"></div>
                    {weekDays.map((date) => {
                      const dateStr = getLocalDateString(date);
                      const isToday = dateStr === getLocalDateString(new Date());
                      return (
                        <div
                          key={dateStr}
                          className={cn(
                            "py-3 px-2 text-center border-r last:border-r-0 flex flex-col items-center justify-center",
                            isToday && "bg-primary/5",
                          )}
                        >
                          <span className={cn(
                            "text-xs font-medium uppercase",
                            isToday ? "text-primary" : "text-muted-foreground"
                          )}>
                            {date.toLocaleDateString("es-ES", { weekday: "short" })}
                          </span>
                          <span className={cn(
                            "text-lg font-bold mt-0.5 w-8 h-8 flex items-center justify-center rounded-full",
                            isToday ? "bg-primary text-primary-foreground" : "text-foreground"
                          )}>
                            {date.getDate()}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Grid Body (Time Slots) */}
                  <div className="max-h-[500px] overflow-y-auto relative">
                    {gridTimeSlots.length === 0 ? (
                      <div className="py-12 text-center text-muted-foreground flex flex-col items-center">
                        <Ban className="h-8 w-8 mb-2 opacity-20" />
                        <p>No hay horarios disponibles esta semana</p>
                      </div>
                    ) : (
                      gridTimeSlots.map((slot, timeIndex) => (
                        <div
                          key={slot.start}
                          className="grid grid-cols-[auto_repeat(7,1fr)] border-b last:border-b-0 group"
                        >
                          {/* Time Column */}
                          <div className="w-16 sticky left-0 bg-background border-r flex flex-col justify-start py-2 px-1 text-center z-10 group-hover:bg-muted/30 transition-colors">
                            <span className="text-xs font-medium text-muted-foreground">
                              {slot.start}
                            </span>
                          </div>

                          {/* Day Columns for this time */}
                          {weekDays.map((date, dayIndex) => {
                            const dateStr = getLocalDateString(date);
                            const timeStr = slot.start;
                            
                            // Validations
                            const closed = isDayClosed(date);
                            const past = (() => {
                              const today = new Date();
                              const [hours, minutes] = timeStr.split(":").map(Number);
                              const cellDate = new Date(date);
                              cellDate.setHours(hours, minutes, 0, 0);
                              return cellDate < today;
                            })();
                            
                            const booked = bookedSlots.some(b => b.date === dateStr && b.time === timeStr);
                            const pendingCell = pendingBookingSlots.find(b => b.date === dateStr && b.time === timeStr);
                            const pending = !!pendingCell;
                            const blocked = blockedSlotsList.some(bs => bs.date === dateStr && timeStr >= bs.startTime && timeStr < bs.endTime);
                            
                            // Check for discounts on this slot
                            const slotDiscount = calendarDiscounts.find((d: any) => {
                              // Day of week check (0 is Sunday, which matches JS getDay())
                              const dayMatch = !d.daysOfWeek || d.daysOfWeek.includes(date.getDay());
                              if (!dayMatch) return false;

                              // Time range check
                              if (d.startTime && timeStr < d.startTime) return false;
                              if (d.endTime && timeStr >= d.endTime) return false;

                              return true;
                            });
                            
                            const disabled = closed || past || booked || blocked; // pending can be clicked to cancel
                            const isSelected = selectedSlot?.date === dateStr && selectedSlot?.time === timeStr;

                            return (
                              <div
                                key={`${dateStr}-${timeStr}`}
                                className={cn(
                                  "border-r last:border-r-0 min-h-[48px] p-1 transition-all",
                                  (!disabled || pending) && "hover:bg-primary/10 cursor-pointer",
                                  (disabled && !pending) && "bg-muted/30 cursor-not-allowed",
                                  isSelected && "bg-primary/20 ring-1 ring-inset ring-primary",
                                )}
                                onClick={() => {
                                  if (!disabled || pending) {
                                    setSelectedSlot({ date: dateStr, time: timeStr, pendingId: pendingCell?.id });
                                    setBookingSuccess(null);
                                    setTimeout(() => {
                                      bookingSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                                    }, 100);
                                  }
                                }}
                              >
                                <div className="w-full h-full flex items-center justify-center">
                                  {isSelected ? (
                                    <div className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded w-full text-center shadow-sm">
                                      Seleccionado
                                    </div>
                                  ) : booked ? (
                                    <div className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-medium px-2 py-1 rounded w-full text-center truncate">
                                      Ocupado
                                    </div>
                                  ) : pending ? (
                                    <div className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] font-medium px-2 py-1 rounded w-full text-center truncate">
                                      Pendiente
                                    </div>
                                  ) : blocked ? (
                                    <div className="bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 text-[10px] font-medium px-2 py-1 rounded w-full text-center truncate flex items-center justify-center gap-1">
                                      <Ban className="w-3 h-3" /> ND
                                    </div>
                                  ) : closed ? (
                                    <div className="opacity-0 group-hover:opacity-100 text-[9px] text-zinc-400 text-center w-full">
                                      Cerrado
                                    </div>
                                    ) : !past ? (
                                      <div className="flex flex-col items-center justify-center gap-1 w-full">
                                        <div className="opacity-0 group-hover:opacity-100 text-[10px] text-primary/70 font-medium text-center">
                                          Libre
                                        </div>
                                        {slotDiscount && (
                                          <div className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 animate-pulse">
                                            <BadgePercent className="w-2.5 h-2.5" />
                                            {slotDiscount.type === DiscountType.PERCENTAGE ? `-${slotDiscount.value}%` : `-${formatCurrency(slotDiscount.value)}`}
                                          </div>
                                        )}
                                      </div>
                                    ) : null}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Selected Slot Summary & Book Button Wrapper */}
              <div ref={bookingSectionRef} className="pt-4 mt-6 border-t border-border">
                {selectedSlot && (
                  <div className="p-4 bg-muted rounded-lg border border-primary/20 mb-4">
                  <p className="text-sm text-muted-foreground mb-1">
                    Resumen de reserva
                  </p>
                  <p className="font-medium text-lg flex items-center gap-2">
                    {formatDate(selectedSlot.date)} a las {selectedSlot.time}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xl font-bold text-primary">
                      {pricePreview ? (
                        <>
                          {pricePreview.discount && (
                            <span className="text-base line-through text-muted-foreground font-normal mr-2">
                              {formatCurrency(pricePreview.originalPrice)}
                            </span>
                          )}
                          <span className={cn(
                            "text-2xl font-bold",
                            pricePreview.discount ? "text-emerald-600 dark:text-emerald-400" : "text-primary"
                          )}>
                            {formatCurrency(pricePreview.totalPrice)}
                          </span>
                        </>
                      ) : (
                        formatCurrency(resource.pricePerHour)
                      )}
                    </p>
                    {requiresApproval && (
                      <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-200 bg-amber-50 dark:bg-amber-950/30">
                        <Info className="h-3 w-3 mr-1" />
                        Sujeta a aprobación
                      </Badge>
                    )}
                  </div>
                  
                  {pricePreview?.discount && (
                    <div className="flex items-center justify-between mt-1 text-emerald-600">
                      <p className="text-sm font-medium">Descuento aplicado: {pricePreview.discount.name}</p>
                      <p className="text-sm font-bold bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded text-emerald-700 dark:text-emerald-400">
                        -{pricePreview.discount.type === DiscountType.PERCENTAGE ? `${pricePreview.discount.value}%` : formatCurrency(pricePreview.discount.value)}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-border mt-3">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">¿Tienes un código de descuento?</label>
                    <div className="flex gap-2">
                       <Input 
                         value={discountCode}
                         onChange={(e) => {
                           setDiscountCode(e.target.value.toUpperCase());
                           if (discountError) setDiscountError("");
                         }}
                         placeholder="Ej. VERANO20"
                         className="h-9 uppercase font-mono"
                         disabled={booking || isCheckingDiscount}
                       />
                       <Button 
                         variant="secondary" 
                         size="sm" 
                         className="h-9"
                         onClick={() => calculatePrice(discountCode)}
                         disabled={!discountCode || booking || isCheckingDiscount || pricePreview?.discount?.code === discountCode}
                       >
                         {isCheckingDiscount ? "Validando..." : "Aplicar"}
                       </Button>
                    </div>
                    {discountError && <p className="text-xs text-red-500 mt-1">{discountError}</p>}
                  </div>
                </div>
              )}

              {/* Book Button */}
              {selectedSlot?.pendingId ? (
                <Button
                  className="w-full"
                  size="lg"
                  variant="destructive"
                  disabled={booking}
                  onClick={handleCancelBooking}
                >
                  {booking ? "Anulando..." : "Anular Reserva Pendiente"}
                </Button>
              ) : (
                <Button
                  className="w-full"
                  size="lg"
                  disabled={!selectedSlot || booking}
                  onClick={handleBooking}
                >
                  {booking
                    ? "Reservando..."
                    : requiresApproval
                      ? "Solicitar Reserva"
                      : "Confirmar Reserva"}
                </Button>
              )}
              </div>

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
