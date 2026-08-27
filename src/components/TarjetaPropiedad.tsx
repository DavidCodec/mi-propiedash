import { formatearBs, formatearUsd, type Propiedad } from "@/lib/propiedades";

/**
 * Tarjeta de propiedad. Componente de servidor (no lleva 'use client'):
 * no necesita estado ni eventos, así que NO se manda JavaScript al navegador.
 * Esa es la regla por defecto en Propiedash.
 */
export function TarjetaPropiedad({ propiedad }: { propiedad: Propiedad }) {
  const enVenta = propiedad.operacion === "en_venta";

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-card">
      <div className="relative flex h-44 items-center justify-center bg-canvas">
        <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-ink">
          {enVenta ? "En venta" : "En alquiler"}
        </span>
        <svg
          className="size-10 text-dim"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 10.5 12 4l9 6.5" />
          <path d="M5 9.5V20h14V9.5" />
          <path d="M9 20v-6h6v6" />
        </svg>
      </div>

      <div className="p-4">
        <p className="text-2xl font-bold tracking-tight">
          {formatearUsd(propiedad.precioUsd)}
          {!enVenta && <span className="text-base font-normal text-muted">/mes</span>}
        </p>
        <p className="text-sm text-muted">{formatearBs(propiedad.precioUsd)}</p>

        <h2 className="mt-2 font-semibold">{propiedad.titulo}</h2>
        <p className="text-sm text-muted">
          {propiedad.zona} · {propiedad.ciudad}
        </p>

        <div className="mt-3 flex gap-4 border-t border-line pt-3 text-sm text-muted">
          <span>
            <b className="text-ink">{propiedad.habitaciones}</b> hab
          </span>
          <span>
            <b className="text-ink">{propiedad.banos}</b> baños
          </span>
          <span>
            <b className="text-ink">{propiedad.metros}</b> m²
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="font-mono text-xs uppercase text-dim">{propiedad.dashcode}</span>
          <span className="text-muted">
            Agente <b className="text-ink">{propiedad.dashtag}</b>
          </span>
        </div>
      </div>
    </article>
  );
}
