"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { Operacion } from "@/lib/propiedades";

/**
 * Panel de filtros.
 *
 * NO lee la URL. Recibe los filtros YA NORMALIZADOS por el servidor y solo
 * los muestra y navega.
 *
 * Antes leía `useSearchParams()` por su cuenta, y eso causaba un bug: con
 * ?ciudad=Bogota el servidor descartaba la ciudad (mostraba todas) pero este
 * componente ponía value="Bogota" en un <select> sin esa opción, y al hidratar
 * el selector quedaba en blanco. Dos sitios normalizando la misma URL de
 * formas distintas. Ahora la normalización tiene UN solo dueño: el servidor.
 */
export function Filtros({
  ciudades,
  ciudad,
  operacion,
}: {
  ciudades: string[];
  ciudad: string | undefined;
  operacion: Operacion | undefined;
}) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();

  // La URL se reconstruye desde los valores normalizados, no desde la URL
  // actual: así un ?ciudad=Bogota o un parámetro repetido no sobreviven al
  // primer clic. La URL queda siempre canónica.
  function ir(siguiente: { ciudad?: string; operacion?: string }) {
    const query = new URLSearchParams();
    if (siguiente.ciudad) query.set("ciudad", siguiente.ciudad);
    if (siguiente.operacion) query.set("operacion", siguiente.operacion);
    const qs = query.toString();
    iniciar(() => router.push(qs ? `/buscar?${qs}` : "/buscar"));
  }

  const select =
    "rounded-lg border border-line bg-card px-3 py-2 text-base disabled:opacity-60";

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-card p-4">
      <label className="flex flex-col gap-1 text-sm">
        Ciudad
        <select
          className={select}
          value={ciudad ?? ""}
          disabled={pendiente}
          onChange={(e) => ir({ ciudad: e.target.value, operacion })}
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
          value={operacion ?? ""}
          disabled={pendiente}
          onChange={(e) => ir({ ciudad, operacion: e.target.value })}
        >
          <option value="">Venta y alquiler</option>
          <option value="en_venta">En venta</option>
          <option value="en_alquiler">En alquiler</option>
        </select>
      </label>

      {(ciudad || operacion) && (
        <button
          type="button"
          disabled={pendiente}
          onClick={() => ir({})}
          className="rounded-lg border border-line px-3 py-2 text-sm"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
