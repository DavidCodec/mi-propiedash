import { describe, expect, it } from "vitest";
import {
  MAX_COMPARAR,
  construirFilas,
  normalizarCodigos,
  precioPorMetro,
  urlComparacion,
} from "./comparar";
import type { Propiedad } from "./propiedades";

const prop = (over: Partial<Propiedad> = {}): Propiedad => ({
  dashcode: "AAAAA",
  titulo: "Apartamento de prueba",
  zona: "Zona",
  ciudad: "Caracas",
  precioUsd: 100000,
  operacion: "en_venta",
  habitaciones: 3,
  banos: 2,
  metros: 100,
  dashtag: "@test",
  ...over,
});

describe("normalizarCodigos", () => {
  it("acepta el parámetro repetido: ?p=A&p=B", () => {
    expect(normalizarCodigos(["GV4PE", "K7LPG"])).toEqual(["GV4PE", "K7LPG"]);
  });

  it("acepta separados por coma: ?p=A,B", () => {
    expect(normalizarCodigos("GV4PE,K7LPG")).toEqual(["GV4PE", "K7LPG"]);
  });

  it("normaliza a mayúsculas y recorta espacios", () => {
    expect(normalizarCodigos(" gv4pe ")).toEqual(["GV4PE"]);
  });

  it("descarta cualquier cosa que no tenga el formato de DASHCODE", () => {
    expect(normalizarCodigos(["basura", "GV4PE", "12", "ABCDEF"])).toEqual(["GV4PE"]);
    expect(normalizarCodigos("<script>")).toEqual([]);
  });

  it("quita duplicados", () => {
    expect(normalizarCodigos(["GV4PE", "GV4PE", "K7LPG"])).toEqual(["GV4PE", "K7LPG"]);
  });

  it(`corta en MAX_COMPARAR (${MAX_COMPARAR})`, () => {
    expect(normalizarCodigos(["AAAAA", "BBBBB", "CCCCC", "DDDDD", "EEEEE"])).toHaveLength(
      MAX_COMPARAR,
    );
  });

  it("aguanta undefined y vacío", () => {
    expect(normalizarCodigos(undefined)).toEqual([]);
    expect(normalizarCodigos("")).toEqual([]);
    expect(normalizarCodigos([])).toEqual([]);
  });
});

describe("precioPorMetro", () => {
  it("divide precio entre metros", () => {
    expect(precioPorMetro(prop({ precioUsd: 200000, metros: 100 }))).toBe(2000);
  });

  it("devuelve null en vez de Infinity si los metros son 0", () => {
    // Dividir por cero daría Infinity y la interfaz mostraría "$Infinity/m²"
    expect(precioPorMetro(prop({ metros: 0 }))).toBeNull();
  });
});

describe("construirFilas · quién gana cada fila", () => {
  const fila = (props: Propiedad[], etiqueta: string) =>
    construirFilas(props).find((f) => f.etiqueta === etiqueta)!;

  it("en precio gana el MENOR", () => {
    const f = fila([prop({ precioUsd: 200000 }), prop({ precioUsd: 100000 })], "Precio");
    expect(f.ganadores).toEqual([1]);
  });

  it("en metros gana el MAYOR", () => {
    const f = fila([prop({ metros: 80 }), prop({ metros: 150 })], "Metros²");
    expect(f.ganadores).toEqual([1]);
  });

  it("en precio por m² gana el menor, aunque el precio total sea mayor", () => {
    // 300.000/200m² = 1.500/m²  vs  200.000/100m² = 2.000/m²
    const f = fila(
      [prop({ precioUsd: 300000, metros: 200 }), prop({ precioUsd: 200000, metros: 100 })],
      "Precio por m²",
    );
    expect(f.ganadores).toEqual([0]);
  });

  it("si EMPATAN, nadie gana (marcar un empate como victoria es engañar)", () => {
    const f = fila([prop({ precioUsd: 100000 }), prop({ precioUsd: 100000 })], "Precio");
    expect(f.ganadores).toEqual([]);
  });

  it("con una sola propiedad no hay ganadores", () => {
    const f = fila([prop()], "Precio");
    expect(f.ganadores).toEqual([]);
  });

  it("puede haber varios ganadores si comparten el mejor valor", () => {
    const f = fila(
      [prop({ metros: 200 }), prop({ metros: 200 }), prop({ metros: 100 })],
      "Metros²",
    );
    expect(f.ganadores).toEqual([0, 1]);
  });

  it("una fila con datos faltantes no rompe la comparación", () => {
    const f = fila([prop({ metros: 0 }), prop({ metros: 100 })], "Precio por m²");
    expect(f.valores[0]).toBeNull();
    expect(f.ganadores).toEqual([]); // menos de dos valores válidos
  });
});

