# Granme - Frontend

Un sistema de autenticación moderno construido con React, Vite y Tailwind CSS

## Características

- **Autenticación **: Login, registro, recuperación y restablecimiento de contraseña
- **Diseño responsivo**: Optimizado para dispositivos móviles y desktop
- **Componentes reutilizables**: Arquitectura modular con componentes UI consistentes
- **Validación robusta**: Validación de formularios en tiempo real
- **Tema personalizado**: Paleta de colores verde con diseño moderno

## Tecnologías Utilizadas

- **React 19.1.1** - Biblioteca de interfaz de usuario
- **Vite 7.1.2** - Herramienta de construcción y servidor de desarrollo
- **Tailwind CSS 3.4.17** - Framework de CSS utilitario
- **React Router DOM 7.9.1** - Enrutamiento del lado del cliente
- **Axios 1.12.1** - Cliente HTTP para peticiones API
- **Radix UI** - Componentes de interfaz accesibles
- **Lucide React** - Iconos SVG optimizados

## Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (versión 18.0.0 o superior)
- **npm** (versión 8.0.0 o superior) o **yarn** (versión 1.22.0 o superior)
- **Git** para clonar el repositorio

### Verificar instalaciones

```bash
node --version
npm --version
git --version
```

## Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/granme-frontend.git
cd granme-frontend
```

### 2. Instalar dependencias

```bash
# Navegar al directorio del cliente
cd client

# Instalar dependencias
npm install

```

### 3. Configurar variables de entorno

Crea un archivo `.env` en el directorio `client/`:

```env
VITE_API_URL=http://localhost:4000/api
```

### 4. Ejecutar en modo desarrollo

```bash
npm run dev
```

El servidor de desarrollo se ejecutará en `http://localhost:5173`

##  Estructura del Proyecto

```
client/
├── public/                 # Archivos estáticos
├── src/
│   ├── components/         # Componentes reutilizables
│   │   ├── ui/            # Componentes de interfaz base
│   │   ├── AuthLayout.jsx # Layout para páginas de autenticación
│   │   ├── AuthHeader.jsx # Header con logo y título
│   │   └── AuthCard.jsx   # Tarjeta contenedora
│   ├── pages/             # Páginas de la aplicación
│   │   ├── Login.jsx      # Página de inicio de sesión
│   │   ├── Register.jsx   # Página de registro
│   │   ├── ForgotPassword.jsx # Recuperación de contraseña
│   │   └── ResetPassword.jsx  # Restablecimiento de contraseña
│   ├── lib/               # Utilidades y configuraciones
│   ├── App.jsx            # Componente principal
│   ├── main.jsx           # Punto de entrada
│   └── index.css          # Estilos globales
├── package.json           # Dependencias y scripts
├── vite.config.js         # Configuración de Vite
├── tailwind.config.js     # Configuración de Tailwind
└── jsconfig.json          # Configuración de JavaScript
```

##  Páginas Disponibles

###  Autenticación


##  Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia el servidor de desarrollo

        
```

##  Configuración del Backend

Este frontend está diseñado para trabajar con un backend con spring boot que proporcione los siguientes endpoints:

### Endpoints Requeridos

```javascript
// Autenticación
POST /api/login              // Inicio de sesión
POST /api/register           // Registro de usuario
POST /api/forgot-password    // Solicitud de recuperación
POST /api/reset-password     // Restablecimiento de contraseña
```

### Formato de Respuestas Esperadas

```javascript
// Respuesta exitosa
{
  "status": 200,
  "message": "Operación exitosa",
  "data": { ... }
}

// Respuesta de error
{
  "status": 400,
  "message": "Mensaje de error",
  "error": "Detalles del error"
}
```

##  Personalización

### Colores del Tema

El proyecto utiliza una paleta de colores verde personalizada:

```css
--primary-green: #6b7c45      /* Verde principal */
--dark-green: #1a2e02         /* Verde oscuro para texto */
--medium-green: #4a5c2a       /* Verde medio para subtítulos */
--light-green: #e8f0d8        /* Verde claro para fondos */
```

### Componentes Personalizables

- **AuthLayout**: Layout base para páginas de autenticación
- **AuthHeader**: Header con logo y títulos
- **AuthCard**: Tarjeta contenedora con estilos consistentes



## Autores



