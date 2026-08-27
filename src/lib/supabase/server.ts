import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Cliente de SERVIDOR (mismo papel que `server.ts` en el repo real).
 *
 * Actúa como EL USUARIO CON SESIÓN: lee la cookie de sesión y todas las
 * consultas se evalúan con RLS como ese usuario. Es la opción por defecto en
 * el servidor cuando los datos dependen de quién pregunta.
 *
 * Diferencia clave con `public.ts`: este SÍ toca cookies. Y por eso la página
 * que lo use deja de ser estática y pasa a ser dinámica (se ejecuta en cada
 * visita). No es un defecto: es el precio de saber quién eres. Por eso NO se
 * usa este cliente para datos públicos.
 */
export async function createClient() {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Faltan las variables de Supabase. ¿Reiniciaste npm run dev?");
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Desde un Server Component no se pueden escribir cookies.
          // El middleware ya se encarga de refrescar la sesión, así que
          // ignorar esto aquí es correcto y no pierde nada.
        }
      },
    },
  });
}