describe("urlComparacion", () => {
  it("arma la URL compartible", () => {
    expect(urlComparacion(["GV4PE", "K7LPG"])).toBe("/comparar?p=GV4PE&p=K7LPG");
  });

  it("sin códigos devuelve la ruta limpia", () => {
    expect(urlComparacion([])).toBe("/comparar");
  });

  it("nunca pasa de MAX_COMPARAR", () => {
    const url = urlComparacion(["AAAAA", "BBBBB", "CCCCC", "DDDDD"]);
    expect(url.match(/p=/g)).toHaveLength(MAX_COMPARAR);
  });

  it("lo que sale de urlComparacion vuelve a entrar por normalizarCodigos", () => {
    // ida y vuelta: la URL que generamos tiene que ser la que sabemos leer
    const codigos = ["GV4PE", "K7LPG"];
    const url = new URL(urlComparacion(codigos), "https://x.com");
    expect(normalizarCodigos(url.searchParams.getAll("p"))).toEqual(codigos);
  });
});

describe("un dato faltante NO puede ganar (bug real que encontró el gate)", () => {
  const fila = (props: Propiedad[], etiqueta: string) =>
    construirFilas(props).find((f) => f.etiqueta === etiqueta)!;

  it("un precio en 0 se trata como AUSENTE, no como el precio más bajo", () => {
    // Number(null) === 0. Si 0 se tomara como valor, con criterio
    // "menor es mejor" el dato faltante GANARÍA la fila.
    const f = fila([prop({ precioUsd: 0 }), prop({ precioUsd: 300000 })], "Precio");
    expect(f.valores[0]).toBeNull();
    expect(f.ganadores).not.toContain(0);
    expect(f.ganadores).toEqual([]); // menos de dos valores válidos
  });

  it("un precio negativo tampoco gana", () => {
    const f = fila([prop({ precioUsd: -5 }), prop({ precioUsd: 100 })], "Precio");
    expect(f.valores[0]).toBeNull();
    expect(f.ganadores).toEqual([]);
  });

  it("metros en 0 se trata como ausente", () => {
    const f = fila([prop({ metros: 0 }), prop({ metros: 100 })], "Metros²");
    expect(f.valores[0]).toBeNull();
  });

  it("NaN e Infinity se tratan como ausentes", () => {
    const f = fila([prop({ precioUsd: NaN }), prop({ precioUsd: Infinity })], "Precio");
    expect(f.valores).toEqual([null, null]);
    expect(f.ganadores).toEqual([]);
  });

  it("con un precio ausente, el otro NO gana solo por existir", () => {
    // Marcar "mejor" cuando no hay con qué comparar sería engañoso.
    const f = fila([prop({ precioUsd: 0 }), prop({ precioUsd: 200000 })], "Precio");
    expect(f.ganadores).toEqual([]);
  });

  it("0 habitaciones SÍ es un valor válido: un estudio existe", () => {
    const f = fila([prop({ habitaciones: 0 }), prop({ habitaciones: 3 })], "Habitaciones");
    expect(f.valores[0]).toBe(0);
    expect(f.ganadores).toEqual([1]); // mayor es mejor: el 0 no gana
  });
});
