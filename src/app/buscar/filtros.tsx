"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

/**
 * Panel de filtros. Es un componente de cliente porque necesita reaccionar al
 * cambio de un selector y reescribir la URL. No lleva ningún dato sensible.
 *
 * El estado NO vive en este componente: vive en la URL. Este componente solo
 * la lee y la escribe. Por eso el filtro se puede compartir y Google lo puede
 * indexar: la URL es la única fuente de verdad.
 */
export function Filtros({ ciudades }: { ciudades: string[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [pendiente, iniciar] = useTransition();

  const ciudadActual = params.get("ciudad") ?? "";
  const operacionActual = params.get("operacion") ?? "";

  function actualizar(clave: string, valor: string) {
    const nuevos = new URLSearchParams(params.toString());
    // Un filtro vacío se BORRA del query, no se guarda como "". Así la URL
    // de "todas las propiedades" queda limpia: /buscar, sin parámetros.
    if (valor) nuevos.set(clave, valor);
    else nuevos.delete(clave);

    const query = nuevos.toString();
    iniciar(() => router.push(query ? `/buscar?${query}` : "/buscar"));
  }

  const select =
    "rounded-lg border border-line bg-card px-3 py-2 text-base disabled:opacity-60";

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-card p-4">
      <label className="flex flex-col gap-1 text-sm">
        Ciudad
        <select
          className={select}
          value={ciudadActual}
          disabled={pendiente}
          onChange={(e) => actualizar("ciudad", e.target.value)}
        >
          <option value="">Todas las ciudades</option>
          {ciudades.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Operación
        <select
          className={select}
          value={operacionActual}
          disabled={pendiente}
          onChange={(e) => actualizar("operacion", e.target.value)}
        >
          <option value="">Venta y alquiler</option>
          <option value="en_venta">En venta</option>
          <option value="en_alquiler">En alquiler</option>
        </select>
      </label>

      {(ciudadActual || operacionActual) && (
        <button
          type="button"
          disabled={pendiente}
          onClick={() => iniciar(() => router.push("/buscar"))}
          className="rounded-lg border border-line px-3 py-2 text-sm"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
