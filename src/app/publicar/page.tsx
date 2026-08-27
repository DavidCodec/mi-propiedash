import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FormularioPublicar } from "./formulario";

export default async function Publicar() {
  // Página protegida, igual que /panel: solo un agente con sesión publica.
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/iniciar-sesion");

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <Link href="/" className="text-sm text-muted">
        ← Volver a las propiedades
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">Publicar propiedad</h1>
      <p className="mt-1 text-muted">
        Los datos se validan en el navegador y otra vez en el servidor, con el
        mismo esquema. El DASHCODE se genera solo.
      </p>

      <FormularioPublicar dashtagSugerido="@georgecodec" />
    </main>
  );
}
