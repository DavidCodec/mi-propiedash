import "server-only";
import { Resend } from "resend";

/**
 * Envío de correo transaccional con Resend.
 *
 * `import "server-only"` en la primera línea es deliberado: si alguien importa
 * este archivo desde un componente de cliente, EL BUILD FALLA. Es la misma
 * barrera que protege a `admin.ts` en el repo real de Propiedash.
 *
 * ¿Por qué hace falta? Porque RESEND_API_KEY es un secreto de verdad. Si este
 * código terminara en el bundle del navegador, la llave viajaría a cada
 * visitante. `server-only` convierte ese error en un build roto, que es el
 * único momento en que un error de seguridad sale gratis.
 */

/** Sin dominio verificado, Resend SOLO permite enviar desde esta dirección. */
const REMITENTE = "Mi Propiedash <onboarding@resend.dev>";

export type MensajeContacto = {
  dashcode: string;
  tituloPropiedad: string;
  nombre: string;
  correo: string;
  mensaje: string;
};

export async function enviarMensajeContacto(m: MensajeContacto) {
  const apiKey = process.env.RESEND_API_KEY;
  const destino = process.env.RESEND_TO;

  if (!apiKey || !destino) {
    throw new Error(
      "Faltan RESEND_API_KEY o RESEND_TO en .env.local. " +
        "¿Reiniciaste npm run dev después de agregarlas?",
    );
  }

  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from: REMITENTE,
    to: [destino],
    // El correo del interesado va en replyTo, no en `from`: si pusiéramos su
    // correo como remitente, el correo se marcaría como falsificado (SPF/DKIM
    // no lo autorizan) y caería en spam. Así, al responder, le respondes a él.
    replyTo: m.correo,
    subject: `Nuevo interesado en ${m.tituloPropiedad} (${m.dashcode})`,
    html: `
      <div style="font-family:system-ui,sans-serif;line-height:1.5;color:#0A0A0A">
        <h2 style="margin:0 0 4px">Nuevo mensaje de un interesado</h2>
        <p style="margin:0 0 16px;color:#525249">
          Propiedad <strong>${m.tituloPropiedad}</strong> · DASHCODE
          <code>${m.dashcode}</code>
        </p>
        <p style="margin:0"><strong>Nombre:</strong> ${m.nombre}</p>
        <p style="margin:0 0 16px"><strong>Correo:</strong> ${m.correo}</p>
        <p style="margin:0 0 4px"><strong>Mensaje:</strong></p>
        <p style="margin:0;padding:12px;background:#F7F7F5;border-radius:8px">${m.mensaje}</p>
      </div>
    `,
  });

  if (error) {
    console.error("[enviarMensajeContacto] Resend:", error);
    throw new Error(error.message);
  }

  console.log("[enviarMensajeContacto] enviado, id:", data?.id);
  return data;
}
