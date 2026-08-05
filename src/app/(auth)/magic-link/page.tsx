"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

/**
 * Landing point for Supabase Auth links generated via the admin API
 * (`generateLink`, used for invites and manual "send me a sign-in link").
 * Unlike self-service sign-in (handled by /auth/callback with a `?code=`),
 * these always use the implicit flow: the session tokens arrive in the URL
 * *hash fragment*, which the server never sees. The Supabase browser client
 * auto-detects and persists them (detectSessionInUrl) as soon as it's
 * instantiated on a page load — we just wait for that, then hand off.
 */
function MagicLinkHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState(false);

  useEffect(() => {
    // The shared browser client (src/lib/supabase/client.ts) defaults to
    // flowType "pkce", which makes @supabase/auth-js actively REJECT the
    // implicit-flow hash tokens these admin-issued links carry (it throws
    // "Not a valid PKCE flow url."). This page only ever receives implicit
    // tokens, so it needs its own client explicitly configured for that.
    const supabase = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { flowType: "implicit" } },
    );
    supabase.auth.getSession().then(({ data }) => {
      const next = searchParams.get("next") ?? "/dashboard";
      if (data.session) {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        router.replace(next);
      } else {
        setError(true);
      }
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
