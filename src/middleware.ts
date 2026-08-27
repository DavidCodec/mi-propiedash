import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * El middleware corre ANTES de cada página. Su único trabajo aquí es
 * refrescar el token de sesión y volver a escribir las cookies.
 *
 * ¿Por qué hace falta? Porque los Server Components NO pueden escribir
 * cookies. Sin esto, el token vence y al usuario lo saca la sesión sin
 * motivo aparente. Es el bug de auth más común con Next.js + Supabase.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Esta llamada es la que refresca el token. No la quites.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // Todo menos archivos estáticos e imágenes.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
