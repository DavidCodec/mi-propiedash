"use client";

import { useCallback, useSyncExternalStore } from "react";
import { MAX_COMPARAR } from "@/lib/comparar";

const CLAVE = "propiedash:comparar";
const EVENTO = "propiedash:comparar-cambio";

/**
 * Snapshot del servidor: siempre vacío y SIEMPRE la misma referencia.
 *
 * Congelado porque esta referencia SALE al público a través de `codigos`: si
 * un consumidor le hiciera un `.sort()` o un `.push()`, corrompería el
 * snapshot compartido de todos.
 */
const VACIO: readonly string[] = Object.freeze([]);

// Caché de referencia. `useSyncExternalStore` exige que getSnapshot devuelva
// la MISMA referencia mientras el dato no cambie; si devolviera un array nuevo
// en cada llamada, React entraría en un bucle infinito de renders.
let cacheRaw: string | null = null;
let cacheValor: readonly string[] = VACIO;

function leerSnapshot(): readonly string[] {
  let raw: string | null = null;
  try {
    // localStorage LANZA en modo privado de algunos navegadores y cuando el
    // usuario bloquea datos de sitio. Nunca se accede sin try/catch.
    raw = localStorage.getItem(CLAVE);
  } catch {
    return VACIO;
  }

  if (raw === cacheRaw) return cacheValor; // misma referencia: no re-renderiza

  cacheRaw = raw;
  try {
    const arr = raw ? JSON.parse(raw) : [];
    cacheValor = Array.isArray(arr)
      ? arr.filter((x): x is string => typeof x === "string").slice(0, MAX_COMPARAR)
      : VACIO;
  } catch {
    cacheValor = VACIO;
  }
  return cacheValor;
}

function suscribir(alCambiar: () => void): () => void {
  // El evento propio avisa a los componentes de ESTA pestaña (el botón de cada
  // tarjeta y la barra de abajo). El 'storage' del navegador solo se dispara
  // en OTRAS pestañas, así que hacen falta los dos.
  window.addEventListener(EVENTO, alCambiar);
  window.addEventListener("storage", alCambiar);
  return () => {
    window.removeEventListener(EVENTO, alCambiar);
    window.removeEventListener("storage", alCambiar);
  };
}

function escribir(codigos: readonly string[]) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(codigos));
  } catch {
    // Si no se puede guardar, la app sigue funcionando; no se rompe nada.
  }
  window.dispatchEvent(new CustomEvent(EVENTO));
}

/**
 * Estado compartido de las propiedades fijadas para comparar.
 *
 * Vive en localStorage porque tiene que sobrevivir la navegación (fijas una,
 * sigues buscando, fijas otra) y porque comparar debe funcionar SIN sesión.
 * Es estado por navegador: no viaja a otros dispositivos, y para esto está bien.
 *
 * Se usa `useSyncExternalStore` y no `useState` + `useEffect`: es la API que
 * React tiene para suscribirse a un estado que vive FUERA de React, y resuelve
 * el render del servidor con `getServerSnapshot` sin desajustes de hidratación
 * ni renders en cascada.
 */
export function useComparar() {
  const codigos = useSyncExternalStore(suscribir, leerSnapshot, () => VACIO);

  const alternar = useCallback((dashcode: string) => {
    const actuales = leerSnapshot();

    // Lleno y no está: no se hace NADA. Antes se reescribía el mismo valor y
    // se disparaba el evento, provocando un re-render sin cambio real.
    if (!actuales.includes(dashcode) && actuales.length >= MAX_COMPARAR) return;

    const siguiente = actuales.includes(dashcode)
      ? actuales.filter((c) => c !== dashcode)
      : [...actuales, dashcode];
    escribir(siguiente);
  }, []);

  const quitar = useCallback((dashcode: string) => {
    escribir(leerSnapshot().filter((c) => c !== dashcode));
  }, []);

  const limpiar = useCallback(() => escribir([]), []);

  return {
    codigos,
    lleno: codigos.length >= MAX_COMPARAR,
    tiene: (dashcode: string) => codigos.includes(dashcode),
    alternar,
    quitar,
    limpiar,
  };
}
