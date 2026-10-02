import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-4 py-12 text-center">
      <p className="text-muted-foreground">Diese Sitzung gibt es nicht (mehr).</p>
      <Link href="/sessions" className="text-sm underline underline-offset-4">
        Zur Übersicht
      </Link>
    </div>
  );
}
