import type { Metadata } from "next";

import { createExercise } from "@/app/actions";
import { ExerciseForm } from "@/components/exercise-form";

export const metadata: Metadata = { title: "Neue Übung · Übungskatalog" };

export default function NewExercisePage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Neue Übung</h1>
      <ExerciseForm action={createExercise} cancelHref="/catalog" />
    </div>
  );
}
