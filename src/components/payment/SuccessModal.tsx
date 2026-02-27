"use client";

import React from "react";
import { CheckCircle2, Clock, Calendar, MapPin, ChevronRight, X } from "lucide-react";
import { Booking } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, booking }) => {
  if (!isOpen) return null;

  const isPending = booking.status === "pending";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg bg-card border rounded-3xl overflow-hidden shadow-2xl"
        >
          {/* Header Color Strip */}
          <div className={`h-2 w-full ${isPending ? "bg-amber-500" : "bg-emerald-500"}`} />
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-8 pb-10 flex flex-col items-center text-center">
            {/* Animated Icon Container */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", damping: 12 }}
              className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
                isPending ? "bg-amber-100 dark:bg-amber-950/40" : "bg-emerald-100 dark:bg-emerald-950/40"
              }`}
            >
              {isPending ? (
                <Clock className="w-10 h-10 text-amber-600 dark:text-amber-400" />
              ) : (
                <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
              )}
            </motion.div>

            <h2 className="text-3xl font-black mb-2 tracking-tight">
              {isPending ? "Solicitud Enviada" : "¡Reserva Exitosa!"}
            </h2>
            
            <p className="text-muted-foreground mb-8 max-w-[320px]">
              {isPending 
                ? "Tu reserva está pendiente de aprobación por el recinto. Te notificaremos pronto." 
                : "Todo listo. Tu lugar ha sido reservado y el pago procesado con éxito."}
            </p>

            <div className="w-full bg-muted/30 rounded-2xl p-6 mb-8 text-left space-y-4 border">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-background rounded-lg border shadow-sm">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold">{booking.resource?.name}</h4>
                  <p className="text-xs text-muted-foreground">{booking.branch?.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{formatDate(booking.startAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {new Date(booking.startAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col w-full gap-3">
              <Button 
                onClick={() => window.location.href = "/bookings"}
                className="w-full py-6 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20"
              >
                Ver Mis Reservas
              </Button>
              <Button 
                variant="ghost" 
                onClick={onClose}
                className="w-full text-muted-foreground"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
