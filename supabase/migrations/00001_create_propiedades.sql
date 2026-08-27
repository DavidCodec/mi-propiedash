-- 00001_create_propiedades.sql
--
-- Crea la tabla de propiedades y ACTIVA RLS sin ninguna policy, a propósito.
-- Resultado esperado: la app va a leer y recibir una lista VACÍA, sin error.
-- La policy de lectura llega en 00002. Esto es un ejercicio de aprendizaje;
-- en producción NO se deja una tabla sin policies.

create table if not exists public.propiedades (
  id            uuid primary key default gen_random_uuid(),
  dashcode      text not null unique,
  titulo        text not null,
  zona          text not null,
  ciudad        text not null,
  precio_usd    numeric not null check (precio_usd > 0),
  operacion     text not null check (operacion in ('en_venta', 'en_alquiler')),
  habitaciones  int  not null check (habitaciones >= 0),
  banos         int  not null check (banos >= 0),
  metros        int  not null check (metros > 0),
  dashtag       text not null,
  creado_en     timestamptz not null default now()
);

-- Índices para lo que de verdad se filtra en un buscador inmobiliario.
create index if not exists propiedades_operacion_idx on public.propiedades (operacion);
create index if not exists propiedades_ciudad_idx    on public.propiedades (ciudad);
create index if not exists propiedades_precio_idx    on public.propiedades (precio_usd);

-- RLS: activado. Sin policies todavía → niega todo.
alter table public.propiedades enable row level security;

-- Datos de ejemplo (los mismos 6 que hoy están escritos en el código).
insert into public.propiedades
  (dashcode, titulo, zona, ciudad, precio_usd, operacion, habitaciones, banos, metros, dashtag)
values
  ('GV4PE', 'Apartamento en Prados del Este',   'Prados del Este',   'Caracas',   245000, 'en_venta',    3, 3, 165, '@georgecodec'),
  ('K7LPG', 'Penthouse en Los Palos Grandes',   'Los Palos Grandes', 'Caracas',   420000, 'en_venta',    4, 4, 280, '@georgecodec'),
  ('M2CHU', 'Casa en Chuao',                    'Chuao',             'Caracas',   610000, 'en_venta',    5, 5, 450, '@mariainmuebles'),
  ('R9ALT', 'Apartamento en Altamira',          'Altamira',          'Caracas',     1800, 'en_alquiler', 2, 2, 110, '@mariainmuebles'),
  ('T5MAR', 'Apartamento en Maracaibo Centro',  'Centro',            'Maracaibo',  68000, 'en_venta',    3, 2, 130, '@zuliaprops'),
  ('W3VAL', 'Townhouse en El Trigal',           'El Trigal',         'Valencia',     950, 'en_alquiler', 3, 3, 190, '@zuliaprops')
on conflict (dashcode) do nothing;

-- LA LÍNEA QUE NO SE OLVIDA. Toda migración que cambie la estructura la lleva.
-- Sin esto, la capa que le sirve datos al sitio se queda con la estructura vieja
-- y las ESCRITURAS fallan en silencio (las lecturas siguen andando).
notify pgrst, 'reload schema';
