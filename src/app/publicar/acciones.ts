"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { propiedadSchema } from "@/lib/esquemas";

/** Genera un DASHCODE con el formato real: 5 caracteres alfanuméricos en mayúscula. */
function generarDashcode(): string {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin I, O, 0, 1: se confunden al dictarlos
  let out = "";
  for (let i = 0; i < 5; i++) {
    out += alfabeto[Math.floor(Math.random() * alfabeto.length)];
  }
  return out;
}

export type Resultado =
  | { ok: true; dashcode: string }
  | { ok: false; error: string };

export async function publicarPropiedad(datos: unknown): Promise<Resultado> {
  // 1. VALIDAR EN EL SERVIDOR, con el mismo esquema del formulario.
  //    No importa que el cliente ya validó: esta petición pudo llegar por curl.
  const parsed = propiedadSchema.safeParse(datos);
  if (!parsed.success) {
    const primero = parsed.error.issues[0];
    return { ok: false, error: `${primero.path.join(".")}: ${primero.message}` };
  }
  const p = parsed.data;

  // 2. ¿Hay sesión? La policy lo exige, pero fallar aquí da mejor mensaje.
  const supabase = await createClient();
  const { data: sesion } = await supabase.auth.getUser();
  if (!sesion.user) {
    return { ok: false, error: "Tienes que iniciar sesión para publicar." };
  }

  // 3. Insertar. Reintentamos si el DASHCODE al azar choca con uno existente
  //    (Postgres devuelve 23505 = unique_violation).
  for (let intento = 0; intento < 5; intento++) {
    const dashcode = generarDashcode();

    const { error } = await supabase.from("propiedades").insert({
      dashcode,
      titulo: p.titulo,
      zona: p.zona,
      ciudad: p.ciudad,
      precio_usd: p.precioUsd,
      operacion: p.operacion,
      habitaciones: p.habitaciones,
      banos: p.banos,
      metros: p.metros,
      dashtag: p.dashtag,
      // La policy exige `publicado_por = auth.uid()`. Si mandáramos otro ID,
      // la base rechaza la fila con 42501.
      publicado_por: sesion.user.id,
    });

    if (!error) {
      revalidatePath("/");
      return { ok: true, dashcode };
    }

    if (error.code === "23505") continue; // choque de dashcode: otro intento

    console.error("[publicarPropiedad]", error.code, error.message);
    return { ok: false, error: `${error.code}: ${error.message}` };
  }

  return { ok: false, error: "No se pudo generar un DASHCODE único. Intenta de nuevo." };
}
