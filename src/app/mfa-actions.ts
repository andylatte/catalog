"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type MfaSetup = { factorId: string; qrCode: string; secret: string };
export type MfaSetupState = { setup?: MfaSetup; error?: string } | undefined;
export type MfaVerifyState = { error?: string } | undefined;

/** Nur Ziele in der Sitzungsdoku zulassen, damit kein fremder Redirect entsteht. */
function safeTarget(target: string) {
  return target === "/sessions" || target.startsWith("/sessions/") ? target : "/sessions";
}

/** Legt einen neuen TOTP-Faktor an und liefert den QR-Code zum Scannen. */
export async function startMfaSetup(): Promise<MfaSetupState> {
  const supabase = await createClient();

  // Abgebrochene Einrichtungen aufräumen, sonst sammeln sich unbestätigte Faktoren.
  const { data: factors } = await supabase.auth.mfa.listFactors();
  for (const factor of factors?.all ?? []) {
    if (factor.factor_type === "totp" && factor.status === "unverified") {
      await supabase.auth.mfa.unenroll({ factorId: factor.id });
    }
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "Authenticator-App",
  });
  if (error) return { error: "Einrichtung hat nicht geklappt. Bitte versuch es noch einmal." };

  return { setup: { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret } };
}

/** Prüft den 6-stelligen Code und hebt die Anmeldung auf aal2. */
export async function verifyMfa(
  factorId: string,
  target: string,
  _prev: MfaVerifyState,
  formData: FormData,
): Promise<MfaVerifyState> {
  const code = String(formData.get("code") ?? "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(code)) return { error: "Bitte gib den 6-stelligen Code ein." };

  const supabase = await createClient();
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
  if (error) return { error: "Der Code stimmt nicht. Bitte versuch es noch einmal." };

  redirect(safeTarget(target));
}
