import { notFound } from "next/navigation";

import { updateExercise } from "@/app/actions";
import { ExerciseForm } from "@/components/exercise-form";
import { createClient } from "@/lib/supabase/server";
import { EXERCISE_COLUMNS, type Exercise } from "@/lib/types";

export default async function EditExercisePage({ params }: PageProps<"/exercises/[id]/bearbeiten">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: exercise } = await supabase
    .from("exercises")
    .select(EXERCISE_COLUMNS)
    .eq("id", id)
    .maybeSingle<Exercise>();
  if (!exercise) notFound();

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Übung bearbeiten</h1>
      <ExerciseForm
        action={updateExercise.bind(null, exercise.id)}
        exercise={exercise}
        cancelHref={`/exercises/${exercise.id}`}
      />
    </div>
  );
}
