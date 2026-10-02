import Link from "next/link";
import { BookOpen, LogOut, NotebookPen } from "lucide-react";

import { signOut } from "@/app/actions";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function StartPage() {
  return (
    <>
      <header className="mx-auto flex h-14 w-full max-w-3xl items-center justify-end px-4">
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="icon" aria-label="Abmelden">
            <LogOut />
          </Button>
        </form>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-12 px-4 pb-24">
        <h1>
          <Logo className="text-6xl sm:text-7xl" />
        </h1>
        <nav aria-label="Bereiche" className="grid w-full max-w-md grid-cols-2 gap-3">
          <div className="theme-sessions">
            <Button asChild size="lg" className="h-20 w-full flex-col gap-1.5 px-2 text-base sm:h-14 sm:flex-row sm:gap-2">
              <Link href="/sessions">
                <NotebookPen />
                Sitzungen
              </Link>
            </Button>
          </div>
          <Button asChild size="lg" className="h-20 w-full flex-col gap-1.5 px-2 text-base sm:h-14 sm:flex-row sm:gap-2">
            <Link href="/exercises">
              <BookOpen />
              Übungssammlung
            </Link>
          </Button>
        </nav>
      </main>
    </>
  );
}
