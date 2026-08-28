"use client";

import { Columns2 } from "lucide-react";
import { MAX_COMPARAR } from "@/lib/comparar";
import { useComparar } from "@/lib/usar-comparar";

/**
 * Botón "Comparar" de una propiedad.
 *
 * Tiene TRES estados, no dos como el corazón de favoritos:
 *   1. agregar
 *   2. ya agregada (se puede quitar desde aquí)
 *   3. lleno → no caben más, y el botón lo DICE en vez de no responder
 *
 * El ícono es `columns-2` de Lucide (el set que ya usa el sitio). Ningún ícono
 * comunica "comparar" por sí solo, así que la etiqueta accesible es
 * obligatoria: un botón de solo ícono sin `aria-label` es una falla de a11y.
 */
export function BotonComparar({
  dashcode,
  titulo,
  conEtiqueta = false,
}: {
  dashcode: string;
  titulo: string;
  /** true en la ficha (hay espacio para el texto), false en la tarjeta. */
  conEtiqueta?: boolean;
}) {
  const { tiene, lleno, alternar } = useComparar();
  const activa = tiene(dashcode);
  const bloqueado = !activa && lleno;

  const texto = activa
    ? "Quitar de la comparación"
    : bloqueado
      ? `Ya tienes ${MAX_COMPARAR} para comparar`
      : `Comparar ${titulo}`;

  return (
    <button
      type="button"
      onClick={() => alternar(dashcode)}
      // NO se usa `disabled`: un botón deshabilitado no recibe foco y su
      // etiqueta queda fuera del recorrido del teclado, y `title` no existe
      // en táctil — o sea, el mensaje "ya tienes 3" NUNCA llegaría al
      // usuario, que es justo lo contrario de lo que se quiere.
      // Con `aria-disabled` el botón sigue enfocable y anunciable.
      aria-disabled={bloqueado || undefined}
      aria-pressed={activa}
      aria-label={texto}
      title={texto}
      className={[
        "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors",
        activa
          ? "border-ink bg-accent text-ink"
          : "border-line bg-card text-ink hover:bg-canvas",
        bloqueado ? "cursor-not-allowed opacity-40" : "",
      ].join(" ")}
    >
      <Columns2 className="size-4 shrink-0" aria-hidden="true" />
      {conEtiqueta && <span>{activa ? "Quitar" : "Comparar"}</span>}
    </button>
  );
}
