import Link from "next/link";
import { TarjetaPropiedad } from "@/components/TarjetaPropiedad";
import { obtenerPropiedades } from "@/lib/propiedades";

export default async function Home() {
  const propiedades = await obtenerPropiedades();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
        <h1 className="text-3xl font-bold tracking-tight">Mi Propiedash</h1>
        <p className="text-muted">
          {propiedades.length} propiedades encontradas · precios en USD con
          conversión a Bs a la tasa BCV
        </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/publicar"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-ink"
          >
            Publicar propiedad
          </Link>
          <Link
            href="/panel"
            className="rounded-lg border border-line bg-card px-4 py-2 text-sm font-semibold"
          >
            Panel del agente
          </Link>
        </div>
      </header>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {propiedades.map((propiedad) => (
          <TarjetaPropiedad key={propiedad.dashcode} propiedad={propiedad} />
        ))}
      </div>
    </main>
  );
}
