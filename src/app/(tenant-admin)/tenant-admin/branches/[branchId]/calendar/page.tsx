"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Input,
  Label,
} from "@/components/ui";
import {
  ChevronLeft,
  ChevronRight,
  Ban,
  Trash2,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  User,
  Mail,
} from "lucide-react";
import {
  cn,
  SHORT_DAY_NAMES,
  getWeekDays,
  generateTimeSlots,
  formatDate,
} from "@/lib/utils";
import { branchesApi, bookingsApi } from "@/lib/api";
import {
  Branch,
  Resource,
  Booking,
  BlockedSlot,
  BookingStatus,
  BranchHours,
} from "@/lib/types";
import { toast } from "@/lib/toast";
import { Textarea } from "@/components/ui/textarea";

interface CellCoord {
  dayIndex: number;
  timeIndex: number;
}

function getSelectionRange(
  start: CellCoord,
  end: CellCoord,
): { minDay: number; maxDay: number; minTime: number; maxTime: number } {
  return {
    minDay: Math.min(start.dayIndex, end.dayIndex),
    maxDay: Math.max(start.dayIndex, end.dayIndex),
    minTime: Math.min(start.timeIndex, end.timeIndex),
    maxTime: Math.max(start.timeIndex, end.timeIndex),
  };
}

function isCellInSelection(
  dayIndex: number,
  timeIndex: number,
  start: CellCoord | null,
  end: CellCoord | null,
): boolean {
  if (!start || !end) return false;
  const { minDay, maxDay, minTime, maxTime } = getSelectionRange(start, end);
  return (
    dayIndex >= minDay &&
    dayIndex <= maxDay &&
    timeIndex >= minTime &&
    timeIndex <= maxTime
  );
}

