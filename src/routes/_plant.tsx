import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PlantShell } from "@/components/plant-shell";

export const Route = createFileRoute("/_plant")({
  component: PlantLayout,
});

function PlantLayout() {
  return (
    <PlantShell>
      <Outlet />
    </PlantShell>
  );
}
