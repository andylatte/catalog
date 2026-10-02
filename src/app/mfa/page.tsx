import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/server";

import { MfaSetupForm, MfaVerifyForm } from "./mfa-form";

export const metadata: Metadata = { title: "Bestätigung" };

export default async function MfaPage({ searchParams }: PageProps<"/mfa">) {
  const params = await searchParams;
  const target = typeof params.weiter === "string" ? params.weiter : "/sessions";

  const supabase = await createClient();
  const { data: level } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (level?.currentLevel === "aal2") redirect("/sessions");

  const { data: factors } = await supabase.auth.mfa.listFactors();
  const factor = factors?.totp[0];

  return (
    <main className="theme-sessions flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-1 text-center">
          <h1>
            <Logo className="text-4xl" />
          </h1>
          <p className="text-sm text-muted-foreground">
            {factor
              ? "Für die Sitzungsdoku brauchst du den Code aus deiner Authenticator-App."
              : "Die Sitzungsdoku ist zusätzlich mit einer Authenticator-App geschützt. Richte sie einmalig ein."}
          </p>
        </div>
        {factor ? (
          <MfaVerifyForm factorId={factor.id} target={target} />
        ) : (
          <MfaSetupForm target={target} />
        )}
        <p className="text-center text-sm">
          <Link href="/" className="text-muted-foreground underline-offset-4 hover:underline">
            Zurück zur Startseite
          </Link>
        </p>
      </div>
    </main>
  );
}
