import Link from "next/link";
import type { Metadata } from "next";
import { TarjetaPropiedad } from "@/components/TarjetaPropiedad";
import {
  normalizarCiudad,
  normalizarOperacion,
  obtenerCiudades,
  obtenerPropiedades,
  tituloDeBusqueda,
} from "@/lib/propiedades";
import { Filtros } from "./filtros";

/**
 * Página de resultados con filtros.
 *
 * Vive aparte de la portada A PROPÓSITO: leer searchParams vuelve la página
 * dinámica (ƒ), y la portada debe seguir siendo estática (○) y cacheada.
 * Es la misma separación que hace propiedash.com.
 *
 * El filtrado se hace EN POSTGRES (`.eq`), apoyado en los índices de `ciudad`
 * y `operacion` de la migración 00001.
 */

/**
 * Resuelve los filtros de la URL a valores válidos.
 *
 * Se usa desde generateMetadata Y desde el componente. `obtenerCiudades` está
 * memoizada por petición con cache(), así que llamar esto dos veces no hace
 * dos consultas.
 */
async function resolverFiltros(searchParams: Promise<Record<string, string | string[] | undefined>>) {
  const params = await searchParams;
  const ciudadesValidas = await obtenerCiudades();

  return {
    // La ciudad se valida contra las que EXISTEN. ?ciudad=Bogota se ignora.
    ciudad: normalizarCiudad(params.ciudad, ciudadesValidas),
    operacion: normalizarOperacion(params.operacion),
    ciudadesValidas,
  };
}

export async function generateMetadata(props: PageProps<"/buscar">): Promise<Metadata> {
  const { ciudad, operacion } = await resolverFiltros(props.searchParams);
  const titulo = tituloDeBusqueda(ciudad, operacion);

  // El canonical apunta a ESTA combinación de filtros, con los parámetros ya
  // normalizados. Sin él, Google ve ?ciudad=Bogota y ?ciudad=Caracas&x=1 como
  // páginas distintas con el mismo contenido: contenido duplicado.
  const query = new URLSearchParams();
  if (ciudad) query.set("ciudad", ciudad);
  if (operacion) query.set("operacion", operacion);
  const canonical = query.toString() ? `/buscar?${query}` : "/buscar";

  const descripcion = ciudad
    ? `Encuentra propiedades ${operacion === "en_alquiler" ? "en alquiler" : operacion === "en_venta" ? "en venta" : "en venta y alquiler"} en ${ciudad}, con precios en USD y su conversión a bolívares a la tasa BCV.`
    : "Busca propiedades en toda Venezuela por ciudad y tipo de operación, con precios en USD y su conversión a bolívares a la tasa BCV.";

  return {
    title: titulo,
    description: descripcion,
    alternates: { canonical },
    openGraph: { title: titulo, description: descripcion, url: canonical },
  };
}

export default async function Buscar(props: PageProps<"/buscar">) {
  const { ciudad, operacion, ciudadesValidas } = await resolverFiltros(props.searchParams);

  const resultados = await obtenerPropiedades({ ciudad, operacion });
  const filtrando = Boolean(ciudad || operacion);

  // Mismo texto que el <title>: si Google indexa un título y el usuario ve
  // otro, ambos pierden.
  const titulo = tituloDeBusqueda(ciudad, operacion);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <Link href="/" className="text-sm text-muted">
        ← Volver a la portada
      </Link>

      <h1 className="mt-4 text-3xl font-bold tracking-tight">{titulo}</h1>

      <div className="mt-5">
        {/* Sin Suspense: al no usar useSearchParams, el componente ya no
            necesita un límite de suspensión. */}
        <Filtros ciudades={ciudadesValidas} ciudad={ciudad} operacion={operacion} />
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
