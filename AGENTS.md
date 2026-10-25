# AGENTS.md — Bitcycle

Instrucciones para agentes de código (Claude Code, Codex, Cursor, etc.) que trabajen en este repositorio.
Si algo de este archivo contradice lo que ves en el código, **avisá antes de asumir** y proponé actualizar el archivo.

## 1. Qué es Bitcycle

Aplicación web para operar una planta de reciclaje de RAEE (residuos de aparatos eléctricos y electrónicos). Las escuelas y los particulares entregan material, reciben **EkoPuntos (EKP)** y los canjean por artículos STEM.

Módulos (una ruta por módulo): **Panel**, **Recepción RAEE**, **Canjes STEM**, **Catálogo y stock**, **Clientes y saldos**, **Tiques**.

Glosario:

| Término | Significado |
| --- | --- |
| EKP / ekopuntos | Moneda interna. Se acreditan al recibir material y se descuentan al canjear. |
| Recepción / entrega | Ingreso de material pesado en kg. Tabla `deliveries`. Acredita EKP. |
| Canje | Cambio de EKP por artículos del catálogo. Tabla `redemptions`. |
| Tique | Comprobante inmutable de una operación. Tabla `tickets`. |
| Cliente | Escuela o particular (`client_type`: `escuela` / `particular`). |
| Categoría de hardware | Tipo de RAEE con su tasa de EKP por kg (`hardware_types`). |

## 2. Idioma y nomenclatura

- **Texto de interfaz y mensajes de error al usuario: español rioplatense con voseo** ("Seleccioná", "Reintentá", "Indicá el motivo").
- **Identificadores de código: inglés** (`registerDelivery`, `clientId`). Columnas SQL en `snake_case`, propiedades TypeScript en `camelCase`.
- Los **valores de dominio guardados en la base están en español** y no se traducen: `activo`/`inactivo`, `pendiente`/`entregado`/`cancelado`, `escuela`/`particular`, `entrega`/`canje`, roles `operador`/`admin`.
- Formatos de números, fechas y códigos: usá siempre los helpers de `src/lib/format.ts` (`formatEkp`, `formatKg`, `formatDateTime`, `ticketCode`…). Locale `es-AR`. No formatees a mano.

## 3. Stack (no cambiar sin consultar)

- React 19, TypeScript 5, Vite 8.
- TanStack Start + TanStack Router (rutas por archivo) + TanStack Query v5.
- Tailwind CSS 4, componentes tipo shadcn sobre Radix (`src/components/ui/`), `sonner` para toasts.
- Validación con **zod 4**.
- Servidor: Nitro (beta), despliegue en Vercel.
- Base de datos: PostgreSQL con `pg`; **PGLite en memoria** como respaldo si no hay `DATABASE_URL`.
- Node.js **22+**.

No uses patrones antiguos de React: nada de `forwardRef` nuevo, nada de `useEffect` para traer o derivar datos, nada de clases de Tailwind 3 que ya no existan en la v4.

