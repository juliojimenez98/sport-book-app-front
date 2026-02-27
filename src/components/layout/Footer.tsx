import Link from "next/link";
import { Logo } from "./Logo";
import { Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Logo />
            <p className="text-sm text-muted-foreground">
              La plataforma líder en reservas de canchas deportivas. Reserva
              fácil, juega más.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Centro Deportivo</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/about"
                  className="hover:text-foreground transition-colors"
                >
                  Sobre nosotros
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-foreground transition-colors"
                >
                  Contacto
                </Link>
              </li>
              <li>
                <Link
                  href="/careers"
                  className="hover:text-foreground transition-colors"
                >
                  Trabaja con nosotros
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-foreground transition-colors"
                >
                  Privacidad
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="hover:text-foreground transition-colors"
                >
                  Términos de uso
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="hover:text-foreground transition-colors"
                >
                  Política de cookies
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contacto</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <a
                  href="mailto:hola@bookingpro.com"
                  className="hover:text-foreground transition-colors"
                >
                  hola@bookingpro.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <a
                  href="tel:+525512345678"
                  className="hover:text-foreground transition-colors"
                >
                  +52 55 1234 5678
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary mt-0.5" />
                <span>Ciudad de México, México</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Easy Sport Book. Todos los derechos
            reservados.
          </p>
          <div className="flex items-center gap-4">
            {/* Social links placeholder */}
            <span className="text-sm text-muted-foreground">
              Síguenos en redes sociales
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
