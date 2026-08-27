import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { entrar, registrarse } from "./acciones";

export default async function IniciarSesion({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  // Si ya hay sesión, no tiene sentido mostrar el login.
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/panel");

  return (
    <main className="mx-auto w-full max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold tracking-tight">Iniciar sesión</h1>
      <p className="mt-1 text-sm text-muted">
        Entra para ver tu panel de agente.
      </p>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          {error}
        </p>
      )}

      <form className="mt-6 flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Correo
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="rounded-lg border border-line bg-card px-3 py-2 text-base"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Contraseña
          <input
            type="password"
            name="password"
            required
            minLength={6}
            autoComplete="current-password"
            className="rounded-lg border border-line bg-card px-3 py-2 text-base"
          />
        </label>

        <button
          formAction={entrar}
          className="mt-2 rounded-lg bg-accent px-4 py-2.5 font-semibold text-ink"
        >
          Entrar
        </button>
        <button
          formAction={registrarse}
          className="rounded-lg border border-line px-4 py-2.5 font-semibold"
        >
          Crear cuenta
        </button>
      </form>
    </main>
  );
}
