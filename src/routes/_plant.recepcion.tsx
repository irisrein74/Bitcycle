import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader, Surface } from "@/components/plant-shell";
import { TicketFace } from "@/components/ticket-card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { listClients, listHardwareTypes, registerDelivery } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { formatEkp, formatKg } from "@/lib/format";
import type { ClientRecord, TicketRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_plant/recepcion")({
  component: RecepcionPage,
});

function RecepcionPage() {
  const queryClient = useQueryClient();
  const clients = useQuery({ queryKey: ["clients"], queryFn: () => listClients() });
  const hardware = useQuery({ queryKey: ["hardware"], queryFn: () => listHardwareTypes() });

  const [clientId, setClientId] = useState("");
  const [hardwareId, setHardwareId] = useState("");
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [ticket, setTicket] = useState<TicketRecord | null>(null);

  const selectedHardware = hardware.data?.find((item) => String(item.id) === hardwareId);
  const selectedClient = clients.data?.find((item) => String(item.id) === clientId);
  const weightNum = parseFloat(weight.replace(",", "."));
  const ekp = useMemo(() => {
    if (!selectedHardware || !Number.isFinite(weightNum) || weightNum <= 0) return 0;
    return Math.round(weightNum * selectedHardware.ekpPerKg);
  }, [selectedHardware, weightNum]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    void queryClient.invalidateQueries({ queryKey: ["clients"] });
    void queryClient.invalidateQueries({ queryKey: ["tickets"] });
  };

  const mutation = useMutation({
    mutationFn: () =>
      registerDelivery({
        data: {
          clientId: Number(clientId),
          hardwareTypeId: Number(hardwareId),
          weightKg: weightNum,
          notes,
        },
      }),
    onSuccess: (result) => {
      toast.success(`Se acreditaron ${formatEkp(result.ekp)}`);
      setTicket(result.ticket);
      setWeight("");
      setNotes("");
      queryClient.setQueryData<ClientRecord[]>(["clients"], (current) =>
        (current ?? []).map((client) =>
          client.id === Number(clientId)
            ? { ...client, ekopuntos: client.ekopuntos + result.ekp }
            : client,
        ),
      );
      invalidate();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const activeClients = (clients.data ?? []).filter((c) => c.status === "activo");

  return (
    <div>
      <PageHeader
        title="Recepción de RAEE"
        description="Pesaje asistido y cálculo automático de EkoPuntos. Pensado para pocos clics en mostrador."
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Surface>
          <ol className="grid gap-4">
            <li className="space-y-1.5">
              <Label>1. Cliente o escuela beneficiaria</Label>
              <Select value={clientId || undefined} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar escuela o particular" />
                </SelectTrigger>
                <SelectContent>
                  {activeClients.map((client) => (
                    <SelectItem key={client.id} value={String(client.id)}>
                      {client.name} · {formatEkp(client.ekopuntos)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </li>
            <li className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>2. Categoría de hardware</Label>
                <Select value={hardwareId || undefined} onValueChange={setHardwareId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo de RAEE" />
                  </SelectTrigger>
                  <SelectContent>
                    {(hardware.data ?? []).map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="peso">3. Peso de balanza (kg)</Label>
                <div className="relative">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
                  >
                    <path d="M12 3v18M5 7h14M7 7l-4 7h8L7 7Zm10 0-4 7h8l-4-7ZM8 21h8" />
                  </svg>
                  <Input
                    id="peso"
                    inputMode="decimal"
                    placeholder="0.0"
                    className="pl-10"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>
              </div>
            </li>
            <li>
              <div className="flex items-center justify-between rounded-lg bg-mist px-4 py-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted">Puntaje calculado</p>
                  <p className="text-sm text-muted">
                    {selectedHardware
                      ? `${selectedHardware.ekpPerKg} EKP / kg`
                      : "Elegí categoría y peso"}
                  </p>
                </div>
                <p className="font-display text-4xl font-semibold tabular-nums text-leaf-dark">
                  {ekp}
                  <span className="ml-1 text-base font-medium">EKP</span>
                </p>
              </div>
            </li>
            <li className="space-y-1.5">
              <Label htmlFor="notas">Observaciones (opcional)</Label>
              <Textarea
                id="notas"
                placeholder="Ej. Lote de 11 gabinetes del laboratorio"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </li>
          </ol>
          <Button
            className="mt-5 w-full"
            size="lg"
            disabled={!clientId || !hardwareId || ekp <= 0 || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Acreditando…" : "Confirmar entrega y acreditar EkoPuntos"}
          </Button>
          {selectedClient && (
            <p className="mt-3 text-center text-sm text-muted">
              Saldo actual de {selectedClient.name}: {formatEkp(selectedClient.ekopuntos)}
            </p>
          )}
        </Surface>

        <Surface className="h-fit">
          <h2 className="mb-3 font-display text-lg font-semibold">Tabla de valorización</h2>
          <ul className="space-y-2">
            {(hardware.data ?? []).map((item) => {
              const active = String(item.id) === hardwareId;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setHardwareId(String(item.id))}
                    className={cn(
                      "flex w-full items-start justify-between gap-2 rounded-md border px-3 py-2.5 text-left text-sm transition-colors",
                      active ? "border-leaf bg-mist" : "border-line hover:bg-paper",
                    )}
                  >
                    <span>
                      <span className="block font-medium">{item.name}</span>
                      <span className="text-xs text-muted">{item.description}</span>
                    </span>
                    <span className="shrink-0 font-medium tabular-nums text-leaf-dark">
                      {item.ekpPerKg} EKP/kg
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-xs text-muted">
            Los EkoPuntos se generan en el servidor. El operador no calcula a mano.
          </p>
        </Surface>
      </div>

      <Dialog open={!!ticket} onOpenChange={(open) => !open && setTicket(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tique digital emitido</DialogTitle>
          </DialogHeader>
          {ticket && <TicketFace ticket={ticket} />}
          {ticket && selectedClient && (
            <p className="text-sm text-muted">
              Nuevo saldo estimado: {formatEkp(selectedClient.ekopuntos + ticket.ekpAmount)}
              {Number.isFinite(weightNum) ? ` · ${formatKg(weightNum)} acopiados` : ""}
            </p>
          )}
          <Button variant="secondary" onClick={() => setTicket(null)}>
            Cerrar y continuar
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
