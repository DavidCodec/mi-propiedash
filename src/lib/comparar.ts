import type { Propiedad } from "@/lib/propiedades";

/**
 * Lógica de la comparación de propiedades.
 *
 * Todo aquí es PURO: no toca la base, ni el navegador, ni React. Por eso se
 * puede probar sin nada montado, y por eso vive en src/lib y no dentro de un
 * componente.
 */

/** Cuántas propiedades caben. Más de 3 no entra en un teléfono. */
export const MAX_COMPARAR = 3;

/**
 * Normaliza los DASHCODE que llegan por la URL (?p=GV4PE&p=K7LPG).
 *
 * No se confía en la URL: se limpia, se pasa a mayúsculas, se quitan
 * duplicados y se corta en MAX_COMPARAR. Cualquier basura se descarta en vez
 * de romper la página.
 */
export function normalizarCodigos(valor: string | string[] | undefined): string[] {
  const bruto = Array.isArray(valor) ? valor : valor ? [valor] : [];
  const limpios = bruto
    .flatMap((v) => String(v).split(",")) // acepta ?p=A,B además de ?p=A&p=B
    .map((v) => v.trim().toUpperCase())
    .filter((v) => /^[A-Z0-9]{5}$/.test(v)); // el formato real del DASHCODE
  return [...new Set(limpios)].slice(0, MAX_COMPARAR);
}

/**
 * Un valor que debe ser positivo para existir. Cero, negativo, NaN o Infinity
 * significan AUSENCIA de dato, no el número cero.
 *
 * Sin esto había un bug grave: un precio nulo en la base pasa por
 * `Number(null)` y se vuelve 0; la fila mostraba "$0" y —siendo "menor es
 * mejor"— **se llevaba el badge de "mejor"**. Un dato faltante no solo se
 * mostraba como cero: ganaba.
 */
function positivoOAusente(n: number): number | null {
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** El precio por m², que es la métrica que de verdad compara dos propiedades. */
export function precioPorMetro(p: Propiedad): number | null {
  const metros = positivoOAusente(p.metros);
  const precio = positivoOAusente(p.precioUsd);
  if (metros === null || precio === null) return null;
  return precio / metros;
}

export type Criterio = "mayor-mejor" | "menor-mejor";

export type FilaComparacion = {
  etiqueta: string;
  criterio: Criterio;
  /** Un valor por propiedad, en el mismo orden. `null` = sin dato. */
  valores: (number | null)[];
  /** Cómo se muestra cada valor. */
  formato: (v: number) => string;
  /** Índices que ganan esa fila. Vacío si no hay juicio o si todos empatan. */
  ganadores: number[];
};

/**
 * Decide qué índices "ganan" una fila.
 *
 * Reglas deliberadas:
 * - Si todos los valores son iguales, NADIE gana. Marcar un empate como
 *   victoria es engañar.
 * - Si hay menos de dos valores válidos, no hay comparación posible.
 * - Un valor ausente (null) no participa: no gana ni pierde.
 */
function calcularGanadores(valores: (number | null)[], criterio: Criterio): number[] {
  const validos = valores
    .map((v, i) => ({ v, i }))
    .filter((x): x is { v: number; i: number } => x.v !== null);

  if (validos.length < 2) return [];

  const mejor =
    criterio === "mayor-mejor"
      ? Math.max(...validos.map((x) => x.v))
      : Math.min(...validos.map((x) => x.v));

  // Empate total → nadie gana.
  if (validos.every((x) => x.v === mejor)) return [];

  return validos.filter((x) => x.v === mejor).map((x) => x.i);
}

const usd = (v: number) =>
  `$${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(v)}`;
const entero = (v: number) => String(v);

/**
 * Arma las filas de la tabla comparativa.
 *
 * Solo compara datos que YA existen en la ficha. No estima rentabilidad ni
 * opina sobre inversión: eso necesita datos que no tenemos y entra en
 * terreno de consejo financiero.
 */
export function construirFilas(props: Propiedad[]): FilaComparacion[] {
  const def: Omit<FilaComparacion, "ganadores">[] = [
    {
      etiqueta: "Precio",
      criterio: "menor-mejor",
      valores: props.map((p) => positivoOAusente(p.precioUsd)),
      formato: usd,
    },
    {
      etiqueta: "Precio por m²",
      criterio: "menor-mejor",
      valores: props.map(precioPorMetro),
      formato: (v) => `${usd(Math.round(v))}/m²`,
    },
    {
      etiqueta: "Metros²",
      criterio: "mayor-mejor",
      valores: props.map((p) => positivoOAusente(p.metros)),
      formato: (v) => `${entero(v)} m²`,
    },
    {
      etiqueta: "Habitaciones",
      criterio: "mayor-mejor",
      valores: props.map((p) => p.habitaciones),
      formato: entero,
    },
    {
      etiqueta: "Baños",
      criterio: "mayor-mejor",
      valores: props.map((p) => p.banos),
      formato: entero,
    },
  ];

  return def.map((f) => ({ ...f, ganadores: calcularGanadores(f.valores, f.criterio) }));
}

/** Construye la URL compartible de una comparación. */
export function urlComparacion(codigos: readonly string[]): string {
  const q = new URLSearchParams();
  for (const c of codigos.slice(0, MAX_COMPARAR)) q.append("p", c);
  const s = q.toString();
  return s ? `/comparar?${s}` : "/comparar";
}
