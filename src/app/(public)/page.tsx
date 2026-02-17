import Link from "next/link";
import {
  CalendarDays,
  Building2,
  Users,
  Shield,
  Clock,
  Smartphone,
  ArrowRight,
  CheckCircle,
  Star,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";

const features = [
  {
    icon: CalendarDays,
    title: "Reserva fácil",
    description:
      "Encuentra y reserva canchas en segundos. Sin llamadas, sin esperas.",
  },
  {
    icon: Building2,
    title: "Multi-sucursal",
    description:
      "Accede a múltiples ubicaciones de tu centro deportivo favorito.",
  },
  {
    icon: Clock,
    title: "Disponibilidad en tiempo real",
    description: "Ve la disponibilidad actualizada y evita sorpresas.",
  },
  {
    icon: Smartphone,
    title: "Acceso desde cualquier lugar",
    description: "Reserva desde tu computadora, tablet o celular.",
  },
  {
    icon: Shield,
    title: "Reservas seguras",
    description:
      "Tu información está protegida. Cancela fácilmente si lo necesitas.",
  },
  {
    icon: Users,
    title: "Para todos",
    description: "Reserva como invitado o crea tu cuenta para más beneficios.",
  },
];

const steps = [
  {
    number: "1",
    title: "Elige tu deporte",
    description: "Fútbol, tenis, pádel, básquetbol y más.",
  },
  {
    number: "2",
    title: "Selecciona ubicación",
    description: "Encuentra la sucursal más cercana a ti.",
  },
  {
    number: "3",
    title: "Reserva tu horario",
    description: "Elige fecha, hora y confirma tu reserva.",
  },
];

const testimonials = [
  {
    name: "Carlos M.",
    role: "Jugador amateur",
    content:
      "Antes perdía mucho tiempo llamando para reservar. Ahora en 2 minutos tengo mi cancha lista.",
    rating: 5,
  },
  {
    name: "María L.",
    role: "Organizadora de torneos",
    content:
      "Excelente plataforma para organizar partidos con amigos. La disponibilidad en tiempo real es clave.",
    rating: 5,
  },
  {
    name: "Roberto G.",
    role: "Entrenador",
    content:
      "Mis alumnos pueden ver mis horarios y reservar directamente. Ha simplificado todo.",
    rating: 5,
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-5" />
        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Reserva tu cancha
              <span className="gradient-text"> favorita</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              La forma más fácil de encontrar y reservar canchas deportivas.
              Fútbol, tenis, pádel y más. Sin complicaciones.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/browse">
                  Buscar canchas
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/register">Crear cuenta gratis</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ¿Cómo funciona?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Reservar tu cancha es muy sencillo. Solo sigue estos pasos.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 rounded-full gradient-primary text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Todo lo que necesitas
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Una plataforma completa para reservar canchas deportivas.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-0 shadow-sm hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Lo que dicen nuestros usuarios
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-5 w-5 fill-warning text-warning"
                      />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">
                    {testimonial.content}
                  </p>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="centros-deportivos" className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="gradient-primary text-white border-0">
              <CardContent className="p-12 text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  ¿Tienes un centro deportivo?
                </h2>
                <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                  Únete a BookingPro y digitaliza tu negocio. Más reservas,
                  menos trabajo administrativo.
                </p>
                <div className="flex flex-wrap justify-center gap-4 mb-8">
                  {[
                    "Gestión multi-sucursal",
                    "Calendario en tiempo real",
                    "Reportes y analytics",
                    "Sin comisiones ocultas",
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2"
                    >
                      <CheckCircle className="h-5 w-5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/contact">
                    Contactar ventas
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ¿Listo para jugar?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Encuentra la cancha perfecta y reserva en minutos.
          </p>
          <Button size="lg" asChild>
            <Link href="/browse">
              Comenzar ahora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
