import Link from "next/link";
import { LogOut, Plus } from "lucide-react";

import { signOut } from "@/app/actions";
import { Button } from "@/components/ui/button";

export default function KatalogLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-4 px-4">
          <Link href="/" className="font-semibold tracking-tight">
            Übungskatalog
          </Link>
          <div className="flex items-center gap-1">
            <Button asChild size="sm">
              <Link href="/uebungen/neu">
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