## 4. Comandos y definición de "terminado"

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo (puerto 5173 por defecto). |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm run lint` | ESLint (config flat). |
| `npm test` | Solo prueba el planificador de migraciones (`scripts/migration-plan.test.mjs`). |
| `npm run format` | Prettier. |
| `npm run db:migrate` | Aplica migraciones pendientes a `DATABASE_URL`. |
| `npm run build` | `vite build` **y luego `db:migrate`**. |

Un cambio está **terminado** cuando `typecheck`, `lint` y `test` pasan sin errores nuevos. Si no podés ejecutarlos, decilo explícitamente en lugar de afirmar que funcionan.

> ⚠️ **`npm run build` modifica la base.** Corre `db:migrate` contra `DATABASE_URL`. Nunca lo ejecutes con una `DATABASE_URL` apuntando a datos reales salvo que te lo pidan. Con la base real y `_migrations` al día no cambia nada, pero no lo des por hecho.

## 5. Arquitectura y flujo de datos

```
src/routes/        Rutas por archivo. index.tsx = login. _plant.*.tsx = módulos protegidos.
src/components/    plant-shell.tsx (layout + chequeo de sesión), ticket-card.tsx, ui/ (primitivas).
src/lib/api.ts     TODA la lógica de datos del servidor (createServerFn) + mapeo SQL → tipos.
src/lib/auth.ts    Server functions de sesión (signIn, signOut, getCurrentOperator, requireOperator).
src/lib/auth.server.ts  Lógica de sesión que solo corre en el servidor.
src/lib/db.ts      getSql(): abstrae pg y PGLite, normaliza tipos de resultado.
src/lib/types.ts   Tipos del dominio compartidos.
src/lib/format.ts  Formateo y códigos de comprobantes. También `asNumber`.
src/lib/errors.ts  errorMessage() para mostrar errores al usuario.
migrations/        SQL de esquema y datos demo (solo hacia adelante).
scripts/           load-env, migrate, migration-plan (+ test), run.
```

Flujo: la ruta usa `useQuery`/`useMutation` → llama a una `createServerFn` de `api.ts` → esta valida con zod, exige sesión, consulta con `getSql()` y devuelve tipos de `types.ts`.

- **No crees capas de fetch paralelas** (nada de `fetch` manual a endpoints propios ni de librerías de datos nuevas).
- Los archivos `*.server.ts` no se importan desde código de cliente. Seguí el patrón de `auth.ts` (import dinámico dentro de `createServerOnlyFn`/handler).

## 6. Reglas de React y de datos en el cliente

- **Estado del servidor solo con TanStack Query.** Estado local de UI con `useState`.
- Claves de query existentes: `["dashboard"]`, `["clients"]`, `["articles"]`, `["hardware"]`, `["redemptions"]`, `["tickets"]`, `["operator-session"]`. Reutilizalas; si agregás una, seguí el mismo estilo (sustantivo plural en minúscula).
- **Después de cada mutación, invalidá todo lo que cambió.** Hoy:
  - Recepción → `dashboard`, `clients`, `tickets`.
  - Canje (crear o cambiar estado) → `redemptions`, `clients`, `articles`, `dashboard`, `tickets`.
  - Cliente → `clients`, `dashboard`. Artículo → `articles`, `dashboard`.
- Errores de mutaciones: mostrá `toast.error(errorMessage(error))`. Éxitos: `toast.success(...)` en español.
- Los componentes de `src/components/ui/` son primitivas sin lógica de negocio. La lógica de dominio va en `api.ts` o en la ruta.
- Antes de crear un componente, buscá si ya existe uno en `ui/` (badge, button, checkbox, dialog, input, label, select, sheet, textarea).
- Estilos: usá los tokens de diseño del proyecto (por ejemplo `bg-paper`, `text-muted`) definidos en `src/styles.css`. No inventes colores sueltos.
- Importá con el alias `@/` (apunta a `src/`).
- `src/routeTree.gen.ts` es **generado**: no lo edites a mano. Se commitea.

## 7. Base de datos

Tablas: `clients`, `hardware_types`, `articles`, `deliveries`, `redemptions`, `tickets` (más `_migrations`).

- **Migraciones solo hacia adelante.** `0002_bitcycle.sql` ya está aplicada en la base real: **no la edites**. Cualquier cambio de esquema va en un archivo nuevo (`0003_...sql`), idempotente cuando sea posible, y se aplica con `npm run db:migrate`.
- **Consultas siempre parametrizadas** con el tagged template de `getSql()` (`sql\`... ${valor}\``). Nunca concatenes strings con datos.
- PostgreSQL devuelve `numeric` como string: pasá siempre los valores por `asNumber()` al mapear.
- **No hay restricciones `CHECK` en la base** (por ejemplo saldo o stock no negativos). Esas invariantes las garantiza únicamente el código de `api.ts`. Por eso es obligatorio lo siguiente:
  - Toda operación que toque saldo, stock o genere tique va **dentro de `sql.transaction(...)`**.
  - Las filas que se leen para validar y luego modificar se bloquean con **`select ... for update`** (como ya hacen `registerDelivery`, `registerRedemption` y `updateRedemptionStatus`).
- Mapeá filas a tipos con las funciones `mapX` de `api.ts`; no devuelvas filas crudas al cliente.
- `DATABASE_URL` vacía o en blanco se interpreta como "no definida" y activa PGLite (datos en memoria). Si ves que los datos se pierden al reiniciar, revisá primero el `.env`.

## 8. Reglas de negocio (invariantes que no se rompen)

