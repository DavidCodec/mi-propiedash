import { z } from "zod";

/**
 * EL esquema de una propiedad. Uno solo, compartido.
 *
 * Esto es el corazón del proyecto 12: el MISMO esquema valida en el navegador
 * y en el servidor.
 *
 *  - En el navegador → buena experiencia: el usuario ve el error al instante,
 *    sin recargar y sin perder lo que escribió.
 *  - En el servidor  → seguridad: cualquiera puede mandar una petición sin
 *    pasar por tu formulario (curl, Postman, la consola del navegador).
 *
 * Validar solo en el cliente NO es validar: es maquillar. Validar solo en el
 * servidor funciona, pero la experiencia es mala. Se hacen las dos, y con un
 * solo esquema para que no se desincronicen nunca.
 */
export const propiedadSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(8, "El título necesita al menos 8 caracteres")
    .max(120, "El título es demasiado largo"),

  zona: z.string().trim().min(3, "Indica la zona"),
  ciudad: z.string().trim().min(3, "Indica la ciudad"),

  // coerce porque un <input> siempre entrega texto, nunca número.
  precioUsd: z.coerce
    .number({ message: "El precio debe ser un número" })
    .positive("El precio debe ser mayor que 0")
    .max(100_000_000, "Ese precio no parece real"),

  operacion: z.enum(["en_venta", "en_alquiler"], {
    message: "Elige si es venta o alquiler",
  }),

  habitaciones: z.coerce.number().int().min(0).max(50),
  banos: z.coerce.number().int().min(0).max(50),
  metros: z.coerce.number().int().positive("Los metros deben ser mayores que 0").max(100_000),

  dashtag: z
    .string()
    .trim()
    .regex(/^@[a-z0-9_]{3,30}$/, "El Dashtag va en minúsculas, tipo @miagencia"),
});

export type PropiedadForm = z.input<typeof propiedadSchema>;
export type PropiedadValida = z.output<typeof propiedadSchema>;
