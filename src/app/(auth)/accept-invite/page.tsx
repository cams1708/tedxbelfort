"use client";

import { useActionState } from "react";
import { acceptInviteAction, type AuthActionState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const initialState: AuthActionState = {};

export default function AcceptInvitePage() {
  const [state, formAction, isPending] = useActionState(acceptInviteAction, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activer votre compte</CardTitle>
        <CardDescription>Vous avez été invité(e) à rejoindre la plateforme. Choisissez votre nom et un mot de passe.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          {state.error ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="flex flex-col gap-2">
            <Label htmlFor="fullName">Nom complet</Label>
            <Input id="fullName" name="fullName" type="text" autoComplete="name" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Activation…" : "Activer mon compte"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
