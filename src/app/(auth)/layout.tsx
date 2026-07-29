import { TedxLogo } from "@/components/shared/tedx-logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 bg-muted/30 p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <TedxLogo className="h-10 w-auto" priority />
        <h1 className="text-xl font-semibold">Plateforme de gestion d’événements</h1>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
