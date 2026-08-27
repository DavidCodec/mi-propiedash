"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { propiedadSchema, type PropiedadForm } from "@/lib/esquemas";
import { publicarPropiedad } from "./acciones";

/**
 * 'use client' arriba: este componente SÍ se manda al navegador, porque
 * necesita estado y eventos (validar mientras el usuario escribe).
 *
 * Regla de oro que ya conoces: en un componente cliente NO se toca ningún
 * secreto. Aquí no hay ninguna llave; el insert lo hace la Server Action.
 */
export function FormularioPublicar({ dashtagSugerido }: { dashtagSugerido: string }) {
  const [resultado, setResultado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PropiedadForm>({
    // El resolver conecta react-hook-form con zod: los mensajes de error que
    // ves debajo de cada campo salen del MISMO esquema que usa el servidor.
    resolver: zodResolver(propiedadSchema),
    defaultValues: {
      operacion: "en_venta",
      dashtag: dashtagSugerido,
    },
  });

  const onSubmit = async (datos: PropiedadForm) => {
    setError(null);
    setResultado(null);

    const r = await publicarPropiedad(datos);
    if (r.ok) {
      setResultado(r.dashcode);
      reset({ operacion: "en_venta", dashtag: dashtagSugerido });
    } else {
      setError(r.error);
    }
  };

  const campo = "rounded-lg border border-line bg-card px-3 py-2 text-base";
  const err = "text-xs text-red-700";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
      {resultado && (
        <p role="status" className="rounded-lg border border-line bg-accent/20 p-3 text-sm font-medium">
          ✅ Publicada. Su DASHCODE es <span className="font-mono">{resultado}</span> — ya
          aparece en la portada.
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <label className="flex flex-col gap-1 text-sm">
        Título
        <input {...register("titulo")} placeholder="Apartamento en Los Palos Grandes" className={campo} />
        {errors.titulo && <span className={err}>{errors.titulo.message}</span>}
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Zona
          <input {...register("zona")} placeholder="Los Palos Grandes" className={campo} />
          {errors.zona && <span className={err}>{errors.zona.message}</span>}
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Ciudad
          <input {...register("ciudad")} placeholder="Caracas" className={campo} />
          {errors.ciudad && <span className={err}>{errors.ciudad.message}</span>}
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Precio en USD
          <input {...register("precioUsd")} type="number" min={1} placeholder="245000" className={campo} />
          {errors.precioUsd && <span className={err}>{errors.precioUsd.message}</span>}
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Operación
          <select {...register("operacion")} className={campo}>
            <option value="en_venta">En venta</option>
            <option value="en_alquiler">En alquiler</option>
          </select>
          {errors.operacion && <span className={err}>{errors.operacion.message}</span>}
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          Habitaciones
          <input {...register("habitaciones")} type="number" min={0} className={campo} />
          {errors.habitaciones && <span className={err}>{errors.habitaciones.message}</span>}
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Baños
          <input {...register("banos")} type="number" min={0} className={campo} />
          {errors.banos && <span className={err}>{errors.banos.message}</span>}
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Metros²
          <input {...register("metros")} type="number" min={1} className={campo} />
          {errors.metros && <span className={err}>{errors.metros.message}</span>}
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Tu Dashtag
        <input {...register("dashtag")} placeholder="@miagencia" className={campo} />
        {errors.dashtag && <span className={err}>{errors.dashtag.message}</span>}
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 rounded-lg bg-accent px-4 py-2.5 font-semibold text-ink disabled:opacity-50"
      >
        {isSubmitting ? "Publicando…" : "Publicar propiedad"}
      </button>
    </form>
  );
}
