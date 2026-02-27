"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { 
  CreditCard, 
  Calendar, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  ArrowLeft,
  CreditCard as CreditCardIcon,
  CheckCircle2,
  Info
} from "lucide-react";
import { bookingsApi, cardsApi, publicApi } from "@/lib/api/endpoints";
import { Booking, UserCard, CardFormInput, Resource, Discount } from "@/lib/types";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { CardForm } from "@/components/payment/CardForm";
import { SuccessModal } from "@/components/payment/SuccessModal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";

function CheckoutContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const resourceId = parseInt(searchParams.get("resourceId") || "0");
  const startAt = searchParams.get("startAt");
  const endAt = searchParams.get("endAt");
  const discountCode = searchParams.get("discountCode");

  const [resource, setResource] = useState<Resource | null>(null);
  const [cards, setCards] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [showCardForm, setShowCardForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pricePreview, setPricePreview] = useState<{ originalPrice: number; totalPrice: number; discount: Discount | null } | null>(null);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      toast.error("Debes iniciar sesión");
      router.push("/login");
      return;
    }
    fetchData();
  }, [resourceId, user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (!resourceId || !startAt || !endAt) {
        toast.error("Faltan datos de la reserva");
        router.back();
        return;
      }

      const [resourceData, cardsData] = await Promise.all([
        publicApi.getResource(resourceId),
        cardsApi.list(),
      ]);
      
      setResource(resourceData);
      setCards(cardsData);
      
      const defaultCard = cardsData.find(c => c.isDefault) || cardsData[0];
      if (defaultCard) setSelectedCardId(defaultCard.userCardId);
      if (cardsData.length === 0) setShowCardForm(true);

      // Get price preview
      if (resourceData.branch?.tenantId) {
        const preview = await publicApi.calculateDiscount({
          resourceId,
          tenantId: resourceData.branch.tenantId,
          branchId: resourceData.branchId,
          startAt,
          endAt,
          code: discountCode || undefined
        });
        setPricePreview(preview as any);
      }
    } catch (error) {
      toast.error("Error al cargar la información");
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
      
      // 1. Create the booking (this also processes payment logic in user's request)
      const bookingResult = await bookingsApi.createAsUser({
        resourceId,
        startAt: startAt!,
        endAt: endAt!,
        discountCode: discountCode || undefined,
      });

      const bookingData = (bookingResult as any).data || bookingResult;
      
      // Add more details for the modal
      const fullBooking = {
        ...bookingData,
        resource,
        branch: resource?.branch
      };
      
      setCreatedBooking(fullBooking);
      setIsSuccessModalOpen(true);
      
      toast.success("¡Reserva realizada con éxito!");
    } catch (error: any) {
      toast.error(error.message || "Error al realizar la reserva");
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

  if (!resource || !pricePreview) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver</span>
      </button>

      <h1 className="text-3xl font-extrabold mb-8 tracking-tight uppercase">Confirmar y Pagar</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Reservation Summary */}
        <div className="space-y-6">
          <div className="bg-card border rounded-3xl overflow-hidden shadow-sm">
            <div className="bg-primary/5 p-6 border-b">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                Resumen de la Reserva
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-secondary rounded-2xl">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{resource.name}</h3>
                  <p className="text-muted-foreground text-sm">{resource.branch?.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 bg-muted/30 p-4 rounded-2xl border">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-primary/60" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Fecha</p>
                    <p className="text-sm font-bold">{formatDate(startAt!)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary/60" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Horario</p>
                    <p className="text-sm font-bold">
                      {new Date(startAt!).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tarifa base</span>
                  <span className="font-medium">{formatCurrency(pricePreview.originalPrice)}</span>
                </div>
                {pricePreview.discount && (
                  <div className="flex justify-between text-sm text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/20 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
                    <span>Descuento ({pricePreview.discount.name})</span>
                    <span>-{formatCurrency(pricePreview.originalPrice - pricePreview.totalPrice)}</span>
                  </div>
                )}
                <div className="flex justify-between text-2xl font-black pt-4">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(pricePreview.totalPrice)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-primary/5 p-5 rounded-3xl border flex gap-4">
            <ShieldCheck className="w-6 h-6 text-primary mt-1 shrink-0" />
            <div>
              <p className="text-sm font-bold mb-1">Pago Protegido</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tus datos están encriptados y protegidos bajo estándares bancarios internacionales.
              </p>
            </div>
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
                  {showCardForm ? "Ver favoritas" : "+ Nueva tarjeta"}
                </button>
              )}
            </div>

            {showCardForm ? (
              <div className="bg-card border rounded-3xl p-8 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
                <CardForm onSubmit={handleAddCard} isLoading={isProcessing} />
              </div>
            ) : (
              <div className="space-y-3">
                {cards.map((card) => (
                  <div
                    key={card.userCardId}
                    className={cn(
                      "p-5 border-2 rounded-3xl cursor-pointer transition-all flex items-center justify-between group",
                      selectedCardId === card.userCardId 
                        ? "border-primary bg-primary/5 shadow-md ring-4 ring-primary/5" 
                        : "border-transparent bg-muted/40 hover:bg-muted/60"
                    )}
                    onClick={() => setSelectedCardId(card.userCardId)}
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-background rounded-2xl flex items-center justify-center border shadow-sm group-hover:scale-110 transition-transform">
                        <CreditCardIcon className="w-7 h-7 text-primary" />
                      </div>
                      <div>
                        <p className="font-extrabold text-lg">{card.brand} •••• {card.last4}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{card.cardHolderName}</p>
                      </div>
                    </div>
                    {selectedCardId === card.userCardId && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
                        <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}

                <Button
                  onClick={handlePayment}
                  disabled={isProcessing || !selectedCardId}
                  className="w-full py-8 rounded-3xl text-xl font-black mt-6 shadow-2xl shadow-primary/30 transition-all hover:scale-[1.03] active:scale-[0.97] h-auto"
                >
                  {isProcessing ? (
                    <div className="w-7 h-7 border-4 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    `Confirmar Pago de ${formatCurrency(pricePreview.totalPrice)}`
                  )}
                </Button>
                
                {resource.branch?.requiresApproval && (
                   <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground mt-4">
                      <Info className="w-4 h-4" />
                      <span>Requiere aprobación del recinto</span>
                   </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {createdBooking && (
        <SuccessModal 
          isOpen={isSuccessModalOpen} 
          onClose={() => setIsSuccessModalOpen(false)} 
          booking={createdBooking} 
        />
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">Cargando checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
