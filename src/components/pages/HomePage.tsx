"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Clock,
  Shield,
  Star,
  Users,
  Building2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { Footer } from "@/components/layout/Footer";
import { publicApi, getAssetUrl } from "@/lib/api/endpoints";
import { Tenant } from "@/lib/types";

const features = [
  {
    icon: Calendar,
    title: "Reserva Fácil",
    description:
      "Reserva tu cancha favorita en segundos con nuestro sistema intuitivo.",
  },
  {
    icon: MapPin,
    title: "Múltiples Ubicaciones",
    description: "Encuentra canchas cerca de ti con nuestra red de sucursales.",
  },
  {
    icon: Clock,
    title: "Disponibilidad 24/7",
    description: "Consulta horarios y reserva en cualquier momento del día.",
  },
  {
    icon: Shield,
    title: "Pago Seguro",
    description:
      "Transacciones protegidas con los más altos estándares de seguridad.",
  },
];

const testimonials = [
  {
    name: "Carlos Rodríguez",
    role: "Jugador Amateur",
    content:
      "Excelente plataforma! Ahora puedo reservar mi cancha de fútbol en minutos.",
    rating: 5,
  },
  {
    name: "María González",
    role: "Coordinadora de Equipos",
    content:
      "Facilita mucho la organización de partidos para nuestro equipo de pádel.",
    rating: 5,
  },
  {
    name: "Juan Martínez",
    role: "Entrenador",
    content:
      "La mejor herramienta para gestionar las reservas de mis clases de tenis.",
    rating: 5,
  },
];

export default function HomePage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      const data = await publicApi.getTenants();
      setTenants(data);
    } catch (error) {
      console.error("Error loading tenants:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-linear-to-br from-primary/10 via-background to-secondary/10 py-20 sm:py-32">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
                Reserva tu cancha{" "}
                <span className="text-primary">en segundos</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                La plataforma más fácil y rápida para reservar canchas
                deportivas. Fútbol, tenis, pádel, basketball y más.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="w-full sm:w-auto text-lg px-8"
                  asChild
                >
                  <a href="#centros-deportivos">Explorar Centros Deportivos</a>
                </Button>
                <Link href="/register">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto text-lg px-8"
                  >
                    Crear Cuenta Gratis
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                ¿Por qué elegirnos?
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Ofrecemos la mejor experiencia para reservar canchas deportivas
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className="border-none shadow-lg hover:shadow-xl transition-shadow"
                >
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Tenants/Companies Section */}
        <section id="centros-deportivos" className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Nuestros Centros Deportivos
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Encuentra canchas en las mejores instalaciones deportivas
              </p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-8 w-2/3 mb-2" />
                      <Skeleton className="h-4 w-full mb-4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : tenants.length === 0 ? (
              <Card className="max-w-md mx-auto">
                <CardContent className="py-12 text-center">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-lg font-medium">
                    No hay centros deportivos disponibles
                  </p>
                  <p className="text-muted-foreground">
                    Pronto agregaremos más opciones
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {tenants.map((tenant) => {
                  const branchCount = (tenant as any).branches?.length || 0;
                  return (
                    <Link
                      key={tenant.tenantId}
                      href={`/${tenant.slug}`}
                      className="block group"
                    >
                      <Card className="h-full hover:shadow-lg transition-all hover:border-primary/50">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              {tenant.logoUrl ? (
                                <img
                                  src={getAssetUrl(tenant.logoUrl)}
                                  alt={tenant.name}
                                  className="h-10 w-10 rounded-lg object-contain"
                                />
                              ) : (
                                <div
                                  className="h-10 w-10 rounded-lg flex items-center justify-center"
                                  style={{
                                    backgroundColor:
                                      tenant.primaryColor || "#16a34a",
                                  }}
                                >
                                  <Building2 className="h-5 w-5 text-white" />
                                </div>
                              )}
                              <div>
                                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                                  {tenant.name}
                                </CardTitle>
                                <CardDescription>
                                  {branchCount}{" "}
                                  {branchCount === 1
                                    ? "sucursal"
                                    : "sucursales"}
                                </CardDescription>
                              </div>
                            </div>
                            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                          </div>
                        </CardHeader>
                        <CardContent>
                          {tenant.phone && (
                            <p className="text-sm text-muted-foreground">
                              {tenant.phone}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold mb-2">500+</div>
                <div className="text-primary-foreground/80">
                  Canchas Disponibles
                </div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">50+</div>
                <div className="text-primary-foreground/80">Sucursales</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">10k+</div>
                <div className="text-primary-foreground/80">
                  Usuarios Activos
                </div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">25k+</div>
                <div className="text-primary-foreground/80">
                  Reservas al Mes
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Lo que dicen nuestros usuarios
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Miles de deportistas ya confían en nuestra plataforma
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="border shadow-md">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-5 w-5 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4">
                      &ldquo;{testimonial.content}&rdquo;
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold">{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {testimonial.role}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-linear-to-br from-primary to-primary/80 text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              ¿Listo para jugar?
            </h2>
            <p className="text-xl mb-8 text-primary-foreground/90 max-w-2xl mx-auto">
              Únete a miles de deportistas que ya reservan sus canchas con
              nosotros
            </p>
            <Link href="/register">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Comenzar Ahora - Es Gratis
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
