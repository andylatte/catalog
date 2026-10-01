import { Monitor, MonitorOff, Users } from "lucide-react";

import type { Exercise } from "@/lib/types";

/** Kleine Zeile mit Gruppengröße und Online-Eignung. */
export function ExerciseMeta({ exercise }: { exercise: Pick<Exercise, "group_size" | "online"> }) {
  if (!exercise.group_size && exercise.online === null) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
      {exercise.group_size && (
        <span className="inline-flex items-center gap-1.5">
          <Users className="size-4" />
          {exercise.group_size}
        </span>
      )}
      {exercise.online === true && (
        <span className="inline-flex items-center gap-1.5">
          <Monitor className="size-4" />
          online geeignet
        </span>
      )}
      {exercise.online === false && (
        <span className="inline-flex items-center gap-1.5">
          <MonitorOff className="size-4" />
          nur in Präsenz
        </span>
      )}
    </div>
  );
}
