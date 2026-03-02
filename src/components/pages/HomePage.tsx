"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Clock,
  Shield,
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
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
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
                                <ImageWithFallback
                                  src={getAssetUrl(tenant.logoUrl)}
                                  alt={tenant.name}
                                  containerClassName="h-10 w-10 shrink-0 rounded-lg"
                                  className="object-contain"
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

        {/* How it Works Section */}
        <section id="como-funciona" className="py-24 bg-muted/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
          <div className="container mx-auto px-4 relative">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
                ¿Cómo funciona?
              </h2>
              <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto">
                Tu próxima partida está a solo unos clics de distancia. Así de fácil es usar Easy Sport Book.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Step 1 */}
              <div className="group relative">
                <div className="absolute top-8 left-[60%] w-full h-0.5 bg-gradient-to-r from-primary/40 to-transparent hidden md:block" />
                <Card className="border-none bg-background/50 backdrop-blur-sm shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                  <CardContent className="p-8 text-center flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-inner">
                      <span className="text-2xl font-bold text-primary group-hover:text-primary-foreground">1</span>
                    </div>
                    <h3 className="font-bold text-xl mb-3">Busca y Explora</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Encuentra los mejores centros deportivos de la ciudad, filtra por tu deporte favorito y revisa la disponibilidad.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Step 2 */}
              <div className="group relative">
                <div className="absolute top-8 left-[60%] w-full h-0.5 bg-gradient-to-r from-primary/40 to-transparent hidden md:block" />
                <Card className="border-none bg-background/50 backdrop-blur-sm shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                  <CardContent className="p-8 text-center flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-inner">
                      <span className="text-2xl font-bold text-primary group-hover:text-primary-foreground">2</span>
                    </div>
                    <h3 className="font-bold text-xl mb-3">Elige tu Horario</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Selecciona la cancha perfecta, el día y la hora que más te acomoda de forma rápida e intuitiva.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Step 3 */}
              <div className="group relative">
                <Card className="border-none bg-background/50 backdrop-blur-sm shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                  <CardContent className="p-8 text-center flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-inner">
                      <span className="text-2xl font-bold text-primary group-hover:text-primary-foreground">3</span>
                    </div>
                    <h3 className="font-bold text-xl mb-3">Reserva y Juega</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Confirma tu reserva con pago seguro. ¡Alista tu equipo y prepárate para disfrutar en la cancha!
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div className="mt-16 text-center">
              <Button size="lg" className="px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-primary/25 transition-all" asChild>
                <Link href="/browse">
                  Comienza a Reservar <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
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
