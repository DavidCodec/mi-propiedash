import { createClient } from "@/lib/supabase/server";

export type Favorito = {
  dashcode: string;
  titulo: string;
  precioUsd: number;
  creadoEn: string;
};

/**
 * Trae los favoritos DEL USUARIO CON SESIÓN.
 *
 * Fíjate en lo que NO hay aquí: ningún `.eq("usuario_id", ...)`.
 * No filtramos por usuario en el código. Lo hace RLS en la base, con
 * `usuario_id = auth.uid()`. Aunque alguien logre ejecutar esta consulta con
 * otra sesión, la base solo le devolverá SUS filas.
 *
 * Esa es la diferencia entre "filtrar" y "proteger": un filtro en el código
 * se puede olvidar o saltar; una policy no.
 */
export async function obtenerFavoritos(): Promise<Favorito[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("favoritos")
    .select("dashcode, creado_en, propiedades(titulo, precio_usd)")
    .order("creado_en", { ascending: false });

  if (error) {
    console.error("[obtenerFavoritos]", error.message);
    throw error;
  }

  type Fila = {
    dashcode: string;
    creado_en: string;
    propiedades: { titulo: string; precio_usd: number } | null;
  };

  return (data as unknown as Fila[]).map((f) => ({
    dashcode: f.dashcode,
    titulo: f.propiedades?.titulo ?? f.dashcode,
    precioUsd: Number(f.propiedades?.precio_usd ?? 0),
    creadoEn: f.creado_en,
  }));
}
