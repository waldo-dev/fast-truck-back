# Fast Trucks Backend

Backend API desarrollado con Node.js, TypeScript y Express.

## Requisitos

- Node.js >= 18.0.0
- npm >= 9.0.0

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
```

3. Editar `.env` con tus configuraciones (ver sección de Variables de Entorno)

## Scripts Disponibles

- `npm run dev` - Inicia el servidor en modo desarrollo con hot-reload
- `npm run build` - Compila TypeScript a JavaScript
- `npm start` - Inicia el servidor en producción (requiere build previo)
- `npm run lint` - Ejecuta ESLint para verificar el código
- `npm run lint:fix` - Ejecuta ESLint y corrige errores automáticamente
- `npm run format` - Formatea el código con Prettier
- `npm run format:check` - Verifica el formato del código

## Variables de Entorno

Copia el archivo `.env.example` a `.env` y configura las siguientes variables:

| Variable | Descripción | Valor por defecto | Requerido |
|----------|-------------|-------------------|-----------|
| `NODE_ENV` | Entorno de ejecución (development/production) | `development` | No |
| `PORT` | Puerto en el que escucha el servidor | `5000` | No |
| `API_VERSION` | Versión de la API | `v1` | No |
| `DB_HOST` | Host de la base de datos PostgreSQL | - | Sí |
| `DB_PORT` | Puerto de la base de datos PostgreSQL | `5432` | No |
| `DB_NAME` | Nombre de la base de datos | - | Sí |
| `DB_USER` | Usuario de la base de datos | - | Sí |
| `DB_PASSWORD` | Contraseña de la base de datos | - | Sí |

## Arquitectura del Proyecto

El proyecto sigue una **arquitectura modular por dominio**, donde cada módulo contiene su propia lógica de negocio organizada en capas.

### Estructura del Proyecto

```
src/
├── app.ts                 # Configuración de Express
├── server.ts              # Punto de entrada del servidor
├── config/
│   └── env.ts            # Configuración de variables de entorno
├── shared/               # Código compartido entre módulos
│   ├── database/
│   │   ├── connection.ts # Configuración de Sequelize
│   │   └── models/        # Modelos de Sequelize
│   │       ├── *.ts       # Modelos de las tablas
│   │       ├── enums.ts   # Enumeraciones
│   │       └── index.ts   # Inicialización de relaciones
│   ├── errors/
│   │   └── AppError.ts   # Clases de error personalizadas
│   ├── middlewares/
│   │   ├── errorHandler.ts      # Middleware de manejo de errores
│   │   └── notFoundHandler.ts   # Middleware para rutas no encontradas
│   └── utils/
│       └── logger.ts            # Utilidad de logging
└── modules/              # Módulos de dominio
    └── health/           # Ejemplo de módulo
        ├── health.controller.ts  # Controlador (maneja requests/responses)
        ├── health.service.ts     # Lógica de negocio
        ├── health.repository.ts  # Acceso a datos
        ├── health.routes.ts      # Definición de rutas
        └── index.ts              # Exportaciones del módulo
```

### Arquitectura Modular

Cada módulo sigue el patrón **Controller → Service → Repository**:

- **Controller**: Maneja las peticiones HTTP, valida inputs y envía respuestas
- **Service**: Contiene la lógica de negocio del dominio
- **Repository**: Gestiona el acceso a datos (base de datos, APIs externas, etc.)
- **Routes**: Define los endpoints del módulo

### Agregar un Nuevo Módulo

Para agregar un nuevo módulo, crea una carpeta en `src/modules/` con la siguiente estructura:

```
modules/
└── tu-modulo/
    ├── tu-modulo.controller.ts
    ├── tu-modulo.service.ts
    ├── tu-modulo.repository.ts
    ├── tu-modulo.routes.ts
    └── index.ts
```

Luego, importa las rutas en `src/app.ts`:

```typescript
import tuModuloRoutes from './modules/tu-modulo/tu-modulo.routes';
app.use('/api/tu-modulo', tuModuloRoutes);
```

## Endpoints

### Health Check

- **GET** `/health`
  - Verifica el estado del servidor
  - Retorna información sobre el estado, timestamp, uptime y entorno

## Desarrollo

El proyecto utiliza:
- **TypeScript** para tipado estático
- **Express** como framework web
- **Sequelize** como ORM para PostgreSQL
- **PostgreSQL** como base de datos
- **ts-node-dev** para desarrollo con hot-reload
- **ESLint** y **Prettier** para calidad y formato de código
- **dotenv** para gestión de variables de entorno

## Base de Datos

El proyecto utiliza **Sequelize** como ORM para interactuar con PostgreSQL. Todos los modelos están definidos en `src/shared/database/models/` y las relaciones se inicializan automáticamente al importar los modelos.

### Modelos Disponibles

- `Business` - Negocios
- `Category` - Categorías de productos
- `Customer` - Clientes
- `CustomerAddress` - Direcciones de clientes
- `Event` - Eventos
- `InventoryItem` - Items de inventario
- `InventoryLocation` - Ubicaciones de inventario
- `InventoryMovement` - Movimientos de inventario
- `Location` - Ubicaciones físicas
- `Order` - Órdenes
- `OrderItem` - Items de órdenes
- `Payment` - Pagos
- `Product` - Productos
- `ProductOption` - Opciones de productos
- `ProductOptionRecipe` - Recetas de opciones de productos
- `ProductRecipe` - Recetas de productos
- `Promotion` - Promociones
- `PromotionProduct` - Relación entre promociones y productos

### Uso de Modelos

```typescript
import { Business, Product, Order } from './shared/database/models';

// Ejemplo de uso en un repository
const businesses = await Business.findAll();
const products = await Product.findAll({ where: { status: 'ACTIVE' } });
```

## Licencia

ISC

