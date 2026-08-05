"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

/**
 * Landing point for Supabase Auth links generated via the admin API
 * (`generateLink`, used for invites and manual "send me a sign-in link").
 * Unlike self-service sign-in (handled by /auth/callback with a `?code=`),
 * these always use the implicit flow: the session tokens arrive in the URL
 * *hash fragment*, which the server never sees.
 *
 * We can't rely on the Supabase client's own automatic URL detection here:
 * @supabase/ssr's createBrowserClient hardcodes flowType "pkce" (it ignores
 * any override), and auth-js actively rejects implicit-flow hash tokens
 * when flowType is "pkce". So we parse the hash ourselves and hand the
 * tokens to setSession() directly — that call doesn't care about flowType
 * and still persists the session the normal (cookie-based) way, which is
 * what the server/middleware need to see the user as signed in.
 */
function MagicLinkHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState(false);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const access_token = hash.get("access_token");
    const refresh_token = hash.get("refresh_token");
    const next = searchParams.get("next") ?? "/dashboard";

    const run = async () => {
      if (!access_token || !refresh_token) return false;
      const supabase = createClient();
      const { data, error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      return !sessionError && !!data.session;
    };

    run().then((ok) => {
      if (ok) router.replace(next);
      else setError(true);
    });
  }, [router, searchParams]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connexion…</CardTitle>
        <CardDescription>{error ? "Ce lien est invalide ou a expiré." : "Merci de patienter, vous allez être redirigé(e)."}</CardDescription>
      </CardHeader>
      {error ? (
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              Demandez à la super-administratrice de vous renvoyer un lien, ou{" "}
              <Link href="/login" className="underline">
                retournez à la connexion
              </Link>
              .
            </AlertDescription>
          </Alert>
        </CardContent>
      ) : null}
    </Card>
  );
}

export default function MagicLinkPage() {
  return (
    <Suspense fallback={null}>
      <MagicLinkHandler />
    </Suspense>
  );
}