export default function TenantBranchCalendarPage() {
  const params = useParams();
  const branchId = parseInt(params.branchId as string);

  const [branch, setBranch] = useState<Branch | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedResource, setSelectedResource] = useState<string>("all");
  const [resources, setResources] = useState<Resource[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [branchHours, setBranchHours] = useState<BranchHours[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Drag selection state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<CellCoord | null>(null);
  const [dragEnd, setDragEnd] = useState<CellCoord | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Block dialog (multi-day)
  const [blockDialog, setBlockDialog] = useState<{
    open: boolean;
    dates: string[];
    startTime: string;
    endTime: string;
  }>({ open: false, dates: [], startTime: "", endTime: "" });
  const [blockReason, setBlockReason] = useState("");
  const [blockResourceId, setBlockResourceId] = useState<string>("all");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete blocked slot dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    slot: BlockedSlot | null;
  }>({ open: false, slot: null });

  // Booking detail dialog
  const [bookingDialog, setBookingDialog] = useState<{
    open: boolean;
    booking: Booking | null;
  }>({ open: false, booking: null });

  // Rejection dialog
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    booking: Booking | null;
  }>({ open: false, booking: null });
  const [rejectionReason, setRejectionReason] = useState("");

  const weekDays = getWeekDays(currentDate);

  // Compute dynamic time slots based on branch hours
  const timeSlots = (() => {
    if (branchHours.length === 0) return generateTimeSlots(7, 23, 60);
    const openDays = branchHours.filter((h) => !h.isClosed);
    if (openDays.length === 0) return generateTimeSlots(7, 23, 60);
    const earliestOpen = openDays.reduce(
      (min, h) => (h.openTime < min ? h.openTime : min),
      openDays[0].openTime,
    );
    const latestClose = openDays.reduce(
      (max, h) => (h.closeTime > max ? h.closeTime : max),
      openDays[0].closeTime,
    );
    return generateTimeSlots(earliestOpen, latestClose, 60);
  })();

  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];
  const weekStartStr = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
  const weekEndStr = `${weekEnd.getFullYear()}-${String(weekEnd.getMonth() + 1).padStart(2, '0')}-${String(weekEnd.getDate()).padStart(2, '0')}`;

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const loadData = useCallback(async () => {
    if (!branchId) return;
    setIsLoading(true);
    try {
      const [branchData, resourcesRes, bookingsRes, blockedRes, hoursRes] =
        await Promise.all([
          branchesApi.get(branchId),
          branchesApi.getResources(branchId),
          branchesApi.getBookings(branchId, {
            from: weekStartStr,
            to: weekEndStr,
          }),
          branchesApi.getBlockedSlots(branchId, {
            from: weekStartStr,
            to: weekEndStr,
          }),
          branchesApi.getHours(branchId),
        ]);

      setBranch(branchData as Branch);
      setResources(
        Array.isArray(resourcesRes)
          ? resourcesRes
          : (resourcesRes as unknown as { data: Resource[] }).data || [],
      );
      const bData = Array.isArray(bookingsRes)
        ? bookingsRes
        : (bookingsRes as unknown as { data: Booking[] }).data || [];
      setBookings(bData);
      const blData = Array.isArray(blockedRes)
        ? blockedRes
        : (blockedRes as unknown as { data: BlockedSlot[] }).data || [];
      setBlockedSlots(blData);
      const hData = Array.isArray(hoursRes)
        ? hoursRes
        : (hoursRes as unknown as { data: BranchHours[] }).data || [];
      setBranchHours(hData);
    } catch {
      toast.error("Error al cargar datos del calendario");
    } finally {
      setIsLoading(false);
    }
  }, [branchId, weekStartStr, weekEndStr]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Global mouseup listener to end drag even outside the grid
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging && dragStart && dragEnd) {
        finishDragSelection(dragStart, dragEnd);
      }
      if (isDragging && dragStart && !dragEnd) {
        finishDragSelection(dragStart, dragStart);
      }
      setIsDragging(false);
    };
    if (isDragging) {
      window.addEventListener("mouseup", handleGlobalMouseUp);
      return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging, dragStart, dragEnd]);

  // Prevent text selection during drag
  useEffect(() => {
    if (isDragging) {
      document.body.style.userSelect = "none";
      return () => {
        document.body.style.userSelect = "";
      };
    }
  }, [isDragging]);

  const goToPreviousWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const goToNextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  const goToToday = () => setCurrentDate(new Date());

  const isDayPast = (day: Date) => {
    const d = new Date(day);
    d.setHours(0, 0, 0, 0);
    return d < todayDate;
  };

  const isDayClosed = (day: Date) => {
    const dayOfWeek = day.getDay();
    const hours = branchHours.find((h) => h.dayOfWeek === dayOfWeek);
    return hours?.isClosed ?? false;
  };

  const isSlotOutsideHours = (day: Date, slotStart: string) => {
    const dayOfWeek = day.getDay();
    const hours = branchHours.find((h) => h.dayOfWeek === dayOfWeek);
    if (!hours || hours.isClosed) return true;
    return slotStart < hours.openTime || slotStart >= hours.closeTime;
  };

  const getBookingsForCell = (day: Date, slotStart: string) => {
    const [hours, minutes] = slotStart.split(":").map(Number);
    const cellStart = new Date(day);
    cellStart.setHours(hours, minutes, 0, 0);

    const cellEnd = new Date(cellStart);
    cellEnd.setMinutes(cellEnd.getMinutes() + 60);

    return bookings.filter(b => {
      if (selectedResource !== 'all' && b.resourceId !== parseInt(selectedResource)) return false;
      if (b.status === BookingStatus.CANCELLED || b.status === BookingStatus.REJECTED || b.status === BookingStatus.NO_SHOW) return false;
      
      const bStart = new Date(b.startAt);
      const bEnd = new Date(b.endAt);

      if (bStart >= cellEnd || bEnd <= cellStart) return false;
      
      return true;
    });
  };

  const getBlockedForCell = (day: Date, slotStart: string) => {
    const dateStr = day.toISOString().split("T")[0];
    return blockedSlots.filter((bs) => {
      if (bs.date !== dateStr) return false;
      if (slotStart < bs.startTime || slotStart >= bs.endTime) return false;
      if (
        selectedResource !== "all" &&
        bs.resourceId &&
        bs.resourceId !== parseInt(selectedResource)
      )
        return false;
      return true;
    });
  };

  const canStartDragOnCell = (dayIndex: number, timeIndex: number) => {
    const day = weekDays[dayIndex];
    if (isDayPast(day)) return false;
    if (isDayClosed(day)) return false;
    const slot = timeSlots[timeIndex];
    if (isSlotOutsideHours(day, slot.start)) return false;
    const cellBlocked = getBlockedForCell(day, slot.start);
    const cellBookings = getBookingsForCell(day, slot.start);
    return cellBlocked.length === 0 && cellBookings.length === 0;
  };

  const handleMouseDown = (dayIndex: number, timeIndex: number) => {
    const day = weekDays[dayIndex];
    if (isDayClosed(day)) return;
    if (isSlotOutsideHours(day, timeSlots[timeIndex].start)) return;
    // If clicking a booking cell, open booking dialog
    const cellBookings = getBookingsForCell(day, timeSlots[timeIndex].start);
    if (cellBookings.length > 0) {
      setBookingDialog({ open: true, booking: cellBookings[0] });
      return;
    }
    const cellBlocked = getBlockedForCell(day, timeSlots[timeIndex].start);
    if (cellBlocked.length > 0) {
      setDeleteDialog({ open: true, slot: cellBlocked[0] });
      return;
    }
    if (!canStartDragOnCell(dayIndex, timeIndex)) return;
    setIsDragging(true);
    setDragStart({ dayIndex, timeIndex });
    setDragEnd({ dayIndex, timeIndex });
  };

  const handleMouseEnter = (dayIndex: number, timeIndex: number) => {
    if (!isDragging || !dragStart) return;
    const day = weekDays[dayIndex];
    if (isDayPast(day)) return;
    if (isDayClosed(day)) return;
    setDragEnd({ dayIndex, timeIndex });
  };

  const finishDragSelection = (start: CellCoord, end: CellCoord) => {
    const { minDay, maxDay, minTime, maxTime } = getSelectionRange(start, end);

    const dates: string[] = [];
    for (let d = minDay; d <= maxDay; d++) {
      const day = weekDays[d];
      if (!isDayPast(day)) {
        dates.push(day.toISOString().split("T")[0]);
      }
    }

    if (dates.length === 0) {
      setDragStart(null);
      setDragEnd(null);
      return;
    }

    const startTime = timeSlots[minTime].start;
    const endTime = timeSlots[maxTime].end;

    setBlockDialog({ open: true, dates, startTime, endTime });
    setBlockResourceId(selectedResource);
    setBlockReason("");
    setDragStart(null);
    setDragEnd(null);
  };

  const handleCreateBlock = async () => {
    if (!branchId || blockDialog.dates.length === 0) return;
    setIsSubmitting(true);
    try {
      const resourceId =
        blockResourceId !== "all" ? parseInt(blockResourceId) : null;
      const count = blockDialog.dates.length;
      await toast.promise(
        Promise.all(
          blockDialog.dates.map((date) =>
            branchesApi.createBlockedSlot(branchId, {
              date,
              startTime: blockDialog.startTime,
              endTime: blockDialog.endTime,
              reason: blockReason || undefined,
              resourceId,
            }),
          ),
        ),
        {
          loading: "Bloqueando horario...",
          success:
            count === 1
              ? "Horario bloqueado exitosamente"
              : `${count} días bloqueados exitosamente`,
          error: "Error al bloquear horario",
        },
      );
      setBlockDialog({ open: false, dates: [], startTime: "", endTime: "" });
      loadData();
    } catch {
      // handled by toast.promise
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBlock = async () => {
    if (!branchId || !deleteDialog.slot) return;
    setIsSubmitting(true);
    try {
      await toast.promise(
        branchesApi.deleteBlockedSlot(
          branchId,
          deleteDialog.slot.blockedSlotId,
        ),
        {
          loading: "Eliminando bloqueo...",
          success: "Bloqueo eliminado",
          error: "Error al eliminar bloqueo",
        },
      );
      setDeleteDialog({ open: false, slot: null });
      loadData();
    } catch {
      // handled by toast.promise
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmBooking = async (booking: Booking) => {
    setIsSubmitting(true);
    try {
      await toast.promise(
        bookingsApi.confirm(booking.bookingId),
        {
          loading: "Confirmando reserva...",
          success: "Reserva confirmada",
          error: "Error al confirmar reserva"
        }
      );
      setBookingDialog({ open: false, booking: null });
      loadData();
    } catch {
      // handled by toast.promise
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectBooking = async () => {
    if (!rejectDialog.booking || !rejectionReason) return;
    
    setIsSubmitting(true);
    try {
      await toast.promise(
        bookingsApi.reject(rejectDialog.booking.bookingId, rejectionReason),
        {
          loading: "Rechazando reserva...",
          success: "Reserva rechazada",
          error: "Error al rechazar reserva"
        }
      );
      setRejectDialog({ open: false, booking: null });
      setRejectionReason(""); // Reset reason
      setBookingDialog({ open: false, booking: null }); // Also close details dialog
      loadData();
    } catch {
      // handled by toast.promise
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDatesRange = (dates: string[]) => {
    if (dates.length === 0) return "";
    if (dates.length === 1) {
      return formatDate(dates[0] + "T12:00:00", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
    }
    const first = formatDate(dates[0] + "T12:00:00", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    const last = formatDate(dates[dates.length - 1] + "T12:00:00", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    return `${first}  →  ${last} (${dates.length} días)`;
  };

  if (!branchId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No se encontró la sucursal</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Link href="/tenant-admin/branches">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver a sucursales
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">
            Calendario{branch ? ` — ${branch.name}` : ""}
          </h1>
          <p className="text-muted-foreground">
            Arrastra sobre las celdas vacías para bloquear horarios. Soporta
            selección de múltiples días.
          </p>
        </div>
        <Select value={selectedResource} onValueChange={setSelectedResource}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Filtrar cancha" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las canchas</SelectItem>
            {resources.map((r) => (
              <SelectItem key={r.resourceId} value={r.resourceId.toString()}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {/* Navigation */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={goToNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" onClick={goToToday}>
                Hoy
              </Button>
            </div>
            <h2 className="text-lg font-semibold">
              {formatDate(weekDays[0], { month: "long", year: "numeric" })}
            </h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="grid grid-cols-8 border-b sticky top-0 bg-card z-10">
                <div className="p-2 text-center text-sm font-medium text-muted-foreground border-r">
                  Hora
                </div>
                {weekDays.map((day, i) => {
                  const isToday =
                    day.toDateString() === new Date().toDateString();
                  const closed = isDayClosed(day);
                  return (
                    <div
                      key={i}
                      className={cn(
                        "p-2 text-center border-r last:border-r-0",
                        isToday && "bg-primary/5",
                        closed && "bg-zinc-200 dark:bg-zinc-800",
                      )}
                    >
                      <div
                        className={cn(
                          "text-xs font-medium",
                          closed
                            ? "text-zinc-500 dark:text-zinc-400"
                            : "text-muted-foreground",
                        )}
                      >
                        {SHORT_DAY_NAMES[day.getDay()]}
                      </div>
                      <div
                        className={cn(
                          "text-lg font-bold",
                          isToday && !closed && "text-primary",
                          closed &&
                            "text-zinc-400 dark:text-zinc-500 line-through",
                        )}
                      >
                        {day.getDate()}/{day.getMonth() + 1}
                      </div>
                      {closed && (
                        <div className="text-[10px] text-red-600 dark:text-red-400 font-semibold flex items-center justify-center gap-1 mt-0.5">
                          <Ban className="h-3 w-3" />
                          Cerrado
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Grid */}
              <div className="max-h-150 overflow-y-auto" ref={gridRef}>
                {timeSlots.map((slot, ti) => (
                  <div
                    key={ti}
                    className="grid grid-cols-8 border-b last:border-b-0"
                  >
                    <div className="p-2 text-center text-sm text-muted-foreground border-r bg-muted/30 flex items-center justify-center">
                      {slot.start}
                    </div>
                    {weekDays.map((day, di) => {
                      const isToday =
                        day.toDateString() === new Date().toDateString();
                      const closed = isDayClosed(day);
                      const outsideHours = isSlotOutsideHours(day, slot.start);
                      const cellBookings = getBookingsForCell(day, slot.start);
                      const cellBlocked = getBlockedForCell(day, slot.start);
                      const hasBookings = cellBookings.length > 0;
                      const isBlocked = cellBlocked.length > 0;
                      const isPast = isDayPast(day);
                      const isSelected =
                        isDragging &&
                        isCellInSelection(di, ti, dragStart, dragEnd) &&
                        !isPast &&
                        !closed &&
                        !outsideHours;

                      return (
                        <div
                          key={di}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleMouseDown(di, ti);
                          }}
                          onMouseEnter={() => handleMouseEnter(di, ti)}
                          className={cn(
                            "p-1 min-h-14 border-r last:border-r-0 transition-colors relative select-none",
                            isToday &&
                              !closed &&
                              !outsideHours &&
                              "bg-primary/5",
                            isPast && !closed && "opacity-50",
                            closed && "bg-zinc-100 dark:bg-zinc-900/60",
                            !closed && outsideHours && "bg-muted/20",
                            !isPast &&
                              !hasBookings &&
                              !isBlocked &&
                              !isSelected &&
                              !closed &&
                              !outsideHours &&
                              "hover:bg-muted/50 cursor-pointer",
                            isBlocked &&
                              !closed &&
                              "bg-red-500/10 cursor-pointer",
                            isSelected &&
                              "bg-red-500/20 ring-1 ring-inset ring-red-500/40",
                          )}
                        >
                          {closed && (
                            <div
                              className="absolute inset-0 pointer-events-none"
                              style={{
                                backgroundImage:
                                  "repeating-linear-gradient(135deg, transparent, transparent 5px, rgba(161,161,170,0.15) 5px, rgba(161,161,170,0.15) 6px)",
                              }}
                            >
                              {ti === Math.floor(timeSlots.length / 2) && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                                    Cerrado
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                          {!closed && outsideHours && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="w-full h-px bg-muted-foreground/10" />
                            </div>
                          )}
                          {!closed &&
                            !outsideHours &&
                            cellBookings.map((b) => (
                              <div
                                key={b.bookingId}
                                className={cn(
                                  "text-[10px] leading-tight px-1.5 py-1 rounded mb-0.5 truncate font-medium cursor-pointer hover:opacity-80",
                                  b.status === BookingStatus.CONFIRMED
                                    ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                                    : "bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30",
                                )}
                                title={`${b.resource?.name || "Cancha"} - ${b.user?.firstName || b.guest?.firstName || ""} (${b.status})`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // If multiple bookings in cell (overlapping pending), show list or pick first?
                                    // For now just pick this one
                                    setBookingDialog({ open: true, booking: b });
                                  }}
                                >
                                  <div className="font-semibold truncate">
                                    {b.resource?.name || "Cancha"}
                                  </div>
                                  <div className="truncate opacity-80">
                                    {b.user?.firstName || b.guest?.firstName || "Usuario"}
                                  </div>
                                  {/* Show if verified pending overlap count? UI might be too small */}
                                </div>
                            ))}
                          {!closed && !outsideHours && isBlocked && (
                            <div
                              className="text-[10px] leading-tight px-1.5 py-1 rounded bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/30 font-medium pointer-events-none"
                              title={cellBlocked[0].reason || "Bloqueado"}
                            >
                              <div className="flex items-center gap-1">
                                <Ban className="h-3 w-3 shrink-0" />
                                <span className="truncate">
                                  {cellBlocked[0].reason || "Bloqueado"}
                                </span>
                              </div>
                              {cellBlocked[0].resource && (
                                <div className="truncate opacity-80">
                                  {cellBlocked[0].resource.name}
                                </div>
                              )}
                            </div>
                          )}
                          {isSelected && !isBlocked && !hasBookings && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <Ban className="h-4 w-4 text-red-500/60" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-500/20 border border-emerald-500/30" />
              <span>Confirmada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-500/20 border border-amber-500/30" />
              <span>Pendiente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500/30" />
              <span>Bloqueado</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(135deg, transparent, transparent 2px, rgba(161,161,170,0.3) 2px, rgba(161,161,170,0.3) 3px)",
                }}
              />
              <span>Cerrado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-muted/20 border border-muted" />
              <span>Fuera de horario</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500/20 ring-1 ring-red-500/40" />
              <span>Arrastra para seleccionar</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Block Dialog (multi-day) */}
      <Dialog
        open={blockDialog.open}
        onOpenChange={(open) =>
          !open &&
          setBlockDialog({ open: false, dates: [], startTime: "", endTime: "" })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-red-500" />
              Bloquear Horario
            </DialogTitle>
            <DialogDescription>
              {blockDialog.dates.length > 1
                ? "Se crearán bloqueos para cada día seleccionado con el mismo horario."
                : "Bloquear este horario impedirá que se realicen reservas."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">
                  {blockDialog.dates.length > 1 ? "Rango de fechas" : "Fecha"}
                </Label>
                <p className="font-medium text-sm mt-1">
                  {formatDatesRange(blockDialog.dates)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Inicio
                  </Label>
                  <Input
                    type="time"
                    value={blockDialog.startTime}
                    onChange={(e) =>
                      setBlockDialog((p) => ({
                        ...p,
                        startTime: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Fin</Label>
                  <Input
                    type="time"
                    value={blockDialog.endTime}
                    onChange={(e) =>
                      setBlockDialog((p) => ({
                        ...p,
                        endTime: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cancha (opcional)</Label>
              <Select
                value={blockResourceId}
                onValueChange={setBlockResourceId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas las canchas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    Todas las canchas de esta sucursal
                  </SelectItem>
                  {resources.map((r) => (
                    <SelectItem
                      key={r.resourceId}
                      value={r.resourceId.toString()}
                    >
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Si no seleccionas una cancha, se bloqueará toda la sucursal en
                ese horario.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Motivo (opcional)</Label>
              <Input
                placeholder="Ej: Mantenimiento, Evento privado..."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setBlockDialog({
                  open: false,
                  dates: [],
                  startTime: "",
                  endTime: "",
                })
              }
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleCreateBlock}
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {blockDialog.dates.length > 1
                ? `Bloquear ${blockDialog.dates.length} días`
                : "Bloquear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Block Dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          !open && setDeleteDialog({ open: false, slot: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Bloqueo</DialogTitle>
            <DialogDescription>
              ¿Deseas eliminar este bloqueo? El horario volverá a estar
              disponible para reservas.
            </DialogDescription>
          </DialogHeader>
          {deleteDialog.slot && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-1 text-sm">
              <p>
                <span className="font-medium">Fecha:</span>{" "}
                {formatDate(deleteDialog.slot.date + "T12:00:00", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
              <p>
                <span className="font-medium">Horario:</span>{" "}
                {deleteDialog.slot.startTime} - {deleteDialog.slot.endTime}
              </p>
              {deleteDialog.slot.reason && (
                <p>
                  <span className="font-medium">Motivo:</span>{" "}
                  {deleteDialog.slot.reason}
                </p>
              )}
              {deleteDialog.slot.resource && (
                <p>
                  <span className="font-medium">Cancha:</span>{" "}
                  {deleteDialog.slot.resource.name}
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, slot: null })}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteBlock}
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              <Trash2 className="h-4 w-4 mr-1" />
              Eliminar Bloqueo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Booking Detail Dialog */}
      <Dialog
        open={bookingDialog.open}
        onOpenChange={(open) =>
          !open && setBookingDialog({ open: false, booking: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle de Reserva</DialogTitle>
            <DialogDescription>
              Información de la reserva y acciones disponibles.
            </DialogDescription>
          </DialogHeader>
          {bookingDialog.booking &&
            (() => {
              const b = bookingDialog.booking;
              const startDate = new Date(b.startAt);
              const endDate = new Date(b.endAt);
              const clientName = b.user
                ? `${b.user.firstName || ""} ${b.user.lastName || ""}`.trim()
                : b.guest
                  ? `${b.guest.firstName || ""} ${b.guest.lastName || ""}`.trim()
                  : "Sin nombre";
              const clientEmail = b.user?.email || b.guest?.email || "";

              return (
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Cancha:</span>{" "}
                      {b.resource?.name || "—"}
                    </p>
                    <p>
                      <span className="font-medium">Fecha:</span>{" "}
                      {formatDate(b.startAt, {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </p>
                    <p>
                      <span className="font-medium">Horario:</span>{" "}
                      {startDate.toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      -{" "}
                      {endDate.toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{clientName || "—"}</span>
                    </div>
                    {clientEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{clientEmail}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-1">
                      <span className="font-medium">Estado:</span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          b.status === BookingStatus.CONFIRMED
                            ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                            : b.status === BookingStatus.PENDING
                              ? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                              : "bg-red-500/20 text-red-700 dark:text-red-400",
                        )}
                      >
                        {b.status === BookingStatus.CONFIRMED
                          ? "Confirmada"
                          : b.status === BookingStatus.PENDING
                            ? "Pendiente"
                            : b.status === BookingStatus.CANCELLED
                              ? "Cancelada"
                              : b.status}
                      </span>
                    </div>
                    {b.notes && (
                      <p>
                        <span className="font-medium">Notas:</span> {b.notes}
                      </p>
                    )}
                  </div>

                  {b.status === BookingStatus.PENDING && (
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={async () => {
                          try {
                            await toast.promise(
                              bookingsApi.confirm(b.bookingId),
                              {
                                loading: "Confirmando reserva...",
                                success: "Reserva confirmada",
                                error: "Error al confirmar",
                              },
                            );
                            setBookingDialog({ open: false, booking: null });
                            loadData();
                          } catch {
                            // handled by toast.promise
                          }
                        }}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Confirmar
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={async () => {
                          try {
                            await toast.promise(
                              bookingsApi.cancel(b.bookingId),
                              {
                                loading: "Cancelando reserva...",
                                success: "Reserva cancelada",
                                error: "Error al cancelar",
                              },
                            );
                            setBookingDialog({ open: false, booking: null });
                            loadData();
                          } catch {
                            // handled by toast.promise
                          }
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Rechazar
                      </Button>
                    </div>
                  )}

                  {b.status === BookingStatus.CONFIRMED && (
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={async () => {
                        try {
                          await toast.promise(bookingsApi.cancel(b.bookingId), {
                            loading: "Cancelando reserva...",
                            success: "Reserva cancelada",
                            error: "Error al cancelar",
                          });
                          setBookingDialog({ open: false, booking: null });
                          loadData();
                        } catch {
                          // handled by toast.promise
                        }
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Cancelar Reserva
                    </Button>
                  )}
                </div>
              );
            })()}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBookingDialog({ open: false, booking: null })}
            >
              Cerrar
            </Button>
            {bookingDialog.booking?.status === BookingStatus.PENDING && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setRejectDialog({
                      open: true,
                      booking: bookingDialog.booking,
                    });
                    setBookingDialog({ open: false, booking: null });
                  }}
                >
                  Rechazar
                </Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() =>
                    bookingDialog.booking &&
                    handleConfirmBooking(bookingDialog.booking)
                  }
                  disabled={isSubmitting}
                >
                  Confirmar
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialog.open}
        onOpenChange={(open) =>
          !open && setRejectDialog({ open: false, booking: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Reserva</DialogTitle>
            <DialogDescription>
              Indica el motivo del rechazo. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Textarea
                placeholder="Ej: Mantenimiento imprevisto, horario no disponible..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialog({ open: false, booking: null })}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectBooking}
              disabled={!rejectionReason || isSubmitting}
            >
              Rechazar Reserva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
