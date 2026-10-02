"use client";

import { useActionState } from "react";

import { startMfaSetup, verifyMfa } from "@/app/mfa-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MfaVerifyForm({ factorId, target }: { factorId: string; target: string }) {
  const [state, action, pending] = useActionState(verifyMfa.bind(null, factorId, target), undefined);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="code">Code</Label>
        <Input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]{6,7}"
          maxLength={7}
          autoFocus
          required
        />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Prüfen …" : "Bestätigen"}
      </Button>
    </form>
  );
}

export function MfaSetupForm({ target }: { target: string }) {
  const [state, action, pending] = useActionState(startMfaSetup, undefined);

  if (!state?.setup) {
    return (
      <form action={action} className="space-y-4">
        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Einrichten …" : "Authenticator-App einrichten"}
        </Button>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <ol className="list-decimal space-y-2 pl-5 text-sm">
        <li>Scanne den QR-Code mit deiner Authenticator-App.</li>
        <li>
          Speichere den Schlüssel darunter zusätzlich in deinem Passwortmanager. Damit kommst du
          auch bei verlorenem Handy wieder an deine Sitzungen.
        </li>
        <li>Gib den Code ein, den die App anzeigt.</li>
      </ol>
      {/* eslint-disable-next-line @next/next/no-img-element -- SVG als data-URL von Supabase */}
      <img
        src={state.setup.qrCode}
        alt="QR-Code für die Authenticator-App"
        className="mx-auto size-48 rounded-md bg-white p-2"
      />
      <p className="break-all rounded-md bg-muted px-3 py-2 text-center font-mono text-xs">
        {state.setup.secret}
      </p>
      <MfaVerifyForm factorId={state.setup.factorId} target={target} />
    </div>
  );
}
