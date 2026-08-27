-- 00002_rls_propiedades_lectura_publica.sql
--
-- La tabla `propiedades` tiene RLS activo y CERO policies, así que niega todo:
-- la API devuelve 200 con `[]`. Aquí agregamos el único permiso que necesita
-- un listado público: LEER.
--
-- Nota: NO agregamos policies de insert/update/delete a propósito. Nadie debe
-- poder escribir con la llave pública. Eso llega en el proyecto 12, atado a un
-- usuario con sesión.

create policy "propiedades_select_publico"
  on public.propiedades
  for select
  to anon, authenticated
  using (true);

-- ¿Por qué NO lleva `notify pgrst, 'reload schema';`?
-- Porque una policy no cambia la ESTRUCTURA (ni tabla, ni columna, ni función).
-- El schema cache de PostgREST guarda la forma de la base, no los permisos:
-- las policies las evalúa Postgres en cada consulta. La regla del `notify` es
-- para migraciones de estructura. Saber CUÁNDO aplica una regla vale más que
-- repetirla siempre por si acaso.
