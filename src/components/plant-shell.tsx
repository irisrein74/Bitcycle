import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Gift,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Package,
  Recycle,
  Ticket,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Wordmark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { getCurrentOperator, signOut } from "@/lib/auth";
import type { OperatorSession } from "@/lib/types";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/panel", label: "Panel Principal", icon: LayoutDashboard },
  { to: "/recepcion", label: "Recepción RAEE", icon: Recycle },
  { to: "/canjes", label: "Canjes STEM", icon: Gift },
  { to: "/catalogo", label: "Catálogo & Stock", icon: Package },
  { to: "/clientes", label: "Clientes & Saldos", icon: Users },
  { to: "/tiques", label: "Tiques & Historial", icon: Ticket },
] as const;

function useOnline() {
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}

export function PlantShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [menuOpen, setMenuOpen] = useState(false);
  const online = useOnline();
  const operatorQuery = useQuery({
    queryKey: ["operator-session"],
    queryFn: () => getCurrentOperator(),
    retry: false,
  });
  const logoutMutation = useMutation({
    mutationFn: () => signOut(),
    onSuccess: () => {
      queryClient.setQueryData(["operator-session"], null);
      void navigate({ to: "/" });
    },
    onError: () => toast.error("No se pudo cerrar la sesión. Reintentá."),
  });

  useEffect(() => {
    if (!operatorQuery.isPending && !operatorQuery.isError && !operatorQuery.data) {
      void navigate({ to: "/" });
    }
  }, [navigate, operatorQuery.data, operatorQuery.isError, operatorQuery.isPending]);

  const session: OperatorSession | null = operatorQuery.data ?? null;

  if (operatorQuery.isPending || (!operatorQuery.isError && !session)) {
    return (
      <div className="grid min-h-dvh place-items-center bg-paper text-muted">
        <div className="flex flex-col items-center gap-3">
          <Wordmark />
          <p className="text-sm">Abriendo sesión de planta…</p>
        </div>
      </div>
    );
  }

  if (operatorQuery.isError) {
    return (
      <main className="grid min-h-dvh place-items-center bg-paper px-6 text-center text-danger">
        No se pudo validar la sesión. Revisá la configuración del servidor e intentá de nuevo.
      </main>
    );
  }
  if (!session) return null;

  const links = (
    <nav className="mt-4 flex flex-col gap-1">
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setMenuOpen(false)}
            className={cn(
              "flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors",
              active
                ? "bg-elevated/12 text-elevated"
                : "text-elevated/75 hover:bg-elevated/8 hover:text-elevated",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-dvh bg-paper">
      <header className="no-print sticky top-0 z-40 bg-forest text-elevated">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <Link to="/panel" className="shrink-0">
              <Wordmark inverted compact />
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 text-xs text-elevated/80 sm:flex">
              <span className="flex items-center gap-1">
                {online ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}
                {online ? "Planta en línea" : "Sin red"}
              </span>
              <span className="text-elevated/30">·</span>
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" />
                San José
              </span>
            </div>
            <div className="hidden text-right sm:block">
              <div className="text-xs font-medium leading-tight">{session.displayName}</div>
              <div className="text-[0.65rem] uppercase tracking-wider text-elevated/60">
                {session.role === "admin" ? "Administración" : "Ventanilla"}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-elevated hover:bg-elevated/10"
              onClick={() => logoutMutation.mutate()}
              aria-label="Cerrar sesión"
              disabled={logoutMutation.isPending}
            >
              <LogOut className="size-4" />
            </Button>
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-elevated hover:bg-elevated/10"
                  aria-label="Abrir menú"
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                className="!bg-forest !text-elevated border-elevated/10"
              >
                <SheetHeader>
                  <SheetTitle className="text-elevated">Navegación</SheetTitle>
                  <p className="mt-1 text-sm text-elevated/70">{session.displayName}</p>
                </SheetHeader>
                {links}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}

export function PageHeader({
  kicker,
  title,
  description,
  action,
}: {
  kicker?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {kicker && (
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.16em] text-muted">
            {kicker}
          </p>
        )}
        <h1 className="font-display text-3xl font-semibold text-ink">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Surface({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-line bg-elevated p-4 shadow-card sm:p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}