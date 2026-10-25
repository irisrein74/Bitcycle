import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Lock, MapPin, Recycle, UserRound, Wifi } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { BrandMark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrentOperator, signIn } from "@/lib/auth";

export const Route = createFileRoute("/")({ component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const currentOperator = useQuery({
    queryKey: ["operator-session"],
    queryFn: () => getCurrentOperator(),
    retry: false,
  });

  useEffect(() => {
    if (currentOperator.data) {
      void navigate({ to: "/panel" });
    }
  }, [currentOperator.data, navigate]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const operator = await signIn({ data: { username, password, remembered: remember } });
      if (!operator) {
        setError("Usuario o contraseña incorrectos.");
        return;
      }
      await currentOperator.refetch();
      void navigate({ to: "/panel" });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo iniciar sesión. Revisá la configuración.",
      );
    }
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-forest-deep text-elevated">
      <ValleyBackdrop />
      <main className="relative z-10 mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
        <form
          onSubmit={onSubmit}
          className="rounded-xl border border-elevated/10 bg-elevated p-6 text-ink shadow-card sm:p-8"
        >
          <div className="mb-6 flex flex-col items-center text-center">
            <BrandMark className="mb-4 size-14 rounded-lg bg-leaf text-elevated" iconClassName="size-7" />
            <h1 className="font-display text-3xl font-semibold tracking-tight">BitCycle</h1>
            <p className="mt-1 text-sm text-muted">
              Planta de Reciclaje RAEE y Gestión STEM
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">Usuario operador</Label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <Input
                  id="username"
                  autoComplete="username"
                  className="pl-10"
                  placeholder="Ingresá tu usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className="pl-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm text-muted">
                <Checkbox
                  checked={remember}
                  onCheckedChange={(value) => setRemember(value === true)}
                />
                Mantener sesión por 8 horas
              </label>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-leaf-dark">
                <Wifi className="size-3.5" />
                Planta en línea
              </span>
            </div>

            {error && (
              <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
            )}

            <Button type="submit" size="lg" className="w-full">
              Iniciar sesión operativa
            </Button>
          </div>
        </form>
        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-elevated/70">
          <MapPin className="size-3.5" />
          San José, Santa María, Catamarca · Reciclaje responsable de RAEE
        </p>
        <p className="mt-2 flex items-center justify-center gap-1 text-center text-[0.7rem] text-elevated/50">
          <Recycle className="size-3" />
          EkoPuntos · Educación STEM · Metales críticos
        </p>
      </main>
    </div>
  );
}

function ValleyBackdrop() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1200 900"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden
    >
      <rect width="1200" height="900" fill="#0b221c" />
      <circle cx="980" cy="120" r="220" fill="#12352c" />
      <circle cx="180" cy="80" r="160" fill="#12352c" opacity="0.7" />
      <path d="M0 540 C180 480 280 620 460 560 C640 500 720 640 900 580 C1040 530 1120 600 1200 560 L1200 900 L0 900 Z" fill="#12352c" />
      <path d="M0 620 C220 580 340 700 520 650 C700 600 790 720 980 660 C1100 624 1160 680 1200 650 L1200 900 L0 900 Z" fill="#0f2c24" />
      <path d="M0 730 C160 700 300 780 480 750 C680 714 760 810 980 770 C1100 748 1160 790 1200 770 L1200 900 L0 900 Z" fill="#0c241e" />
      <g opacity="0.18" stroke="#e4eee8" strokeWidth="1" fill="none">
        <path d="M80 200 h40 m-20 -20 v40 M200 260 h28 m-14 -14 v28" />
        <path d="M1040 260 h36 m-18 -18 v36 M900 180 h24 m-12 -12 v24" />
        <circle cx="100" cy="220" r="3" fill="#e4eee8" />
        <circle cx="214" cy="260" r="3" fill="#e4eee8" />
        <circle cx="1058" cy="260" r="3" fill="#e4eee8" />
      </g>
    </svg>
  );
}
