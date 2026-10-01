import Link from "next/link";
import { BookOpen, LogOut, Plus } from "lucide-react";

import { signOut } from "@/app/actions";
import { Button } from "@/components/ui/button";

export default function SessionsLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="theme-sessions flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-t-2 border-b border-t-primary bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-4 px-4">
          <Link href="/sessions" className="font-semibold tracking-tight text-primary">
            Sitzungsdoku
          </Link>
          <div className="flex items-center gap-1">
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
              <Link href="/">
                <BookOpen />
                <span className="hidden sm:inline">Übungskatalog</span>
                <span className="sr-only sm:hidden">Übungskatalog</span>
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/sessions/neu">
                <Plus />
                <span className="hidden sm:inline">Neue Sitzung</span>
                <span className="sr-only sm:hidden">Neue Sitzung</span>
              </Link>
            </Button>
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="icon" aria-label="Abmelden">
                <LogOut />
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:py-10">{children}</main>
    </div>
  );
}
