"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { authApi } from "@/lib/api";
import { toast } from "@/lib/toast";
import { Input, Button, Label } from "@/components/ui";

const forgotPasswordSchema = z.object({
  email: z.string().email("Ingresa un correo válido"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      await authApi.forgotPassword(data.email);
      setIsSuccess(true);
    } catch (error: any) {
      toast.error(error.message || "Error al solicitar la recuperación");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center">
        <div className="mb-6 mx-auto w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center">
          <span className="text-2xl">✉️</span>
        </div>
        <h1 className="text-2xl font-bold mb-2">Revisa tu correo</h1>
        <p className="text-muted-foreground mb-6">
          Si el correo está registrado, te hemos enviado un enlace para que puedas
          restablecer tu contraseña.
        </p>
        <Button asChild className="w-full">
          <Link href="/login">Volver a iniciar sesión</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Recuperar contraseña</h1>
        <p className="text-muted-foreground mt-2">
          Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            {...register("email")}
            error={errors.email?.message}
          />
        </div>

        <Button type="submit" className="w-full" isLoading={isLoading}>
          Enviar enlace de recuperación
        </Button>
      </form>

      <div className="mt-6 text-center text-sm">
        <Link href="/login" className="text-primary hover:underline">
          Volver a iniciar sesión
        </Link>
      </div>
    </>
  );
}
