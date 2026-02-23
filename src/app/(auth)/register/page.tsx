"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarDays, Eye, EyeOff, Mail, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts";
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui";

const registerSchema = z
  .object({
    firstName: z.string().min(2, "Mínimo 2 caracteres"),
    lastName: z.string().min(2, "Mínimo 2 caracteres"),
    email: z.string().email("Email inválido"),
    phone: z.string().optional(),
    password: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
      .regex(/[a-z]/, "Debe contener al menos una minúscula")
      .regex(/[0-9]/, "Debe contener al menos un número"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    const success = await registerUser({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
    });
    setIsLoading(false);

    if (success) {
      setRegisteredEmail(data.email);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (registeredEmail) {
    return (
      <Card className="border-0 shadow-xl">
        {/* Gradient header */}
        <div
          style={{
            background: "linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)",
            borderRadius: "calc(var(--radius) + 4px) calc(var(--radius) + 4px) 0 0",
          }}
          className="px-8 py-8 text-center"
        >
          <Link href="/" className="inline-flex items-center gap-2 justify-center">
            <CalendarDays className="h-8 w-8 text-white" />
            <span style={{ color: "#fff", fontSize: 22, fontWeight: 700 }}>
              Easy Sport Book
            </span>
          </Link>
        </div>

        <CardContent className="pt-8 pb-6 text-center">
          {/* Animated icon */}
          <div
            style={{
              background: "linear-gradient(135deg,#14b8a6,#06b6d4)",
              borderRadius: "50%",
              width: 72,
              height: 72,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <Mail className="h-8 w-8 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-2">
            ¡Revisa tu email! 📬
          </h2>
          <p className="text-muted-foreground text-sm mb-5 leading-relaxed">
            Enviamos un link de verificación a:
          </p>

          {/* Email badge */}
          <div
            style={{
              background: "#f0fdf9",
              border: "1px solid #99f6e4",
              borderRadius: 8,
              padding: "10px 20px",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 20,
            }}
          >
            <CheckCircle className="h-4 w-4" style={{ color: "#14b8a6" }} />
            <span
              style={{ color: "#0f766e", fontWeight: 600, fontSize: 14 }}
            >
              {registeredEmail}
            </span>
          </div>

          <p className="text-muted-foreground text-xs leading-relaxed mb-6">
            Haz clic en el link del email para activar tu cuenta.
            <br />
            El link expira en <strong>24 horas</strong>. Revisa también tu
            carpeta de spam.
          </p>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/login")}
          >
            Ir al inicio de sesión
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Register form ────────────────────────────────────────────────────────────
  return (
    <Card className="border-0 shadow-xl">
      <CardHeader className="text-center">
        <Link href="/" className="flex items-center justify-center gap-2 mb-4">
          <CalendarDays className="h-10 w-10 text-primary" />
          <span className="text-2xl font-bold gradient-text">Easy Sport Book</span>
        </Link>
        <CardTitle className="text-2xl">Crear cuenta</CardTitle>
        <CardDescription>
          Completa el formulario para registrarte
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nombre</Label>
              <Input
                id="firstName"
                placeholder="Juan"
                {...register("firstName")}
                error={errors.firstName?.message}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Apellido</Label>
              <Input
                id="lastName"
                placeholder="Pérez"
                {...register("lastName")}
                error={errors.lastName?.message}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              {...register("email")}
              error={errors.email?.message}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono (opcional)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+56 9 1234 5678"
              {...register("phone")}
              error={errors.phone?.message}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("password")}
                error={errors.password?.message}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-10 w-10"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...register("confirmPassword")}
              error={errors.confirmPassword?.message}
            />
          </div>
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="terms"
              className="rounded border-input mt-1"
              required
            />
            <label htmlFor="terms" className="text-sm text-muted-foreground">
              Acepto los{" "}
              <Link href="/terms" className="text-primary hover:underline">
                términos y condiciones
              </Link>{" "}
              y la{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                política de privacidad
              </Link>
            </label>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" isLoading={isLoading}>
            Crear cuenta
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Inicia sesión
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
