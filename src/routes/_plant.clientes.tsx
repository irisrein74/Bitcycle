import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader, Surface } from "@/components/plant-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient, listClients, setClientStatus } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { clientCode, formatEkp } from "@/lib/format";
import type { ClientType } from "@/lib/types";

export const Route = createFileRoute("/_plant/clientes")({
  component: ClientesPage,
});

function ClientesPage() {
  const queryClient = useQueryClient();
  const clients = useQuery({ queryKey: ["clients"], queryFn: () => listClients() });
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [dniCuit, setDniCuit] = useState("");
  const [clientType, setClientType] = useState<ClientType>("escuela");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (clients.data ?? []).filter((client) => {
      if (!q) return true;
      return [client.name, client.dniCuit, client.phone, client.address]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [clients.data, query]);

  const createMutation = useMutation({
    mutationFn: () =>
      createClient({
        data: { name, dniCuit, clientType, phone, address, email },
      }),
    onSuccess: () => {
      toast.success("Cliente registrado.");
      setOpen(false);
      setName("");
      setDniCuit("");
      setPhone("");
      setAddress("");
      setEmail("");
      void queryClient.invalidateQueries({ queryKey: ["clients"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const statusMutation = useMutation({
    mutationFn: (input: { id: number; status: "activo" | "inactivo" }) =>
      setClientStatus({ data: input }),
    onSuccess: (client) => {
      toast.success(
        client.status === "activo" ? "Cliente reactivado." : "Cliente dado de baja.",
      );
      void queryClient.invalidateQueries({ queryKey: ["clients"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <div>
      <PageHeader
        title="Clientes y saldos"
        description="Cuentas de escuelas técnicas y vecinos. El saldo de EkoPuntos se muestra con total transparencia."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Registrar cliente
          </Button>
        }
      />

      <Surface className="mb-4 p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            className="pl-10"
            placeholder="Buscar por nombre, CUIT, teléfono o dirección"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </Surface>

      <Surface className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead className="bg-mist text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Cliente / Institución</th>
                <th className="px-4 py-3 font-medium">DNI / CUIT</th>
                <th className="px-4 py-3 font-medium">Teléfono y dirección</th>
                <th className="px-4 py-3 font-medium">Saldo EkoPuntos</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted">
                    No hay clientes con ese criterio.
                  </td>
                </tr>
              )}
              {filtered.map((client) => (
                <tr key={client.id} className="border-t border-line">
                  <td className="px-4 py-3 tabular-nums text-muted">{clientCode(client.id)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{client.name}</p>
                    <p className="text-xs text-muted">
                      {client.clientType === "escuela" ? "Escuela técnica" : "Particular / vecino"}
                    </p>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{client.dniCuit}</td>
                  <td className="px-4 py-3">
                    <p>{client.phone || "—"}</p>
                    <p className="text-xs text-muted">{client.address || "Sin dirección"}</p>
                  </td>
                  <td className="px-4 py-3 font-medium tabular-nums text-leaf-dark">
                    {formatEkp(client.ekopuntos)}
                  </td>
                  <td className="px-4 py-3">
                    {client.status === "activo" ? (
                      <Badge variant="leaf">Activo</Badge>
                    ) : (
                      <Badge variant="outline">Inactivo</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {client.status === "activo" ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-danger"
                        onClick={() => statusMutation.mutate({ id: client.id, status: "inactivo" })}
                      >
                        Dar de baja
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => statusMutation.mutate({ id: client.id, status: "activo" })}
                      >
                        Reactivar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Surface>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar nuevo cliente / escuela</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="razon">Nombre / razón social</Label>
              <Input
                id="razon"
                placeholder="Ej. Escuela Técnica N°1"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cuit">DNI / CUIT</Label>
                <Input
                  id="cuit"
                  placeholder="30-12345678-9"
                  value={dniCuit}
                  onChange={(e) => setDniCuit(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo de cliente</Label>
                <Select
                  value={clientType}
                  onValueChange={(value) => setClientType(value as ClientType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="escuela">Escuela técnica</SelectItem>
                    <SelectItem value="particular">Particular / vecino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="tel">Teléfono</Label>
                <Input
                  id="tel"
                  placeholder="3838400000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dir">Dirección</Label>
                <Input
                  id="dir"
                  placeholder="Av. Principal San José"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mail">Correo (opcional)</Label>
              <Input
                id="mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={name.trim().length < 3 || dniCuit.trim().length < 7 || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              Guardar cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
