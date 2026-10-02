"use client";

import { useEffect, type RefObject } from "react";

const QUESTION = "Deine ungespeicherten Eingaben gehen verloren. Trotzdem weiter?";

/**
 * Warnt, solange `dirty` gilt, vor jedem Link oder Knopf außerhalb des Formulars
 * (Speichern und Abbrechen liegen im Formular) und vor Neuladen oder Schließen des Tabs.
 */
export function useUnsavedGuard(form: RefObject<HTMLElement | null>, dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;

    function onClick(event: MouseEvent) {
      const target = (event.target as Element | null)?.closest("a[href], button");
      if (!target || form.current?.contains(target)) return;
      if (!window.confirm(QUESTION)) {
        event.preventDefault();
        event.stopPropagation();
      }
    }

    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }

    // Capture-Phase, damit die Abfrage vor dem Next-Link und vor Formular-Aktionen kommt.
    document.addEventListener("click", onClick, true);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [form, dirty]);
}
