"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { surveysApi } from "@/lib/api/endpoints";
import { toast } from "@/lib/toast";
import { Star, CheckCircle2 } from "lucide-react";

export default function SurveyPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = parseInt(params.bookingId as string, 10);

  const [ratings, setRatings] = useState({
    resourceCondition: 0,
    amenitiesRating: 0,
    attentionRating: 0,
    punctualityRating: 0,
  });
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Helper for rendering star rating rows
  const RatingRow = ({ label, field }: { label: string, field: keyof typeof ratings }) => {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 border-b last:border-0 border-border/50">
        <span className="font-medium text-sm text-foreground/90">{label}</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRatings(prev => ({ ...prev, [field]: star }))}
              className="p-1 transition-transform hover:scale-110 focus:outline-none"
            >
              <Star 
                className={`w-6 h-6 sm:w-8 sm:h-8 ${
                  star <= ratings[field] 
                    ? "fill-amber-400 text-amber-400" 
                    : "fill-muted text-muted-foreground/30 hover:text-amber-200"
                } transition-colors`}
              />
            </button>
          ))}
        </div>
      </div>
    );
  };

  const handleSubmit = async () => {
    // Validate
    if (Object.values(ratings).some(r => r === 0)) {
      toast.error("Por favor, califica todos los aspectos antes de enviar.");
      return;
    }

    setIsSubmitting(true);
    try {
      await surveysApi.submit({
        bookingId,
        ...ratings,
        comments,
      });
      setIsSuccess(true);
    } catch (error: any) {
      toast.error(error.message || "Error al enviar la encuesta. Puede que ya la hayas contestado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isNaN(bookingId)) {
    return (
      <div className="container max-w-lg mx-auto py-12 px-4 text-center">
        <h1 className="text-2xl font-bold mb-2">Enlace inválido</h1>
        <p className="text-muted-foreground mb-6">El enlace de la encuesta no es correcto.</p>
        <Button onClick={() => router.push("/")}>Volver al Inicio</Button>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4 bg-muted/20">
        <Card className="max-w-md w-full shadow-lg border-primary/20">
          <CardContent className="pt-10 pb-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold mb-2">¡Gracias por tu opinión!</h2>
            <p className="text-muted-foreground mb-8">
              Tus comentarios nos ayudan a mejorar la experiencia para todos nuestros usuarios.
            </p>
            <Button onClick={() => router.push("/")} className="w-full">
              Ir a la página principal
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">¿Cómo estuvo tu visita?</h1>
          <p className="text-muted-foreground">Tu retroalimentación nos ayuda a ofrecer un mejor servicio.</p>
        </div>

        <Card className="shadow-md">
          <CardHeader className="bg-primary/5 border-b">
            <CardTitle>Evalúa tu experiencia</CardTitle>
            <CardDescription>
              Califica del 1 (Malo) al 5 (Excelente) los siguientes aspectos.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-2">
            
            <RatingRow label="Estado de la Cancha" field="resourceCondition" />
            <RatingRow label="Limpieza y Amenidades (Baños, etc.)" field="amenitiesRating" />
            <RatingRow label="Atención del Personal" field="attentionRating" />
            <RatingRow label="Puntualidad en la entrega" field="punctualityRating" />

            <div className="pt-6">
              <label className="block text-sm font-medium mb-2 text-foreground/90">
                Comentarios Adicionales (Opcional)
              </label>
              <Textarea 
                placeholder="¿Qué te pareció el lugar? ¿Hay algo que podamos mejorar?"
                className="min-h-[120px] resize-y"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </div>

          </CardContent>
          <CardFooter className="bg-muted/10 border-t pt-6 pb-6 px-6">
            <Button 
              className="w-full sm:w-auto ml-auto" 
              size="lg" 
              onClick={handleSubmit} 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Enviando..." : "Enviar Evaluación"}
            </Button>
          </CardFooter>
        </Card>

      </div>
    </div>
  );
}
