# Booking Platform - Frontend

Frontend para la plataforma de reservas de canchas deportivas multi-empresa y multi-sucursal.

## 🚀 Tecnologías

- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS v4
- **Componentes UI**: Radix UI Primitives
- **Formularios**: React Hook Form + Zod
- **Notificaciones**: Sonner
- **Iconos**: Lucide React

## 📋 Requisitos

- Node.js 18+
- npm o yarn
- Backend corriendo en `http://localhost:3000`

## 🛠️ Instalación

1. Instalar dependencias:

```bash
npm install
```

2. Configurar variables de entorno:

```bash
cp .env.local.example .env.local
```

Editar `.env.local` con la URL del backend:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

3. Iniciar el servidor de desarrollo:

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3001`

## 📁 Estructura del Proyecto

```
src/
├── app/                    # Rutas y páginas (App Router)
│   ├── (auth)/            # Grupo de rutas de autenticación
│   │   ├── login/
│   │   └── register/
│   ├── (app)/             # Grupo de rutas de usuario autenticado
│   │   ├── dashboard/
│   │   ├── bookings/
│   │   └── browse/
│   ├── (super-admin)/     # Grupo de rutas de super admin
│   ├── (tenant-admin)/    # Grupo de rutas de admin de empresa
│   ├── (branch-admin)/    # Grupo de rutas de admin de sucursal
│   ├── layout.tsx         # Layout raíz
│   └── page.tsx           # Landing page
├── components/
│   ├── ui/                # Componentes UI reutilizables
│   ├── auth/              # Componentes de autenticación
│   └── layout/            # Componentes de layout
├── contexts/              # Contextos de React
│   ├── AuthContext.tsx    # Contexto de autenticación
│   └── ThemeContext.tsx   # Contexto de tema (dark/light)
└── lib/
    ├── api/               # Cliente API y endpoints
    ├── types/             # Tipos TypeScript
    └── utils.ts           # Utilidades
```

## 👥 Roles de Usuario

| Rol            | Descripción         | Acceso                                         |
| -------------- | ------------------- | ---------------------------------------------- |
| `user`         | Usuario normal      | Dashboard, reservas, búsqueda                  |
| `branch_admin` | Admin de sucursal   | Gestión de recursos y reservas de su sucursal  |
| `tenant_admin` | Admin de empresa    | Gestión de sucursales y usuarios de su empresa |
| `super_admin`  | Super administrador | Gestión completa del sistema                   |

## 🎨 Tema

El sistema utiliza un tema basado en CSS variables con soporte para:

- **Modo claro/oscuro**: Toggle manual o seguir preferencia del sistema
- **Color primario**: Teal (#14b8a6)
- **Temas por tenant**: Cada empresa puede tener su propia paleta de colores

## 📱 Páginas Principales

### Públicas

- `/` - Landing page
- `/login` - Inicio de sesión
- `/register` - Registro de usuario

### Usuario Autenticado

- `/dashboard` - Panel principal
- `/bookings` - Mis reservas
- `/browse` - Buscar canchas disponibles

### Administración

- `/super-admin` - Panel de super administrador
- `/tenant-admin` - Panel de administrador de empresa
- `/branch-admin` - Panel de administrador de sucursal

## 🔐 Autenticación

El sistema utiliza JWT con tokens de acceso y refresh:

- **Access Token**: Expira en 15 minutos
- **Refresh Token**: Expira en 7 días
- **Renovación automática**: El cliente renueva tokens automáticamente en respuestas 401

## 📝 Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Iniciar producción
npm run start

# Linter
npm run lint
```

## 🔧 Configuración del Puerto

Por defecto, el frontend corre en el puerto 3001 (configurado en `package.json`).
El backend corre en el puerto 3000.

## 📄 Licencia

MIT
