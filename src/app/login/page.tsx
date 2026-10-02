import { Logo } from "@/components/logo";

import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-1 text-center">
          <h1>
            <Logo className="text-4xl" />
          </h1>
          <p className="text-sm text-muted-foreground">Bitte melde dich an.</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
