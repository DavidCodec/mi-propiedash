import { describe, expect, it } from "vitest";
import { propiedadSchema } from "./esquemas";

/**
 * Este es el esquema que valida en el navegador Y en el servidor.
 * Si estas pruebas pasan, las dos validaciones están cubiertas de un tiro.
 */

const valida = {
  titulo: "Apartamento en Prados del Este",
  zona: "Prados del Este",
  ciudad: "Caracas",
  precioUsd: "245000",
  operacion: "en_venta",
  habitaciones: "3",
  banos: "3",
  metros: "165",
  dashtag: "@georgecodec",
};

describe("propiedadSchema", () => {
  it("acepta una propiedad bien formada", () => {
    const r = propiedadSchema.safeParse(valida);
    expect(r.success).toBe(true);
  });

  it("convierte los textos del formulario a números (los inputs dan strings)", () => {
    const r = propiedadSchema.parse(valida);
    expect(r.precioUsd).toBe(245000);
    expect(typeof r.precioUsd).toBe("number");
    expect(typeof r.metros).toBe("number");
  });

  it("rechaza un título demasiado corto", () => {
    const r = propiedadSchema.safeParse({ ...valida, titulo: "Casa" });
    expect(r.success).toBe(false);
  });

  it("rechaza precio en 0 y negativo", () => {
    expect(propiedadSchema.safeParse({ ...valida, precioUsd: "0" }).success).toBe(false);
    expect(propiedadSchema.safeParse({ ...valida, precioUsd: "-5000" }).success).toBe(false);
  });

  it("rechaza un precio que no es número", () => {
    expect(propiedadSchema.safeParse({ ...valida, precioUsd: "carísimo" }).success).toBe(false);
  });

  it("rechaza una operación inventada", () => {
    expect(propiedadSchema.safeParse({ ...valida, operacion: "en_permuta" }).success).toBe(false);
  });

  it("exige el formato del Dashtag: @ y minúsculas", () => {
    expect(propiedadSchema.safeParse({ ...valida, dashtag: "georgecodec" }).success).toBe(false);
    expect(propiedadSchema.safeParse({ ...valida, dashtag: "@GeorgeCodec" }).success).toBe(false);
    expect(propiedadSchema.safeParse({ ...valida, dashtag: "@ge" }).success).toBe(false);
    expect(propiedadSchema.safeParse({ ...valida, dashtag: "@george_codec" }).success).toBe(true);
  });

  it("recorta los espacios de los textos", () => {
    const r = propiedadSchema.parse({ ...valida, titulo: "   Apartamento en Chuao   " });
    expect(r.titulo).toBe("Apartamento en Chuao");
  });

  it("rechaza metros en 0", () => {
    expect(propiedadSchema.safeParse({ ...valida, metros: "0" }).success).toBe(false);
  });
});
