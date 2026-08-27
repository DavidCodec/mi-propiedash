/**
 * Los datos de las propiedades.
 *
 * Por ahora viven aquí, escritos a mano. En el proyecto 9 esta misma función
 * va a leer de Supabase y NADA MÁS del resto de la app va a cambiar. Eso es
 * a propósito: así se separa "de dónde vienen los datos" de "cómo se ven".
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

const PROPIEDADES: Propiedad[] = [
  { dashcode: "GV4PE", titulo: "Apartamento en Prados del Este", zona: "Prados del Este", ciudad: "Caracas", precioUsd: 245000, operacion: "en_venta", habitaciones: 3, banos: 3, metros: 165, dashtag: "@georgecodec" },
  { dashcode: "K7LPG", titulo: "Penthouse en Los Palos Grandes", zona: "Los Palos Grandes", ciudad: "Caracas", precioUsd: 420000, operacion: "en_venta", habitaciones: 4, banos: 4, metros: 280, dashtag: "@georgecodec" },
  { dashcode: "M2CHU", titulo: "Casa en Chuao", zona: "Chuao", ciudad: "Caracas", precioUsd: 610000, operacion: "en_venta", habitaciones: 5, banos: 5, metros: 450, dashtag: "@mariainmuebles" },
  { dashcode: "R9ALT", titulo: "Apartamento en Altamira", zona: "Altamira", ciudad: "Caracas", precioUsd: 1800, operacion: "en_alquiler", habitaciones: 2, banos: 2, metros: 110, dashtag: "@mariainmuebles" },
  { dashcode: "T5MAR", titulo: "Apartamento en Maracaibo Centro", zona: "Centro", ciudad: "Maracaibo", precioUsd: 68000, operacion: "en_venta", habitaciones: 3, banos: 2, metros: 130, dashtag: "@zuliaprops" },
  { dashcode: "W3VAL", titulo: "Townhouse en El Trigal", zona: "El Trigal", ciudad: "Valencia", precioUsd: 950, operacion: "en_alquiler", habitaciones: 3, banos: 3, metros: 190, dashtag: "@zuliaprops" },
];

/**
 * Trae las propiedades. Es `async` a propósito, aunque hoy no haga falta:
 * en el proyecto 9 va a consultar Supabase y la firma no va a cambiar.
 */
export async function obtenerPropiedades(): Promise<Propiedad[]> {
  return PROPIEDADES;
}

/**
 * Formatea en USD como lo muestra Propiedash: "$245,000".
 *
 * OJO: NO usamos `style: "currency"`. Eso le pide al locale que decida cómo
 * escribir la moneda, y con es-VE devuelve "USD 245.000" — que no es la marca.
 * Formateamos el número y ponemos el símbolo nosotros.
 */
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
