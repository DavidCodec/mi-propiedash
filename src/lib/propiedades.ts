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

/** Las columnas que necesita la interfaz. Nunca `select("*")`: pedir solo lo
 *  que se usa evita traer datos de más y que un cambio en la tabla se filtre
 *  a la app sin que nadie lo note. */
const COLUMNAS =
  "dashcode, titulo, zona, ciudad, precio_usd, operacion, habitaciones, banos, metros, dashtag";

/**
 * Normaliza lo que llega en la URL a una operación válida.
 *
 * Vive aquí y no dentro de la página porque es una REGLA DE NEGOCIO, no un
 * detalle de esa pantalla: solo existen dos operaciones, y cualquier otra cosa
 * que llegue (un typo, un enlace viejo, alguien jugando con la URL) se ignora
 * en vez de producir una lista vacía sin explicación.
 *
 * Al ser una función pura se puede probar sin base de datos ni navegador.
 */
export function normalizarOperacion(valor: string | undefined): Operacion | undefined {
  return valor === "en_venta" || valor === "en_alquiler" ? valor : undefined;
}

export type FiltrosBusqueda = {
  ciudad?: string;
  operacion?: Operacion;
};

/**
 * Trae las propiedades desde Supabase, filtradas EN LA BASE DE DATOS.
 *
 * El filtro se aplica en Postgres (`.eq`), no en JavaScript: la base devuelve
 * solo las filas que aplican y no traemos miles para mostrar doce. Los índices
 * de `ciudad` y `operacion` (migración 00001) hacen que esto siga siendo
 * rápido cuando la tabla crezca.
 *
 * Sin filtros devuelve todas, así que la portada la usa igual que antes.
 */
export async function obtenerPropiedades(
  filtros: FiltrosBusqueda = {},
): Promise<Propiedad[]> {
  const supabase = createPublicClient();

  let consulta = supabase
    .from("propiedades")
    .select(COLUMNAS)
    .order("precio_usd", { ascending: false });

  // Solo se añade el filtro si viene con valor. Un `.eq("ciudad", undefined)`
  // no es lo mismo que no filtrar.
  if (filtros.ciudad) consulta = consulta.eq("ciudad", filtros.ciudad);
  if (filtros.operacion) consulta = consulta.eq("operacion", filtros.operacion);

  const { data, error } = await consulta;

  if (error) {
    console.error("[obtenerPropiedades] error de Supabase:", error.message);
    throw error;
  }

  console.log(
    `[obtenerPropiedades] filtros=${JSON.stringify(filtros)} filas=${data?.length ?? 0}`,
  );
  return (data as unknown as FilaPropiedad[]).map(aPropiedad);
}

/**
 * Las ciudades que existen de verdad en la tabla, para el selector.
 *
 * Pide UNA sola columna, no la tabla entera, y deduplica aquí porque
 * PostgREST no expone `select distinct`.
 *
 * LÍMITE CONOCIDO: sigue leyendo una fila por propiedad. Con miles de
 * propiedades esto se resuelve con una vista, una función (RPC) que devuelva
 * las ciudades distintas, o una tabla de zonas propia — que es lo que hace
 * el sitio real con su geografía de estados/ciudades/zonas.
 */
export async function obtenerCiudades(): Promise<string[]> {
  const supabase = createPublicClient();

  const { data, error } = await supabase.from("propiedades").select("ciudad");

  if (error) {
    console.error("[obtenerCiudades]", error.message);
    throw error;
  }

  const ciudades = new Set((data ?? []).map((f) => (f as { ciudad: string }).ciudad));
  return [...ciudades].sort((a, b) => a.localeCompare(b, "es"));
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
