"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarDays, Eye, EyeOff, Mail } from "lucide-react";
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

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

type LoginFormData = z.infer<typeof loginSchema>;

// Keywords that indicate an unverified-email 401
const UNVERIFIED_KEYWORDS = ["verificar", "verifica", "verified", "verify"];

function isUnverifiedEmailError(message: string) {
  const lower = message.toLowerCase();
  return UNVERIFIED_KEYWORDS.some((kw) => lower.includes(kw));
}

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setUnverifiedEmail(null);
    setIsLoading(true);
    try {
      const success = await login(data);
      if (success) {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : String(err);
      if (isUnverifiedEmailError(message)) {
        setUnverifiedEmail(data.email);
      }
      // Generic errors are already handled by the toast inside AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  // ── Unverified email banner ──────────────────────────────────────────────────
  const UnverifiedBanner = unverifiedEmail ? (
    <div
      style={{
        background: "#fffbeb",
        border: "1px solid #fcd34d",
        borderRadius: 10,
        padding: "14px 16px",
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
      }}
    >
      <Mail className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: "#d97706" }} />
      <div>
        <p style={{ margin: "0 0 4px", fontWeight: 600, fontSize: 14, color: "#92400e" }}>
          Email pendiente de verificación
        </p>
        <p style={{ margin: 0, fontSize: 13, color: "#78350f", lineHeight: 1.5 }}>
          Enviamos un link de activación a{" "}
          <strong>{unverifiedEmail}</strong>. Haz clic en ese link para
          activar tu cuenta y poder iniciar sesión.
        </p>
      </div>
    </div>
  ) : null;

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader className="text-center">
        <Link href="/" className="flex items-center justify-center gap-2 mb-4">
          <CalendarDays className="h-10 w-10 text-primary" />
          <span className="text-2xl font-bold gradient-text">Easy Sport Book</span>
        </Link>
        <CardTitle className="text-2xl">Iniciar sesión</CardTitle>
        <CardDescription>
          Ingresa tus credenciales para acceder a tu cuenta
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {/* Unverified email banner */}
          {UnverifiedBanner}

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
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="rounded border-input" />
              Recordarme
            </label>
            <Link
              href="/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" isLoading={isLoading}>
            Iniciar sesión
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Regístrate aquí
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
