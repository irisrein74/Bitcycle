import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
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
import {
  createArticle,
  listArticles,
  setArticleActive,
  updateArticleCost,
} from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { articleCode, formatEkp } from "@/lib/format";
import type { ArticleRecord } from "@/lib/types";

export const Route = createFileRoute("/_plant/catalogo")({
  component: CatalogoPage,
});

function CatalogoPage() {
  const queryClient = useQueryClient();
  const articles = useQuery({ queryKey: ["articles"], queryFn: () => listArticles() });
  const [createOpen, setCreateOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Kits Robótica");
  const [cost, setCost] = useState("");
  const [stock, setStock] = useState("");
  const [editing, setEditing] = useState<ArticleRecord | null>(null);
  const [newCost, setNewCost] = useState("");

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["articles"] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }

  const createMutation = useMutation({
    mutationFn: () =>
      createArticle({
        data: {
          description,
          category,
          costEkp: Number(cost),
          stock: Number(stock),
        },
      }),
    onSuccess: () => {
      toast.success("Artículo agregado al catálogo.");
      setCreateOpen(false);
      setDescription("");
      setCost("");
      setStock("");
      invalidate();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const costMutation = useMutation({
    mutationFn: () =>
      updateArticleCost({
        data: { id: editing!.id, costEkp: Number(newCost) },
      }),
    onSuccess: () => {
      toast.success("Costo actualizado.");
      setEditing(null);
      invalidate();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const activeMutation = useMutation({
    mutationFn: (input: { id: number; active: boolean }) => setArticleActive({ data: input }),
    onSuccess: (article) => {
      toast.success(article.active ? "Artículo reactivado." : "Artículo discontinuado.");
      invalidate();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const list = articles.data ?? [];
  const available = list.filter((a) => a.active).length;

  return (
    <div>
      <PageHeader
        title="Catálogo y stock"
        description="Kits de robótica, sensores y actuadores del depósito de San José. Actualizá costos sin tocar el resto del inventario."
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Agregar artículo
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Surface className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted">Ítems activos</p>
          <p className="font-display text-3xl font-semibold tabular-nums">{available}</p>
        </Surface>
        <Surface className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted">Unidades en depósito</p>
          <p className="font-display text-3xl font-semibold tabular-nums">
            {list.filter((a) => a.active).reduce((sum, a) => sum + a.stock, 0)}
          </p>
        </Surface>
        <Surface className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted">Discontinuados</p>
          <p className="font-display text-3xl font-semibold tabular-nums">
            {list.filter((a) => !a.active).length}
          </p>
        </Surface>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {list.map((article) => (
          <Surface key={article.id} className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge>{article.category}</Badge>
                  <Badge variant={article.active ? "leaf" : "outline"}>
                    {article.active ? "Disponible" : "Discontinuado"}
                  </Badge>
                </div>
                <h2 className="font-display text-xl font-semibold leading-tight">
                  {article.description}
                </h2>
                <p className="mt-1 text-xs tabular-nums text-muted">
                  ID producto: {articleCode(article.id)}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md bg-mist px-3 py-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted">Costo canje</p>
                <p className="font-display text-3xl font-semibold tabular-nums text-leaf-dark">
                  {formatEkp(article.costEkp)}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setEditing(article);
                  setNewCost(String(article.costEkp));
                }}
              >
                <Pencil className="size-3.5" />
                Editar costo
              </Button>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm">
                Stock actual:{" "}
                <strong className="tabular-nums">{article.stock} unidades</strong>
              </p>
              <Button
                variant="ghost"
                size="sm"
                className={article.active ? "text-danger" : "text-leaf-dark"}
                onClick={() =>
                  activeMutation.mutate({ id: article.id, active: !article.active })
                }
              >
                {article.active ? "Discontinuar" : "Reactivar"}
              </Button>
            </div>
          </Surface>
        ))}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar artículo STEM</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="desc">Descripción</Label>
              <Input
                id="desc"
                placeholder="Ej. Kit Arduino Uno R3 con sensores"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="cat">Categoría</Label>
                <Input
                  id="cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cost">Costo EKP</Label>
                <Input
                  id="cost"
                  inputMode="numeric"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="stock">Stock inicial</Label>
                <Input
                  id="stock"
                  inputMode="numeric"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!description.trim() || Number(cost) <= 0 || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              Guardar artículo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modificar costo EKP</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted">{editing?.description}</p>
          <div className="space-y-1.5">
            <Label htmlFor="newcost">Nuevo costo en EkoPuntos</Label>
            <Input
              id="newcost"
              inputMode="numeric"
              value={newCost}
              onChange={(e) => setNewCost(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button
              disabled={Number(newCost) <= 0 || costMutation.isPending}
              onClick={() => costMutation.mutate()}
            >
              Actualizar costo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