1. **Recepción:** `EKP = round(kg × hardware_types.ekp_per_kg)`. El peso debe ser positivo (máx. 5000 kg) y el resultado mayor a 0. Acredita EKP al cliente y crea un tique tipo `entrega`.
2. **Canje:** valida cliente activo, artículo activo, stock suficiente y saldo suficiente. Al crearse **descuenta EKP y stock inmediatamente**, queda en estado `pendiente` y crea un tique tipo `canje`.
3. **Estados de canje:** solo un canje `pendiente` puede pasar a `entregado` o `cancelado`. Cancelar **exige motivo**, **devuelve los EKP al cliente y el stock al artículo**. Un canje ya cerrado no se modifica.
4. Un **cliente inactivo** no puede acreditar ni canjear. `dni_cuit` es único.
5. El saldo de un cliente y el stock de un artículo **nunca quedan negativos**.
6. Los tiques se crean junto con la operación, en la misma transacción. No se editan ni se borran.
7. Las categorías de hardware (`hardware_types`) se leen desde la app; no hay pantalla para editarlas. Los cambios de tasas van por migración.

Si una tarea requiere cambiar estas reglas, **preguntá antes**: afectan dinero interno y stock físico.

## 9. Autenticación y seguridad

- La sesión es una **cookie sellada y HttpOnly** (`bitcycle-session`) gestionada en `auth.server.ts`. Las credenciales de los dos perfiles demo (`operador`, `admin`) vienen **solo de variables de entorno**; contraseñas de 12+ caracteres y secreto de sesión de 32+.
- **Toda `createServerFn` nueva debe llamar a `await requireOperator()` como primera acción del handler**, igual que las existentes. La redirección de `PlantShell` es solo comodidad de interfaz: la protección real está en el servidor.
- Hoy los roles `operador` y `admin` **tienen los mismos permisos**. Si agregás permisos por rol, hacelo en el servidor.
- Nunca escribas credenciales, secretos ni `DATABASE_URL` en el código, en tests, en logs ni en mensajes de error.
- **No commitees `.env`.** Solo `.env.example` (con valores ficticios) va al repositorio.
- Este acceso es válido para la demo; no es una solución de identidad para producción.

## 10. Archivos y carpetas que no se tocan

- `src/routeTree.gen.ts` (generado).
- `.output/`, `.vercel/`, `.tanstack/`, `dist/`, `node_modules/` (generados, ignorados por Git).
- `package-lock.json`: solo se modifica con `npm`, nunca a mano.
- `migrations/` ya aplicadas: no se editan.
- `.env`: no lo leas ni lo imprimas; no lo incluyas en diffs ni en respuestas.

## 11. Dependencias y despliegue

- No agregues dependencias sin consultar. Hay varias instaladas que **hoy no se importan** en `src/` (por ejemplo `zustand`, `react-hook-form`, `@hookform/resolvers`); no asumas que son la convención del proyecto.
- `vercel.json` instala con `npm install --omit=dev`. Antes de mover un paquete entre `dependencies` y `devDependencies`, verificá que el build en Vercel siga funcionando.
- En Vercel hay que cargar `DATABASE_URL`, las variables `BITCYCLE_*` y `VITE_SITE_URL`.

## 12. Pruebas

- Solo existe una prueba automatizada: `scripts/migration-plan.test.mjs` (runner de Node).
- No hay pruebas de componentes ni e2e configuradas. Si agregás lógica de negocio nueva (cálculo de EKP, estados de canje, validaciones), **agregá una prueba** o decí explícitamente por qué no.
- Si proponés incorporar un framework de pruebas, planteálo primero; no lo instales por tu cuenta.

## 13. Cómo trabajar

- Hacé cambios **pequeños y enfocados**; no refactorices fuera del alcance de la tarea.
- Seguí los patrones de los archivos vecinos antes de introducir uno nuevo.
- Ante ambigüedad en reglas de negocio, **preguntá**. En decisiones técnicas menores, elegí lo más simple y dejalo anotado en la respuesta.
- Al terminar, resumí qué cambiaste, qué verificaste y qué no pudiste verificar.

## 14. Deuda técnica conocida

Para que no se "arregle" sin acuerdo ni se tome como estándar:

- Roles `operador` y `admin` sin diferencias de permisos.
- Credenciales demo en variables de entorno (sin base de usuarios ni hash de contraseñas).
- Sin restricciones `CHECK` en la base; las invariantes dependen del código.
- `ticketCode` y `redemptionCode` usan por defecto el año `2026` fijo en `format.ts`.
- Cobertura de pruebas mínima (solo migraciones).
- Dependencias instaladas sin uso aparente.
- `npm run build` ejecuta migraciones en cada despliegue.