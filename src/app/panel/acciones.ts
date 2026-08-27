"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function guardarFavorito(formData: FormData) {
  const dashcode = String(formData.get("dashcode") ?? "");
  const supabase = await createClient();

  const { data: sesion } = await supabase.auth.getUser();
  if (!sesion.user) return;

  // Mandamos usuario_id explícitamente porque la policy de insert lo exige
  // (`with check (usuario_id = auth.uid())`). Si mandáramos el de otro
  // usuario, la base rechaza la fila con 42501.
  const { error } = await supabase
    .from("favoritos")
    .insert({ usuario_id: sesion.user.id, dashcode });

  if (error) console.error("[guardarFavorito]", error.message);
  revalidatePath("/panel");
}

export async function quitarFavorito(formData: FormData) {
  const dashcode = String(formData.get("dashcode") ?? "");
  const supabase = await createClient();

  // Sin `.eq("usuario_id", ...)`: RLS ya impide borrar lo de otro.
  const { error } = await supabase.from("favoritos").delete().eq("dashcode", dashcode);

  if (error) console.error("[quitarFavorito]", error.message);
  revalidatePath("/panel");
}
