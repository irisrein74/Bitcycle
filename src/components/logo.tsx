import { Recycle } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  iconClassName,
}: {
  className?: string;
  iconClassName?: string;
}) {
  return (
    <span
      className={cn(
        "grid size-10 place-items-center rounded-md bg-leaf text-elevated",
        className,
      )}
    >
      <Recycle className={cn("size-5", iconClassName)} strokeWidth={2.2} />
    </span>
  );
}

export function Wordmark({
  inverted = false,
  compact = false,
}: {
  inverted?: boolean;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <BrandMark
        className={inverted ? "bg-elevated/12 text-elevated" : undefined}
      />
      <div className="leading-tight">
        <div
          className={cn(
            "font-display text-lg font-semibold tracking-tight",
            inverted ? "text-elevated" : "text-ink",
          )}
        >
          BitCycle
        </div>
        {!compact && (
          <div
            className={cn(
              "text-[0.65rem] font-medium uppercase tracking-[0.16em]",
              inverted ? "text-elevated/70" : "text-muted",
            )}
          >
            The Green Ledger
          </div>
        )}
      </div>
    </div>
  );
}
