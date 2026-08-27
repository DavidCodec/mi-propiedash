import { createClient } from "@supabase/supabase-js";

/**
 * Cliente PÚBLICO de Supabase (mismo rol que `public.ts` en el repo real).
 *
 * Actúa como ANÓNIMO: no lee cookies, no sabe quién eres. Se usa para lecturas
 * públicas — el listado de propiedades, zonas, conteos.
 *
 * ¿Por qué existe aparte del cliente con sesión? Porque al no tocar cookies, la
 * página SIGUE SIENDO ESTÁTICA y se puede cachear. Si aquí usáramos el cliente
 * con sesión, Next.js volvería la página dinámica y golpearíamos la base en cada
 * visita, incluida cada pasada de Google.
 *
 * Lo que protege los datos NO es esta llave (es pública): es el RLS.
 */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // Fallar ruidosamente y temprano. Si falta una variable, quiero un error
  // claro aquí y no un `[]` misterioso 3 capas más arriba.
  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. " +
        "¿Están en .env.local? ¿Reiniciaste `npm run dev` después de cambiarlo?",
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
