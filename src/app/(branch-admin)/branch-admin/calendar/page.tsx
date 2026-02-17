"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  cn,
  SHORT_DAY_NAMES,
  getWeekDays,
  generateTimeSlots,
  formatDate,
} from "@/lib/utils";

export default function BranchCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const weekDays = getWeekDays(currentDate);
  const timeSlots = generateTimeSlots(7, 23, 60);

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendario</h1>
          <p className="text-muted-foreground">Vista semanal de reservas</p>
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Selecciona cancha" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las canchas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Calendar Navigation */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
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
        </CardHeader>
        <CardContent className="p-0">
          {/* Calendar Header */}
          <div className="grid grid-cols-8 border-b">
            <div className="p-2 text-center text-sm font-medium text-muted-foreground border-r">
              Hora
            </div>
            {weekDays.map((day, index) => {
              const isToday = day.toDateString() === new Date().toDateString();
              return (
                <div
                  key={index}
                  className={cn(
                    "p-2 text-center border-r last:border-r-0",
                    isToday && "bg-primary/5",
                  )}
                >
                  <div className="text-sm font-medium">
                    {SHORT_DAY_NAMES[day.getDay()]}
                  </div>
                  <div
                    className={cn(
                      "text-2xl font-bold",
                      isToday && "text-primary",
                    )}
                  >
                    {day.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Calendar Grid */}
          <div className="max-h-[600px] overflow-y-auto">
            {timeSlots.map((slot, timeIndex) => (
              <div
                key={timeIndex}
                className="grid grid-cols-8 border-b last:border-b-0"
              >
                <div className="p-2 text-center text-sm text-muted-foreground border-r bg-muted/30">
                  {slot.start}
                </div>
                {weekDays.map((day, dayIndex) => {
                  const isToday =
                    day.toDateString() === new Date().toDateString();
                  return (
                    <div
                      key={dayIndex}
                      className={cn(
                        "p-1 min-h-[48px] border-r last:border-r-0 hover:bg-muted/50 cursor-pointer transition-colors",
                        isToday && "bg-primary/5",
                      )}
                    >
                      {/* Booking slots would go here */}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-success/20 border border-success" />
              <span>Confirmada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-warning/20 border border-warning" />
              <span>Pendiente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-muted border" />
              <span>Disponible</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
