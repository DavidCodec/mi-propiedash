-- 00004_propiedades_publicar.sql
--
-- Hasta ahora `propiedades` era solo lectura pública: cualquiera lee, nadie
-- escribe (ni con sesión). Para el formulario de publicar hay que abrir la
-- escritura, pero atada al dueño.

-- Quién publicó cada propiedad. Nullable porque las 6 filas de ejemplo ya
-- existen sin dueño. `on delete set null` para que borrar un usuario no borre
-- las propiedades del mercado.
alter table public.propiedades
  add column if not exists publicado_por uuid references auth.users(id) on delete set null;

create index if not exists propiedades_publicado_por_idx
  on public.propiedades (publicado_por);

-- CREAR: con sesión, y solo a tu propio nombre.
create policy "propiedades_insert_propias"
  on public.propiedades
  for insert
  to authenticated
  with check (publicado_por = auth.uid());

-- EDITAR: solo tus propiedades, y el resultado también debe seguir siendo tuyo.
-- OJO: un update necesita LAS DOS cláusulas.
--   using      → cuáles filas te deja tocar
--   with check → cómo debe quedar la fila DESPUÉS
-- Sin el `with check`, podrías editar tu propia propiedad y cambiarle
-- `publicado_por` al ID de otro usuario: te la regalarías (o se la
-- endosarías) sin permiso. El `using` solo por sí mismo no lo impide.
create policy "propiedades_update_propias"
  on public.propiedades
  for update
  to authenticated
  using (publicado_por = auth.uid())
  with check (publicado_por = auth.uid());

-- BORRAR: solo tus propiedades.
create policy "propiedades_delete_propias"
  on public.propiedades
  for delete
  to authenticated
  using (publicado_por = auth.uid());

-- Nota: la policy de SELECT público de 00002 sigue intacta. Cualquiera puede
-- LEER todas las propiedades (es un marketplace), pero solo el dueño escribe
-- las suyas. Ese es exactamente el modelo de Propiedash.

-- Cambiamos estructura (columna nueva) → esta línea SÍ va.
notify pgrst, 'reload schema';
