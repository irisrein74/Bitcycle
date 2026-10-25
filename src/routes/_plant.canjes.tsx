import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Plus, X } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  listArticles,
  listClients,
  listRedemptions,
  registerRedemption,
  updateRedemptionStatus,
} from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { formatDateTime, formatEkp, redemptionCode } from "@/lib/format";
import type { RedemptionRecord } from "@/lib/types";

export const Route = createFileRoute("/_plant/canjes")({
  component: CanjesPage,
});

function CanjesPage() {
  const queryClient = useQueryClient();
  const redemptions = useQuery({ queryKey: ["redemptions"], queryFn: () => listRedemptions() });
  const clients = useQuery({ queryKey: ["clients"], queryFn: () => listClients() });
  const articles = useQuery({ queryKey: ["articles"], queryFn: () => listArticles() });

  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [articleId, setArticleId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [cancelTarget, setCancelTarget] = useState<RedemptionRecord | null>(null);
  const [reason, setReason] = useState("");

  const selectedClient = clients.data?.find((c) => String(c.id) === clientId);
  const selectedArticle = articles.data?.find((a) => String(a.id) === articleId);
  const qty = Math.max(1, parseInt(quantity, 10) || 1);
  const total = (selectedArticle?.costEkp ?? 0) * qty;
  const canAfford = (selectedClient?.ekopuntos ?? 0) >= total;
  const inStock = (selectedArticle?.stock ?? 0) >= qty;

  const availableArticles = (articles.data ?? []).filter((a) => a.active && a.stock > 0);
  const activeClients = (clients.data ?? []).filter((c) => c.status === "activo");

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["redemptions"] });
    void queryClient.invalidateQueries({ queryKey: ["clients"] });
    void queryClient.invalidateQueries({ queryKey: ["articles"] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    void queryClient.invalidateQueries({ queryKey: ["tickets"] });
  }

  const createMutation = useMutation({
    mutationFn: () =>
      registerRedemption({
        data: { clientId: Number(clientId), articleId: Number(articleId), quantity: qty },
      }),
    onSuccess: () => {
      toast.success("Canje registrado. Queda pendiente de entrega.");
      setOpen(false);
      setArticleId("");
      setQuantity("1");
      invalidate();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const statusMutation = useMutation({
    mutationFn: (input: { id: number; status: "entregado" | "cancelado"; cancelReason?: string }) =>
      updateRedemptionStatus({ data: input }),
    onSuccess: (_, vars) => {
      toast.success(vars.status === "entregado" ? "Marcado como entregado." : "Canje cancelado. Se reintegraron puntos y stock.");
      setCancelTarget(null);
      setReason("");
      invalidate();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const rows = redemptions.data ?? [];
  const pending = useMemo(() => rows.filter((r) => r.status === "pendiente").length, [rows]);

  return (
    <div>
      <PageHeader
        title="Canjes STEM"
        description="Canjeá EkoPuntos por kits, sensores y actuadores. El stock se descuenta al confirmar."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Nuevo canje
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Surface className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted">Pendientes</p>
          <p className="font-display text-3xl font-semibold tabular-nums">{pending}</p>
        </Surface>
        <Surface className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted">Operaciones</p>
          <p className="font-display text-3xl font-semibold tabular-nums">{rows.length}</p>
        </Surface>
        <Surface className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted">Entregados</p>
          <p className="font-display text-3xl font-semibold tabular-nums">
            {rows.filter((r) => r.status === "entregado").length}
          </p>
        </Surface>
      </div>

      <Surface className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="bg-mist text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Artículo</th>
                <th className="px-4 py-3 font-medium">Cant.</th>
                <th className="px-4 py-3 font-medium">EKP</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted">
                    Todavía no hay canjes. Registrá el primero desde el botón superior.
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-line">
                  <td className="px-4 py-3 tabular-nums">{redemptionCode(row.id)}</td>
                  <td className="px-4 py-3 text-muted">{formatDateTime(row.createdAt)}</td>
                  <td className="px-4 py-3">{row.clientName}</td>
                  <td className="px-4 py-3">{row.articleDescription}</td>
                  <td className="px-4 py-3 tabular-nums">{row.quantity}</td>
                  <td className="px-4 py-3 tabular-nums">{formatEkp(row.ekpTotal)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3">
                    {row.status === "pendiente" ? (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            statusMutation.mutate({ id: row.id, status: "entregado" })
                          }
                        >
                          <Check className="size-3.5" />
                          Entregar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setCancelTarget(row);
                            setReason("");
                          }}
                        >
                          <X className="size-3.5" />
                          Anular
                        </Button>
                      </div>
                    ) : row.cancelReason ? (
                      <span className="text-xs text-muted">{row.cancelReason}</span>
                    ) : (
                      <span className="text-xs text-muted">—</span>
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
            <DialogTitle>Registrar canje STEM</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Cliente / escuela</Label>
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
            </div>
            <div className="space-y-1.5">
              <Label>Premio / artículo STEM</Label>
              <Select value={articleId || undefined} onValueChange={setArticleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar premio del catálogo" />
                </SelectTrigger>
                <SelectContent>
                  {availableArticles.map((article) => (
                    <SelectItem key={article.id} value={String(article.id)}>
                      {article.description} · {formatEkp(article.costEkp)} · stock {article.stock}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qty">Cantidad</Label>
              <Input
                id="qty"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            {selectedArticle && selectedClient && (
              <div className="rounded-md bg-mist px-3 py-3 text-sm">
                <p>
                  Costo: <strong>{formatEkp(total)}</strong>
                </p>
                <p className={canAfford ? "text-muted" : "text-danger"}>
                  Saldo: {formatEkp(selectedClient.ekopuntos)}
                  {canAfford ? ` · queda ${formatEkp(selectedClient.ekopuntos - total)}` : " · insuficiente"}
                </p>
                {!inStock && <p className="text-danger">Stock insuficiente.</p>}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!clientId || !articleId || !canAfford || !inStock || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              Confirmar canje
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!cancelTarget} onOpenChange={(openState) => !openState && setCancelTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar canje</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted">
            Se reintegrarán los EkoPuntos y el stock. Indicá el motivo para la auditoría.
          </p>
          <Textarea
            placeholder="Motivo de cancelación"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="secondary" onClick={() => setCancelTarget(null)}>
              Volver
            </Button>
            <Button
              variant="destructive"
              disabled={!reason.trim() || statusMutation.isPending}
              onClick={() => {
                if (!cancelTarget) return;
                statusMutation.mutate({
                  id: cancelTarget.id,
                  status: "cancelado",
                  cancelReason: reason.trim(),
                });
              }}
            >
              Confirmar anulación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: RedemptionRecord["status"] }) {
  if (status === "entregado") return <Badge variant="leaf">Entregado</Badge>;
  if (status === "cancelado") return <Badge variant="danger">Cancelado</Badge>;
  return <Badge variant="warn">Pendiente</Badge>;
}
