import Link from "next/link";
import type { Metadata } from "next";
import { cache } from "react";
import { Columns2 } from "lucide-react";
import {
  MAX_COMPARAR,
  construirFilas,
  normalizarCodigos,
} from "@/lib/comparar";
import { formatearBs, obtenerPropiedadesPorCodigos } from "@/lib/propiedades";

/**
 * Comparación de propiedades lado a lado.
 *
 * El estado vive en la URL (?p=GV4PE&p=K7LPG) a propósito: decidir un inmueble
 * casi nunca es decisión de una sola persona. Este enlace se manda por
 * WhatsApp a la pareja, al socio, al que pone la plata — y el que lo recibe ve
 * exactamente lo mismo. Y de paso es indexable.
 */

/**
 * Resuelve los códigos de la URL y trae las propiedades.
 *
 * Envuelta en `cache()` de React porque la llaman generateMetadata Y el
 * componente en la MISMA petición. Sin esto eran dos consultas idénticas a
 * Supabase por cada visita: Next solo deduplica `fetch`, no las llamadas a
 * un cliente de base de datos.
 */
const resolverComparacion = cache(async (
  searchParams: Promise<Record<string, string | string[] | undefined>>,
) => {
  const params = await searchParams;
  const codigos = normalizarCodigos(params.p);
  const propiedades = await obtenerPropiedadesPorCodigos(codigos);
  return { codigos, propiedades };
});

export async function generateMetadata(props: PageProps<"/comparar">): Promise<Metadata> {
  const { propiedades } = await resolverComparacion(props.searchParams);
  if (propiedades.length < 2) {
    return { title: "Comparar propiedades" };
  }
  const titulo = `Comparar: ${propiedades.map((p) => p.titulo).join(" vs ")}`;
  return {
    title: titulo,
    description: `Compara ${propiedades.length} propiedades lado a lado: precio, precio por m², metros, habitaciones y baños.`,
  };
}

export default async function Comparar(props: PageProps<"/comparar">) {
  const { codigos, propiedades } = await resolverComparacion(props.searchParams);

  if (propiedades.length < 2) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-16 text-center">
        <Columns2 className="mx-auto size-10 text-dim" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-bold tracking-tight">Comparar propiedades</h1>
        <p className="mt-2 text-muted">
          {codigos.length === 0
            ? `Elige entre 2 y ${MAX_COMPARAR} propiedades para verlas lado a lado.`
            : "Hace falta al menos una propiedad más para poder comparar."}
        </p>
        <Link
          href="/buscar"
          className="mt-6 inline-block rounded-lg bg-accent px-5 py-2.5 font-semibold text-ink"
        >
          Ir a buscar propiedades
        </Link>
      </main>
    );
  }

  const filas = construirFilas(propiedades);
  const faltantes = codigos.filter((c) => !propiedades.some((p) => p.dashcode === c));

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <Link href="/buscar" className="text-sm text-muted">
        ← Volver a la búsqueda
      </Link>

      <h1 className="mt-4 text-3xl font-bold tracking-tight">
        Comparando {propiedades.length} propiedades
      </h1>
      <p className="mt-1 text-muted">
        Este enlace se puede compartir: quien lo abra ve exactamente esta comparación.
      </p>

      {faltantes.length > 0 && (
        <p role="status" className="mt-4 rounded-lg border border-line bg-canvas p-3 text-sm">
          No se encontraron {faltantes.length === 1 ? "la propiedad" : "las propiedades"}{" "}
          <span className="font-mono">{faltantes.join(", ")}</span>. Puede que ya no esté
          publicada.
        </p>
      )}

      {/* La tabla scrollea DENTRO de su contenedor: la página nunca scrollea
          horizontal. Es el reto real de esta pantalla en móvil. */}
      {/* tabIndex + role: sin ellos, una región con overflow no se puede
          scrollear con el teclado (WCAG 2.1.1). */}
      <div
        tabIndex={0}
        role="region"
        aria-label="Tabla comparativa, desplazable horizontalmente"
        className="mt-6 overflow-x-auto rounded-2xl border border-line bg-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink"
      >
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <caption className="sr-only">
            Comparación de {propiedades.length} propiedades por precio, precio por metro
            cuadrado, superficie, habitaciones y baños
          </caption>
          <thead>
            <tr>
              {/* Primera columna pegada: al scrollear horizontal, el usuario
                  siempre sabe qué fila está mirando. */}
              <th
                scope="col"
                className="sticky left-0 z-10 border-b border-line bg-card p-4 text-left align-bottom text-muted"
              >
                <span className="sr-only">Característica</span>
              </th>
              {propiedades.map((p) => (
                <th
                  key={p.dashcode}
                  scope="col"
                  className="border-b border-l border-line p-4 text-left align-bottom"
                >
                  <span className="font-mono text-xs uppercase text-dim">{p.dashcode}</span>
                  <p className="mt-1 font-semibold leading-snug">{p.titulo}</p>
                  <p className="text-xs font-normal text-muted">
                    {p.zona} · {p.ciudad}
                  </p>
                  <p className="mt-1 text-xs font-normal text-muted">
                    {p.operacion === "en_venta" ? "En venta" : "En alquiler"}
                  </p>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filas.map((fila) => (
              <tr key={fila.etiqueta} className="border-b border-line last:border-0">
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-card p-4 text-left font-medium text-muted"
                >
                  {fila.etiqueta}
                </th>
                {fila.valores.map((v, i) => {
                  const gana = fila.ganadores.includes(i);
                  return (
                    <td key={i} className="border-l border-line p-4">
                      {v === null ? (
                        <span className="text-dim">sin datos</span>
                      ) : (
                        <span
                          className={
                            gana ? "font-semibold text-ink" : "text-muted"
                          }
                        >
                          {fila.formato(v)}
                          {gana && (
                            <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-ink">
                              mejor
                            </span>
                          )}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}

            <tr>
              <th
                scope="row"
                className="sticky left-0 z-10 bg-card p-4 text-left font-medium text-muted"
              >
                En bolívares
              </th>
              {propiedades.map((p) => (
                <td key={p.dashcode} className="border-l border-line p-4 text-muted">
                  {formatearBs(p.precioUsd)}
                </td>
              ))}
            </tr>

            <tr className="border-t border-line">
              {/* <td> y no <th>: un encabezado de fila vacío hace que el
                  lector de pantalla anuncie una fila sin nombre. */}
              <td className="sticky left-0 z-10 bg-card p-4" />
              {propiedades.map((p) => (
                <td key={p.dashcode} className="border-l border-line p-4">
                  <Link
                    href={`/contactar/${p.dashcode}`}
                    className="inline-block rounded-lg bg-accent px-4 py-2 font-semibold text-ink"
                  >
                    Contactar
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-muted">
        &quot;Mejor&quot; marca el valor más favorable de cada fila según ese criterio
        (menor precio, mayor superficie). No es una recomendación de inversión: son los
        datos de la ficha, puestos lado a lado.
      </p>
    </main>
  );
}
