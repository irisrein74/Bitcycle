import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  FlaskConical,
  Gift,
  Package,
  Recycle,
  Scale,
  Ticket,
  Users,
} from "lucide-react";
import { PageHeader, Surface } from "@/components/plant-shell";
import { getDashboard } from "@/lib/api";
import { formatDateTime, formatEkp, formatGrams, formatKg, ticketCode } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_plant/panel")({
  component: PanelPage,
});

function PanelPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => getDashboard(),
  });

  return (
    <div>
      <PageHeader
        title="Panel principal"
        description="Vista consolidada de acopio RAEE, EkoPuntos y canjes STEM de la planta San José."
      />

      {error && (
        <p className="mb-4 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          No se pudo cargar el tablero. Reintentá en unos segundos.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="RAEE reciclado"
          value={data ? formatKg(data.totalKg) : "—"}
          hint="Peso acopiado en planta"
          icon={Scale}
        />
        <Kpi
          label="EkoPuntos emitidos"
          value={data ? formatEkp(data.totalEkpIssued) : "—"}
          hint="Acreditados automáticamente"
          icon={Recycle}
        />
        <Kpi
          label="Canjes pendientes"
          value={data ? String(data.pendingRedemptions) : "—"}
          hint="Retiro en ventanilla"
          icon={Gift}
        />
        <Kpi
          label="Clientes activos"
          value={data ? String(data.activeClients) : "—"}
          hint="Escuelas y vecinos"
          icon={Users}
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <Surface className="lg:col-span-2">
          <h2 className="mb-3 font-display text-lg font-semibold">Accesos rápidos</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Quick
              to="/recepcion"
              title="Recepción y acopio"
              copy="Registrar hardware obsoleto, pesaje y acreditación inmediata de EKP."
              icon={Recycle}
            />
            <Quick
              to="/canjes"
              title="Procesar canjes STEM"
              copy="Entregar kits y sensores, marcar retiro o cancelar con motivo."
              icon={Gift}
            />
            <Quick
              to="/catalogo"
              title="Inventario de premios"
              copy="Alta de artículos, costos en EKP y baja de productos discontinuados."
              icon={Package}
            />
            <Quick
              to="/clientes"
              title="Clientes y saldos"
              copy="Escuelas técnicas, vecinos y consulta transparente de EkoPuntos."
              icon={Users}
            />
          </div>
        </Surface>

        <Surface>
          <div className="mb-3 flex items-center gap-2">
            <FlaskConical className="size-4 text-leaf" />
            <h2 className="font-display text-lg font-semibold">Metales críticos</h2>
          </div>
          <p className="mb-4 text-sm text-muted">
            Estimación contable previa al despacho a fundiciones especializadas.
          </p>
          <ul className="space-y-3">
            <Metal name="Cobre" value={data ? formatKg(data.copperKg) : "—"} />
            <Metal name="Silicio" value={data ? formatKg(data.siliconKg) : "—"} />
            <Metal name="Oro" value={data ? formatGrams(data.goldG) : "—"} />
          </ul>
          <p className="mt-4 text-xs text-muted">
            {data
              ? `${data.stemUnitsDelivered} componentes STEM ya entregados a escuelas.`
              : isLoading
                ? "Calculando inventario…"
                : ""}
          </p>
        </Surface>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <Surface>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Últimas recepciones</h2>
            <Link to="/recepcion" className="text-sm font-medium text-leaf-dark">
              Ir a ventanilla
            </Link>
          </div>
          <div className="space-y-3">
            {(data?.recentDeliveries ?? []).length === 0 && (
              <p className="text-sm text-muted">Todavía no hay ingresos registrados.</p>
            )}
            {data?.recentDeliveries.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 border-b border-line pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium">{item.clientName}</p>
                  <p className="text-xs text-muted">
                    {item.hardwareName} · {formatKg(item.weightKg)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium tabular-nums text-leaf-dark">
                    {formatEkp(item.ekpGenerated)}
                  </p>
                  <p className="text-xs text-muted">{formatDateTime(item.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </Surface>
        <Surface>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Tiques recientes</h2>
            <Link to="/tiques" className="inline-flex items-center gap-1 text-sm font-medium text-leaf-dark">
              <Ticket className="size-3.5" />
              Ver todos
            </Link>
          </div>
          <div className="space-y-3">
            {(data?.recentTickets ?? []).length === 0 && (
              <p className="text-sm text-muted">Los comprobantes aparecerán al registrar operaciones.</p>
            )}
            {data?.recentTickets.map((ticket) => (
              <div key={ticket.id} className="flex items-start justify-between gap-3 border-b border-line pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="text-xs tabular-nums text-muted">{ticketCode(ticket.id)}</p>
                  <p className="text-sm font-medium">{ticket.summary}</p>
                </div>
                <p className="text-sm font-medium tabular-nums">{formatEkp(ticket.ekpAmount)}</p>
              </div>
            ))}
          </div>
        </Surface>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Scale;
}) {
  return (
    <Surface className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">{label}</p>
        <Icon className="size-4 text-leaf" />
      </div>
      <p className="font-display text-3xl font-semibold tabular-nums tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </Surface>
  );
}

function Quick({
  to,
  title,
  copy,
  icon: Icon,
}: {
  to: "/recepcion" | "/canjes" | "/catalogo" | "/clientes";
  title: string;
  copy: string;
  icon: typeof Recycle;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "group flex gap-3 rounded-lg border border-line bg-paper p-4 transition-colors hover:border-leaf/40 hover:bg-mist",
      )}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-md bg-leaf/12 text-leaf-dark">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="flex items-center justify-between gap-2">
          <span className="font-medium">{title}</span>
          <ArrowRight className="size-4 text-muted transition-transform group-hover:translate-x-0.5" />
        </span>
        <span className="mt-1 block text-sm text-muted">{copy}</span>
      </span>
    </Link>
  );
}

function Metal({ name, value }: { name: string; value: string }) {
  return (
    <li className="flex items-center justify-between border-b border-line pb-2 last:border-0 last:pb-0">
      <span className="text-sm">{name}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </li>
  );
}
