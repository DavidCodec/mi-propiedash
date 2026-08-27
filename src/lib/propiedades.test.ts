import { describe, expect, it } from "vitest";
import { formatearBs, formatearUsd, normalizarOperacion, TASA_BCV } from "./propiedades";

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
