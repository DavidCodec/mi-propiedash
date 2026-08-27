"use server";

import { redirect } from "next/navigation";
import { enviarMensajeContacto } from "@/lib/email";
import { obtenerPropiedades } from "@/lib/propiedades";

/**
 * Server Action. Corre EN EL SERVIDOR: es el único lugar desde donde se puede
 * tocar RESEND_API_KEY. Nunca desde un componente de cliente.
 */
export async function enviarContacto(formData: FormData) {
  const dashcode = String(formData.get("dashcode") ?? "");
  const nombre = String(formData.get("nombre") ?? "").trim();
  const correo = String(formData.get("correo") ?? "").trim();
  const mensaje = String(formData.get("mensaje") ?? "").trim();

  // Validación en el SERVIDOR. El `required` del HTML es una cortesía para el
  // usuario, no una defensa: cualquiera puede mandar la petición sin pasar por
  // el formulario. En el proyecto 12 esto se hace bien, con zod.
  if (!nombre || !correo || !mensaje) {
    redirect(`/contactar/${dashcode}?error=Faltan+datos`);
  }

  // No confiamos en el dashcode que llega del formulario: lo verificamos
  // contra los datos reales antes de usarlo.
  const propiedades = await obtenerPropiedades();
  const propiedad = propiedades.find((p) => p.dashcode === dashcode);
  if (!propiedad) {
    redirect(`/contactar/${dashcode}?error=Esa+propiedad+no+existe`);
  }

  try {
    await enviarMensajeContacto({
      dashcode,
      tituloPropiedad: propiedad.titulo,
      nombre,
      correo,
      mensaje,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    redirect(`/contactar/${dashcode}?error=${encodeURIComponent(msg)}`);
  }

  redirect(`/contactar/${dashcode}?enviado=1`);
}
