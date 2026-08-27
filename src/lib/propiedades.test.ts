import { describe, expect, it } from "vitest";
import {
  formatearBs,
  formatearUsd,
  normalizarCiudad,
  normalizarOperacion,
  primerValor,
  TASA_BCV,
  tituloDeBusqueda,
} from "./propiedades";

/**
 * Se prueba la LÓGICA con reglas, no el framework.
 * Nada de aquí toca la base de datos ni el navegador: son funciones puras.
 */

describe("formatearUsd", () => {
  it("usa el símbolo $ y separadores de miles, como el sitio real", () => {
    expect(formatearUsd(245000)).toBe("$245,000");
    expect(formatearUsd(1800)).toBe("$1,800");
  });

  it("NO escribe 'USD' (fue un bug real: Intl con es-VE devolvía 'USD 245.000')", () => {
    expect(formatearUsd(245000)).not.toContain("USD");
  });

  it("no muestra decimales", () => {
    expect(formatearUsd(199999.99)).toBe("$200,000");
  });

  it("aguanta el cero sin romperse", () => {
    expect(formatearUsd(0)).toBe("$0");
  });
});

describe("formatearBs", () => {
  it("usa el prefijo 'Bs. ' y la tasa BCV", () => {
    expect(formatearBs(1000)).toBe(`Bs. ${(1000 * TASA_BCV).toLocaleString("es-VE", { maximumFractionDigits: 0 })}`);
  });

  it("NO escribe 'Bs.S' (otro bug real del formateo por locale)", () => {
    expect(formatearBs(245000)).not.toContain("Bs.S");
  });

  it("convierte, no solo formatea: el monto en Bs es mayor que el de USD", () => {
    expect(formatearBs(100).replace(/\D/g, "")).not.toBe("100");
  });
});

describe("normalizarOperacion", () => {
  it("acepta las dos operaciones que existen", () => {
    expect(normalizarOperacion("en_venta")).toBe("en_venta");
    expect(normalizarOperacion("en_alquiler")).toBe("en_alquiler");
  });

  it("ignora cualquier basura que llegue por la URL", () => {
    // El caso que probamos a mano: /buscar?operacion=basura
    expect(normalizarOperacion("basura")).toBeUndefined();
    expect(normalizarOperacion("EN_VENTA")).toBeUndefined(); // sensible a mayúsculas, a propósito
    expect(normalizarOperacion("venta")).toBeUndefined();
    expect(normalizarOperacion("")).toBeUndefined();
    expect(normalizarOperacion(undefined)).toBeUndefined();
  });

  it("no deja pasar intentos de inyección por la URL", () => {
    expect(normalizarOperacion("en_venta' OR 1=1--")).toBeUndefined();
  });
});

describe("primerValor", () => {
  it("devuelve el string tal cual", () => {
    expect(primerValor("Caracas")).toBe("Caracas");
  });

  it("toma el primero cuando el parámetro llega repetido en la URL", () => {
    // ?ciudad=Caracas&ciudad=Valencia → Next entrega un array
    expect(primerValor(["Caracas", "Valencia"])).toBe("Caracas");
  });

  it("aguanta undefined y el array vacío", () => {
    expect(primerValor(undefined)).toBeUndefined();
    expect(primerValor([])).toBeUndefined();
  });
});

describe("normalizarOperacion con arrays", () => {
  it("no deja pasar un array hasta la consulta (era un bug real)", () => {
    expect(normalizarOperacion(["en_alquiler", "en_venta"])).toBe("en_alquiler");
    expect(normalizarOperacion(["basura"])).toBeUndefined();
  });
});

describe("normalizarCiudad", () => {
  const validas = ["Caracas", "Maracaibo", "Valencia"];

  it("acepta una ciudad que existe", () => {
    expect(normalizarCiudad("Caracas", validas)).toBe("Caracas");
  });

  it("ignora una ciudad inventada en vez de filtrar por ella", () => {
    // Antes: ?ciudad=Bogota daba 0 resultados y el selector en blanco
    expect(normalizarCiudad("Bogota", validas)).toBeUndefined();
  });

  it("es sensible a mayúsculas y acentos, como los datos de la tabla", () => {
    expect(normalizarCiudad("caracas", validas)).toBeUndefined();
  });

  it("ignora arrays con valores inválidos y acepta el primero si es válido", () => {
    expect(normalizarCiudad(["Valencia", "Bogota"], validas)).toBe("Valencia");
    expect(normalizarCiudad(["Bogota", "Caracas"], validas)).toBeUndefined();
  });

  it("con la lista vacía no acepta nada", () => {
    expect(normalizarCiudad("Caracas", [])).toBeUndefined();
  });
});

describe("tituloDeBusqueda", () => {
  it("combina ciudad y operación", () => {
    expect(tituloDeBusqueda("Caracas", "en_alquiler")).toBe(
      "Propiedades en alquiler en Caracas",
    );
    expect(tituloDeBusqueda("Valencia", "en_venta")).toBe("Propiedades en venta en Valencia");
  });

  it("funciona con un solo filtro", () => {
    expect(tituloDeBusqueda("Caracas", undefined)).toBe("Propiedades en Caracas");
    expect(tituloDeBusqueda(undefined, "en_venta")).toBe("Propiedades en venta");
  });

  it("sin filtros da el título genérico", () => {
    expect(tituloDeBusqueda(undefined, undefined)).toBe("Buscar propiedades");
  });

  it("nunca devuelve vacío: un <title> vacío es un error de SEO", () => {
    expect(tituloDeBusqueda(undefined, undefined).length).toBeGreaterThan(0);
  });
});
