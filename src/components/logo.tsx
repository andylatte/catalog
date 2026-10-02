import { cn } from "@/lib/utils";

/** Wortmarke „modulo“: schwarz für die Übungen, Petrol-Punkt für die Sitzungen. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("font-semibold tracking-tighter lowercase", className)}>
      modulo
      <span className="theme-sessions text-primary">.</span>
    </span>
  );
}
