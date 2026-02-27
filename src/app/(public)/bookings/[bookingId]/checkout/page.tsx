"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  CreditCard, 
  Calendar, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  ChevronRight,
  ArrowLeft,
  CreditCard as CreditCardIcon,
  Trash2,
  CheckCircle2
} from "lucide-react";
import { bookingsApi, cardsApi } from "@/lib/api/endpoints";
import { Booking, UserCard, CardFormInput, BookingStatus } from "@/lib/types";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { CardForm } from "@/components/payment/CardForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = parseInt(params.bookingId as string);

  const [booking, setBooking] = useState<Booking | null>(null);
  const [cards, setCards] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [showCardForm, setShowCardForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [bookingId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingData, cardsData] = await Promise.all([
        bookingsApi.get(bookingId),
        cardsApi.list(),
      ]);
      setBooking(bookingData);
      setCards(cardsData);
      
      const defaultCard = cardsData.find(c => c.isDefault) || cardsData[0];
      if (defaultCard) setSelectedCardId(defaultCard.userCardId);
      
      if (cardsData.length === 0) setShowCardForm(true);
    } catch (error) {
      toast.error("Error al cargar la información de pago");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = async (data: CardFormInput) => {
    try {
      setIsProcessing(true);
      const newCard = await cardsApi.add(data);
      setCards([newCard, ...cards]);
      setSelectedCardId(newCard.userCardId);
      setShowCardForm(false);
      toast.success("Tarjeta guardada");
    } catch (error) {
      toast.error("Error al guardar la tarjeta");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedCardId) {
      toast.error("Selecciona una tarjeta");
      return;
    }

    try {
      setIsProcessing(true);
      await toast.promise(
        bookingsApi.pay(bookingId, { cardId: selectedCardId }),
        {
          loading: "Procesando pago...",
          success: "Pago procesado con éxito",
          error: "Error al procesar el pago",
        }
      );
      router.push("/bookings");
    } catch (error) {
      // Handled by toast.promise
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!booking) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver</span>
      </button>

      <h1 className="text-3xl font-extrabold mb-8 tracking-tight">Confirmar y Pagar</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Reservation Summary */}
        <div className="space-y-6">
          <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-primary/5 p-6 border-b">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                Resumen de tu Reserva
              </h2>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-secondary rounded-xl">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{booking.resource?.name}</h3>
                  <p className="text-muted-foreground text-sm">{booking.branch?.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Fecha</p>
                    <p className="text-sm font-semibold">{formatDate(booking.startAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Horario</p>
                    <p className="text-sm font-semibold">
                      {new Date(booking.startAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(booking.originalPrice || booking.totalPrice)}</span>
                </div>
                {booking.originalPrice && booking.originalPrice > booking.totalPrice && (
                  <div className="flex justify-between text-sm text-emerald-600 font-medium">
                    <span>Descuento aplicado</span>
                    <span>-{formatCurrency(booking.originalPrice - booking.totalPrice)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-black pt-2">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(booking.totalPrice)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900 flex gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 mt-1 shrink-0" />
            <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
              Pago 100% seguro. Tus datos están protegidos bajo los más altos estándares de seguridad.
            </p>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Método de Pago</h2>
              {cards.length > 0 && (
                <button 
                  onClick={() => setShowCardForm(!showCardForm)}
                  className="text-primary text-sm font-bold hover:underline"
                >
                  {showCardForm ? "Ver mis tarjetas" : "Nueva tarjeta"}
                </button>
              )}
            </div>

            {showCardForm ? (
              <div className="bg-card border rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
                <CardForm onSubmit={handleAddCard} isLoading={isProcessing} />
              </div>
            ) : (
              <div className="space-y-3">
                {cards.map((card) => (
                  <div
                    key={card.userCardId}
                    className={cn(
                      "p-4 border-2 rounded-2xl cursor-pointer transition-all flex items-center justify-between",
                      selectedCardId === card.userCardId 
                        ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20" 
                        : "border-transparent bg-muted/30 hover:bg-muted/50"
                    )}
                    onClick={() => setSelectedCardId(card.userCardId)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-background rounded-xl flex items-center justify-center border shadow-inner">
                        <CreditCardIcon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold">{card.brand} •••• {card.last4}</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">{card.cardHolderName}</p>
                      </div>
                    </div>
                    {selectedCardId === card.userCardId && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}

                <Button
                  onClick={handlePayment}
                  disabled={isProcessing || !selectedCardId}
                  className="w-full py-7 rounded-2xl text-lg font-black mt-4 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isProcessing ? (
                    <div className="w-6 h-6 border-3 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    `Pagar ${formatCurrency(booking.totalPrice)}`
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
