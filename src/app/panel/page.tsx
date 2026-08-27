import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { obtenerFavoritos } from "@/lib/favoritos";
import { formatearUsd, obtenerPropiedades } from "@/lib/propiedades";
import { salir } from "../iniciar-sesion/acciones";
import { guardarFavorito, quitarFavorito } from "./acciones";

/**
 * Página PROTEGIDA.
 *
 * La protección real está en estas 3 líneas: se pregunta al servidor quién
 * eres y, si no hay nadie, se redirige. No hay forma de "ver el HTML igual":
 * el servidor nunca lo genera.
 */
export default async function Panel() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/iniciar-sesion");
  }

  const usuario = data.user;
  const [favoritos, propiedades] = await Promise.all([
    obtenerFavoritos(),
    obtenerPropiedades(),
  ]);
  const guardados = new Set(favoritos.map((f) => f.dashcode));
  const disponibles = propiedades.filter((p) => !guardados.has(p.dashcode));

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Panel del agente</h1>
      <p className="mt-1 text-muted">
        Esta página solo existe si hay sesión. Si cierras sesión y vuelves,
        te manda al login.
      </p>

      <dl className="mt-6 grid gap-3 rounded-2xl border border-line bg-card p-5 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Correo</dt>
          <dd className="font-medium">{usuario.email}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Tu ID de usuario</dt>
          <dd className="font-mono text-xs">{usuario.id}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Sesión iniciada</dt>
          <dd className="font-medium">
            {new Date(usuario.last_sign_in_at ?? "").toLocaleString("es-VE")}
          </dd>
        </div>
      </dl>

      <p className="mt-4 text-sm text-muted">
        Ese ID de usuario es <b className="text-ink">auth.uid()</b> dentro de la
        base de datos. Es la pieza con la que RLS decide qué filas son tuyas.
      </p>

      <section className="mt-8">
        <h2 className="text-xl font-bold tracking-tight">
          Tus favoritos{" "}
          <span className="font-normal text-muted">({favoritos.length})</span>
        </h2>

        {favoritos.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            Todavía no has guardado ninguna. Agrega una abajo.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {favoritos.map((f) => (
              <li
                key={f.dashcode}
                className="flex items-center justify-between gap-4 rounded-xl border border-line bg-card px-4 py-3"
              >
                <div>
                  <p className="font-medium">{f.titulo}</p>
                  <p className="font-mono text-xs uppercase text-dim">
                    {f.dashcode} · {formatearUsd(f.precioUsd)}
                  </p>
                </div>
                <form>
                  <input type="hidden" name="dashcode" value={f.dashcode} />
                  <button
                    formAction={quitarFavorito}
                    className="rounded-lg border border-line px-3 py-1.5 text-sm"
                  >
                    Quitar
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        {disponibles.length > 0 && (
          <form className="mt-4 flex flex-wrap items-center gap-2">
            <select
              name="dashcode"
              className="rounded-lg border border-line bg-card px-3 py-2 text-sm"
            >
              {disponibles.map((p) => (
                <option key={p.dashcode} value={p.dashcode}>
                  {p.titulo} — {formatearUsd(p.precioUsd)}
                </option>
              ))}
            </select>
            <button
              formAction={guardarFavorito}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-ink"
            >
              Guardar favorito
            </button>
          </form>
        )}
      </section>

      <form className="mt-8">
        <button
          formAction={salir}
          className="rounded-lg border border-line px-4 py-2.5 font-semibold"
        >
          Cerrar sesión
        </button>
      </form>
    </main>
  );
}
