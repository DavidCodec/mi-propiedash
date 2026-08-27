import { createPublicClient } from "@/lib/supabase/public";

/**
 * Los datos de las propiedades.
 *
 * Vienen de Supabase. El resto de la app no sabe nada de eso: pide
 * `obtenerPropiedades()` y recibe `Propiedad[]`. Esa frontera es lo que
 * permite cambiar la fuente de datos sin tocar la interfaz.
 */

/** Tasa BCV de ejemplo. En Propiedash real se consulta, no se escribe a mano. */
export const TASA_BCV = 791.32;

export type Operacion = "en_venta" | "en_alquiler";

export type Propiedad = {
  dashcode: string;
  titulo: string;
  zona: string;
  ciudad: string;
  precioUsd: number;
  operacion: Operacion;
  habitaciones: number;
  banos: number;
  metros: number;
  dashtag: string;
};

/** Cómo se llaman las columnas EN LA BASE (snake_case, convención de Postgres). */
type FilaPropiedad = {
  dashcode: string;
  titulo: string;
  zona: string;
  ciudad: string;
  precio_usd: number;
  operacion: Operacion;
  habitaciones: number;
  banos: number;
  metros: number;
  dashtag: string;
};

/**
 * Traduce una fila de la base (snake_case) al tipo que usa la app (camelCase).
 *
 * Esta función existe para que el resto de la app NO sepa cómo se llaman las
 * columnas. Si mañana renombramos `precio_usd`, se arregla AQUÍ y en ningún
 * otro lado. Sin esta capa, el nombre de una columna se filtra a 20 componentes.
 */
function aPropiedad(fila: FilaPropiedad): Propiedad {
  return {
    dashcode: fila.dashcode,
    titulo: fila.titulo,
    zona: fila.zona,
    ciudad: fila.ciudad,
    precioUsd: Number(fila.precio_usd),
    operacion: fila.operacion,
    habitaciones: fila.habitaciones,
    banos: fila.banos,
    metros: fila.metros,
    dashtag: fila.dashtag,
  };
}

/**
 * Trae las propiedades desde Supabase.
 *
 * Antes esto devolvía un array escrito a mano. La firma NO cambió, así que
 * `page.tsx` y `TarjetaPropiedad.tsx` siguen igual: no saben de dónde vienen
 * los datos. Eso es el punto.
 */
export async function obtenerPropiedades(): Promise<Propiedad[]> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("propiedades")
    .select("dashcode, titulo, zona, ciudad, precio_usd, operacion, habitaciones, banos, metros, dashtag")
    .order("precio_usd", { ascending: false });

  if (error) {
    console.error("[obtenerPropiedades] error de Supabase:", error.message);
    throw error;
  }

  console.log(`[obtenerPropiedades] filas recibidas: ${data?.length ?? 0}`);
  return (data ?? []).map(aPropiedad);
}

export function formatearUsd(monto: number): string {
  return `$${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(monto)}`;
}

/** Formatea la conversión a bolívares como la muestra Propiedash: "Bs. 193.873.400". */
export function formatearBs(montoUsd: number): string {
  return `Bs. ${new Intl.NumberFormat("es-VE", {
    maximumFractionDigits: 0,
  }).format(montoUsd * TASA_BCV)}`;
}
