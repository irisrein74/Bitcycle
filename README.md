# BitCycle

Gestión de planta de reciclaje RAEE (ekopuntos, recepción, canjes STEM, clientes, catálogo e historial de tiques).

## Requisitos

- Node.js 22+
- PostgreSQL (local con pgAdmin u otro cliente)

## Base de datos (pgAdmin)

1. En pgAdmin, creá una base vacía, por ejemplo `bitcycle`.
2. Copiá `.env.example` a `.env` y configurá `DATABASE_URL`:

   ```text
   postgresql://USUARIO:CONTRASEÑA@localhost:5432/bitcycle
   ```

3. Aplicá el esquema y datos demo:

   ```bash
   npm run db:migrate
   ```

Las tablas y datos iniciales están en `migrations/0002_bitcycle.sql`.

## Desarrollo

```bash
npm install
npm run dev
```

Abrí la URL que muestra Vite (por defecto `http://localhost:5173`).

### Sin PostgreSQL (solo prueba rápida)

Si no definís `DATABASE_URL`, la app usa **PGLite** en memoria con las mismas migraciones. Los datos se pierden al reiniciar el servidor.

## Acceso operadores (demo)

Configurá `BITCYCLE_OPERATOR_USERNAME`, `BITCYCLE_OPERATOR_PASSWORD`, `BITCYCLE_ADMIN_USERNAME` y `BITCYCLE_ADMIN_PASSWORD` en `.env` para definir las credenciales de demo. Las contraseñas deben tener al menos 12 caracteres. Definí también `BITCYCLE_SESSION_SECRET` con un valor aleatorio de al menos 32 caracteres; por ejemplo:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

En Vercel, cargá esas variables en la configuración del proyecto y no reutilices credenciales de otros servicios. Las sesiones se cifran y firman en una cookie HttpOnly; este acceso sirve para la demo, no reemplaza una solución de identidad para producción. Los roles operador y admin se registran en la sesión y se muestran en la interfaz, pero por ahora ambos tienen los mismos permisos.

## Scripts

| Comando           | Descripción                          |
|-------------------|--------------------------------------|
| `npm run dev`     | Servidor de desarrollo               |
| `npm run build`   | Build de producción + migraciones    |
| `npm run db:migrate` | Aplica migraciones pendientes   |
| `npm run typecheck`  | Verificación TypeScript          |

## Módulos

- **Panel** — indicadores y actividad reciente
- **Recepción RAEE** — ingreso de material y ekopuntos
- **Canjes STEM** — canje de artículos por ekopuntos
- **Catálogo & stock** — artículos canjeables
- **Clientes & saldos** — escuelas y particulares
- **Tiques** — comprobantes e historial

## Producción

Tras `npm run build`, ejecutá el servidor Nitro generado (carpeta `.output`) con `DATABASE_URL` definida en el entorno del host. Configurá también `VITE_SITE_URL` con la URL pública del sitio (por ejemplo, `https://bitcycle.example.com`) en Vercel para que los metadatos de las vistas previas sociales incluyan URL absolutas.
