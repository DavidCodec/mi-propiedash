import Link from "next/link";
import { notFound } from "next/navigation";
import { formatearBs, formatearUsd, obtenerPropiedades } from "@/lib/propiedades";
import { enviarContacto } from "./acciones";

/**
 * Ruta dinámica: la carpeta se llama [dashcode], así que /contactar/GV4PE
 * llega aquí con params.dashcode === "GV4PE". En el repo real de Propiedash
 * las rutas son así: /[locale]/(public)/... y la ficha vive en /[dashcode].
 *
 * En Next 15+ `params` y `searchParams` son promesas: hay que await.
 */
export default async function Contactar({
  params,
  searchParams,
}: {
  params: Promise<{ dashcode: string }>;
  searchParams: Promise<{ enviado?: string; error?: string }>;
}) {
  const { dashcode } = await params;
  const { enviado, error } = await searchParams;

  const propiedades = await obtenerPropiedades();
  const propiedad = propiedades.find((p) => p.dashcode === dashcode);
  if (!propiedad) notFound();

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-10">
      <Link href="/" className="text-sm text-muted">
        ← Volver a las propiedades
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">
        Contactar por {propiedad.titulo}
      </h1>
      <p className="mt-1 text-sm text-muted">
        {formatearUsd(propiedad.precioUsd)} · {formatearBs(propiedad.precioUsd)} ·{" "}
        <span className="font-mono text-xs uppercase">{propiedad.dashcode}</span>
      </p>
      <p className="mt-1 text-sm text-muted">
        Le escribes a {propiedad.dashtag}, el agente que captó esta propiedad.
      </p>

      {enviado && (
        <p
          role="status"
          className="mt-5 rounded-lg border border-line bg-accent/20 p-3 text-sm font-medium"
        >
          ✅ Mensaje enviado. El agente te responderá a tu correo.
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          {error}
        </p>
      )}

      <form className="mt-6 flex flex-col gap-3">
        <input type="hidden" name="dashcode" value={propiedad.dashcode} />

        <label className="flex flex-col gap-1 text-sm">
          Tu nombre
          <input
            name="nombre"
            required
            className="rounded-lg border border-line bg-card px-3 py-2 text-base"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Tu correo
          <input
            type="email"
            name="correo"
            required
            className="rounded-lg border border-line bg-card px-3 py-2 text-base"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Mensaje
          <textarea
            name="mensaje"
            required
            rows={4}
            defaultValue={`Hola, me interesa ${propiedad.titulo}. ¿Podemos coordinar una visita?`}
            className="rounded-lg border border-line bg-card px-3 py-2 text-base"
          />
        </label>

        <button
          formAction={enviarContacto}
          className="mt-2 rounded-lg bg-accent px-4 py-2.5 font-semibold text-ink"
        >
          Enviar mensaje
        </button>
      </form>
    </main>
  );
}
