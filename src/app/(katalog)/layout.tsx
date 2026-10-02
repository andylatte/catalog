import Link from "next/link";
import { LogOut, NotebookPen, Plus } from "lucide-react";

import { signOut } from "@/app/actions";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function KatalogLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="sticky top-0 z-10 border-t-2 border-b border-t-catalog bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-4 px-4">
          <div className="flex min-w-0 items-center gap-2">
            <Link href="/" aria-label="Zur Startseite">
              <Logo />
            </Link>
            <span className="text-muted-foreground/50">/</span>
            <Link href="/catalog" className="truncate font-semibold tracking-tight">
              Übungskatalog
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
              <Link href="/sessions">
                <NotebookPen />
                <span className="hidden sm:inline">Sitzungsdoku</span>
                <span className="sr-only sm:hidden">Sitzungsdoku</span>
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/catalog/neu">
                <Plus />
                <span className="hidden sm:inline">Neue Übung</span>
                <span className="sr-only sm:hidden">Neue Übung</span>
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
    </>
  );
}
