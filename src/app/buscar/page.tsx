import Link from "next/link";
import { Suspense } from "react";
import { TarjetaPropiedad } from "@/components/TarjetaPropiedad";
import { normalizarOperacion, obtenerCiudades, obtenerPropiedades } from "@/lib/propiedades";
import { Filtros } from "./filtros";

/**
 * Página de resultados con filtros.
 *
 * Vive aparte de la portada A PROPÓSITO: leer searchParams vuelve la página
 * dinámica (ƒ), y la portada debe seguir siendo estática (○) y cacheada.
 * Es la misma separación que hace propiedash.com: la portada es la portada,
 * y /buscar es la página de resultados.
 *
 * El filtrado se hace EN POSTGRES, no en JavaScript: la consulta pide solo las
 * filas que aplican, apoyada en los índices de `ciudad` y `operacion` de la
 * migración 00001. Traer todo para descartar en memoria funcionaría con 7
 * filas y sería un problema con 5.000.
 */
export default async function Buscar({
  searchParams,
}: {
  searchParams: Promise<{ ciudad?: string; operacion?: string }>;
}) {
  const { ciudad, operacion } = await searchParams;

  // La regla vive en src/lib/propiedades.ts y está probada allí.
  const operacionValida = normalizarOperacion(operacion);

  // Las dos consultas son independientes, así que van en paralelo en vez de
  // una después de la otra.
  const [resultados, ciudades] = await Promise.all([
    obtenerPropiedades({ ciudad, operacion: operacionValida }),
    obtenerCiudades(),
  ]);

  const filtrando = Boolean(ciudad || operacionValida);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <Link href="/" className="text-sm text-muted">
        ← Volver a la portada
      </Link>

      <h1 className="mt-4 text-3xl font-bold tracking-tight">Buscar propiedades</h1>

      <div className="mt-5">
        {/* Suspense porque useSearchParams necesita un límite de suspensión. */}
        <Suspense fallback={<div className="h-20 rounded-2xl border border-line bg-card" />}>
          <Filtros ciudades={ciudades} />
        </Suspense>
      </div>

      <p className="mt-5 text-muted">
        {resultados.length}{" "}
        {resultados.length === 1 ? "propiedad encontrada" : "propiedades encontradas"}
        {filtrando && " con estos filtros"}
      </p>

      {resultados.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-line bg-card p-8 text-center">
          <p className="font-semibold">No hay propiedades con esos filtros</p>
          <p className="mt-1 text-sm text-muted">
            Prueba con otra ciudad, u otro tipo de operación.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {resultados.map((p) => (
            <TarjetaPropiedad key={p.dashcode} propiedad={p} />
          ))}
        </div>
      )}
    </main>
  );
}
