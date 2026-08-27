-- 00003_create_favoritos.sql
--
-- Tabla de favoritos por usuario. Aquí RLS deja de ser "público sí / público no"
-- y pasa a filtrar FILA POR FILA según quién pregunta: auth.uid().

create table if not exists public.favoritos (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null references auth.users(id) on delete cascade,
  dashcode    text not null references public.propiedades(dashcode) on delete cascade,
  creado_en   timestamptz not null default now(),
  -- Un usuario no puede guardar dos veces la misma propiedad.
  unique (usuario_id, dashcode)
);

create index if not exists favoritos_usuario_idx on public.favoritos (usuario_id);

alter table public.favoritos enable row level security;

-- LEER: solo tus propias filas.
create policy "favoritos_select_propios"
  on public.favoritos
  for select
  to authenticated
  using (usuario_id = auth.uid());

-- CREAR: solo puedes crear filas que te pertenezcan a TI.
-- Ojo con la diferencia: `using` filtra filas QUE YA EXISTEN;
-- `with check` valida filas NUEVAS (o el resultado de un update).
-- Sin este `with check`, un usuario podría insertar un favorito a nombre de otro.
create policy "favoritos_insert_propios"
  on public.favoritos
  for insert
  to authenticated
  with check (usuario_id = auth.uid());

-- BORRAR: solo tus propias filas.
create policy "favoritos_delete_propios"
  on public.favoritos
  for delete
  to authenticated
  using (usuario_id = auth.uid());

-- Nota: `anon` no aparece en ninguna policy. Un visitante sin sesión no puede
-- leer, crear ni borrar favoritos de nadie. No hace falta prohibirlo: RLS
-- niega por defecto y aquí simplemente nunca le dimos permiso.

-- Estructura nueva → esta línea SÍ va.
notify pgrst, 'reload schema';
