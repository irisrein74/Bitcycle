import { Recycle } from "lucide-react";
import { formatDateTime, formatEkp, ticketCode } from "@/lib/format";
import type { TicketRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TicketFace({
  ticket,
  className,
}: {
  ticket: TicketRecord;
  className?: string;
}) {
  const code = ticketCode(ticket.id);
  return (
    <article
      className={cn(
        "overflow-hidden rounded-lg border border-line bg-elevated text-ink",
        className,
      )}
    >
      <div className="flex items-center justify-between bg-forest px-4 py-3 text-elevated">
        <div className="flex items-center gap-2">
          <Recycle className="size-4" />
          <span className="font-display text-base font-semibold">BitCycle</span>
        </div>
        <span className="text-xs tabular-nums tracking-wide">{code}</span>
      </div>
      <div className="p-4">
        <dl className="grid gap-2 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted">Cliente</dt>
            <dd className="font-medium">{ticket.clientName}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted">Operación</dt>
            <dd>
              {ticket.operationType === "entrega" ? "Acreditación RAEE" : "Canje premio STEM"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted">Detalle</dt>
            <dd>{ticket.summary}</dd>
          </div>
          <div className="flex items-end justify-between gap-3">
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted">Monto</dt>
              <dd className="font-display text-2xl font-semibold tabular-nums text-leaf-dark">
                {formatEkp(ticket.ekpAmount)}
              </dd>
            </div>
            <p className="text-xs text-muted">{formatDateTime(ticket.createdAt)}</p>
          </div>
        </dl>
      </div>
      <p className="border-t border-line px-4 py-2 text-[0.7rem] text-muted">
        Planta San José · Santa María, Catamarca · Comprobante interno no fiscal
      </p>
    </article>
  );
}
