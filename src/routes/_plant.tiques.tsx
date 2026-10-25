import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Printer, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader, Surface } from "@/components/plant-shell";
import { TicketFace } from "@/components/ticket-card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { listTickets } from "@/lib/api";
import { formatDateTime, formatEkp, ticketCode } from "@/lib/format";
import type { TicketRecord } from "@/lib/types";

export const Route = createFileRoute("/_plant/tiques")({
  component: TiquesPage,
});

function TiquesPage() {
  const tickets = useQuery({ queryKey: ["tickets"], queryFn: () => listTickets() });
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<TicketRecord | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (tickets.data ?? []).filter((ticket) => {
      if (!q) return true;
      return [ticket.clientName, ticket.summary, ticketCode(ticket.id), ticket.operationType]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [tickets.data, query]);

  return (
    <div>
      <PageHeader
        title="Tiques digitales"
        description="Comprobantes de acreditación RAEE y canjes STEM. Se emiten solos al confirmar cada operación."
      />

      <Surface className="mb-4 p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            className="pl-10"
            placeholder="Buscar por cliente, código o detalle"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </Surface>

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.length === 0 && (
          <Surface className="md:col-span-2 py-12 text-center text-sm text-muted">
            No hay tiques para mostrar.
          </Surface>
        )}
        {filtered.map((ticket) => (
          <Surface key={ticket.id} className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs tabular-nums text-muted">{ticketCode(ticket.id)}</p>
                <p className="font-medium">{ticket.clientName}</p>
                <p className="text-sm text-muted">
                  {ticket.operationType === "entrega" ? "Acreditación RAEE" : "Canje premio STEM"}
                </p>
              </div>
              <p className="text-xs text-muted">{formatDateTime(ticket.createdAt)}</p>
            </div>
            <p className="text-sm">{ticket.summary}</p>
            <div className="flex items-center justify-between">
              <p className="font-display text-2xl font-semibold tabular-nums text-leaf-dark">
                {formatEkp(ticket.ekpAmount)}
              </p>
              <Button variant="forest" size="sm" onClick={() => setSelected(ticket)}>
                <Printer className="size-3.5" />
                Ver e imprimir
              </Button>
            </div>
          </Surface>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Comprobante</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="print-ticket">
              <TicketFace ticket={selected} />
            </div>
          )}
          <Button
            onClick={() => {
              window.print();
            }}
          >
            <Printer className="size-4" />
            Imprimir tique
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
