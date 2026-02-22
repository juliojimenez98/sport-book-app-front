"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CalendarDays, CheckCircle, XCircle, Loader2 } from "lucide-react";

type State = "loading" | "success" | "already_verified" | "error";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<State>("loading");
  const [message, setMessage] = useState("");

  const verify = useCallback(async () => {
    if (!token) {
      setState("error");
      setMessage("No se encontró el token de verificación en el link.");
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/auth/verify-email?token=${encodeURIComponent(token)}`,
        { method: "GET" },
      );
      const data = await res.json();

      if (res.ok && data.success) {
        setState(data.alreadyVerified ? "already_verified" : "success");
        setMessage(data.message);
      } else {
        setState("error");
        setMessage(data.message || "El link es inválido o ha expirado.");
      }
    } catch {
      setState("error");
      setMessage("Error de conexión. Intenta de nuevo.");
    }
  }, [token]);

  useEffect(() => {
    verify();
  }, [verify]);

  return (
    <div className="bg-card rounded-2xl border border-border shadow-xl overflow-hidden w-full">
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)",
        }}
        className="px-8 py-8 text-center"
      >
        <Link href="/" className="inline-flex items-center gap-2 justify-center">
          <CalendarDays className="h-8 w-8 text-white" />
          <span style={{ color: "#fff", fontSize: 22, fontWeight: 700 }}>
            BookingPro
          </span>
        </Link>
      </div>

      {/* Body */}
      <div className="px-8 py-10 text-center">
        {state === "loading" && (
          <>
            <Loader2
              className="h-14 w-14 mx-auto mb-5 animate-spin"
              style={{ color: "#14b8a6" }}
            />
            <h2 className="text-xl font-bold text-foreground mb-2">
              Verificando tu cuenta…
            </h2>
            <p className="text-muted-foreground text-sm">
              Un momento, estamos activando tu cuenta.
            </p>
          </>
        )}

        {(state === "success" || state === "already_verified") && (
          <>
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
              <CheckCircle className="h-9 w-9 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">
              {state === "already_verified"
                ? "¡Ya estabas verificado!"
                : "¡Email verificado! 🎉"}
            </h2>
            <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
              {message ||
                "Tu cuenta está activa. Ya puedes iniciar sesión y comenzar a reservar."}
            </p>
            <Link
              href="/login"
              style={{
                display: "inline-block",
                background: "linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)",
                color: "#fff",
                borderRadius: 10,
                padding: "12px 32px",
                fontWeight: 600,
                fontSize: 15,
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(20,184,166,0.35)",
              }}
            >
              Ir al inicio de sesión →
            </Link>
          </>
        )}

        {state === "error" && (
          <>
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "50%",
                width: 72,
                height: 72,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <XCircle className="h-9 w-9" style={{ color: "#ef4444" }} />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Link inválido o expirado
            </h2>
            <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
              {message ||
                "El link de verificación no es válido o ya expiró (24 horas)."}
              <br />
              Regístrate de nuevo para recibir un link fresco.
            </p>
            <div className="flex flex-col gap-3 items-center">
              <Link
                href="/register"
                style={{
                  display: "inline-block",
                  background:
                    "linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)",
                  color: "#fff",
                  borderRadius: 10,
                  padding: "12px 32px",
                  fontWeight: 600,
                  fontSize: 15,
                  textDecoration: "none",
                }}
              >
                Volver a registrarme
              </Link>
              <Link
                href="/login"
                style={{
                  color: "#14b8a6",
                  fontSize: 14,
                  textDecoration: "none",
                }}
              >
                Ya tengo mi cuenta activa → Login
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div
        style={{ borderTop: "1px solid #e2e8f0" }}
        className="px-8 py-5 text-center"
      >
        <p style={{ color: "#94a3b8", fontSize: 12 }}>
          © {new Date().getFullYear()} BookingPro · Todos los derechos reservados
        </p>
      </div>
    </div>
  );
}
