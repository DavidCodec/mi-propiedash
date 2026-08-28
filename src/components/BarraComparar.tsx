"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Columns2, X } from "lucide-react";
import { MAX_COMPARAR, urlComparacion } from "@/lib/comparar";
import { useComparar } from "@/lib/usar-comparar";

/**
 * Barra fija de abajo con las propiedades fijadas.
 *
 * Sin esto el botón de comparar no sirve: el usuario tiene que poder VER qué
 * lleva fijado, quitar una, y lanzar la comparación. Son dos piezas, no una.
 *
 * Va montada en el layout para que sobreviva la navegación entre páginas.
 */
export function BarraComparar() {
  const { codigos, quitar, limpiar } = useComparar();
  const ruta = usePathname();

  // Una barra fija vacía solo estorba, y en móvil tapa contenido.
  if (codigos.length === 0) return null;

  // Y tampoco en /comparar: ya estás viendo la comparación, un botón que dice
  // "Comparar" ahí es ruido y tapa la tabla. Se descubrió probando en móvil.
  if (ruta === "/comparar") return null;

  const suficientes = codigos.length >= 2;

  return (
    <div
      role="region"
      aria-label="Propiedades seleccionadas para comparar"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 backdrop-blur"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-nowrap items-center gap-2 px-4 py-3 sm:flex-wrap sm:gap-3">
        <Columns2 className="size-5 shrink-0 text-muted" aria-hidden="true" />

        {/* En móvil las fichas hacían crecer la barra a 3 líneas (~200px de
            812), tapando demasiado contenido. Ahí se resume en un contador y
            las fichas se ven desde sm. */}
        <span className="flex-1 text-sm font-medium sm:hidden">
          {codigos.length}{" "}
          {codigos.length === 1 ? "propiedad" : "propiedades"} para comparar
        </span>

        <ul className="hidden flex-1 flex-wrap items-center gap-2 sm:flex">
          {codigos.map((c) => (
            <li key={c}>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-canvas py-1 pl-3 pr-1.5 text-sm">
                <span className="font-mono text-xs uppercase">{c}</span>
                <button
                  type="button"
                  onClick={() => quitar(c)}
                  aria-label={`Quitar ${c} de la comparación`}
                  className="rounded-full p-0.5 hover:bg-line"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </span>
            </li>
          ))}
        </ul>

        <span className="hidden text-sm text-muted sm:inline">
          {codigos.length} de {MAX_COMPARAR}
        </span>

        <button
          type="button"
          onClick={limpiar}
          className="rounded-lg border border-line px-3 py-2 text-sm"
        >
          Limpiar
        </button>

        {suficientes ? (
          <Link
            href={urlComparacion(codigos)}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-ink"
          >
            Comparar ({codigos.length})
          </Link>
        ) : (
          // No se deshabilita un enlace: se explica qué falta.
          <span className="rounded-lg border border-line px-4 py-2 text-sm text-muted">
            Elige otra para comparar
          </span>
        )}
      </div>
    </div>
  );
}
