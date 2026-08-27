import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente de NAVEGADOR (mismo papel que `client.ts` en el repo real).
 *
 * El usuario, pero desde el navegador. Se usa en componentes 'use client'
 * que necesitan datos del usuario o acciones de login/logout.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
