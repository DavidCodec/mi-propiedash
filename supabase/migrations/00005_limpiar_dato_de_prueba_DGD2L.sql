-- 00005_limpiar_dato_de_prueba_DGD2L.sql
--
-- Limpieza de UN dato de prueba que quedó en la tabla al probar el formulario
-- de publicar: DASHCODE DGD2L, título "holaaaaaa", ciudad y zona "asdasd".
-- Aparecía en el selector público de ciudades de /buscar.
--
-- OJO: esto BORRA DATOS. No hay papelera. Por eso el archivo va en tres pasos
-- y se corre en orden, mirando la salida de cada uno antes de seguir.
--
-- No lleva `notify pgrst, 'reload schema';`: no cambia la estructura de la
-- base, solo el contenido. PostgREST cachea la forma, no las filas.

-- ── PASO 1. Mirar EXACTAMENTE qué se va a borrar. Corre solo esto primero. ──
select dashcode, titulo, zona, ciudad, precio_usd, operacion, dashtag, creado_en
from public.propiedades
where dashcode = 'DGD2L';
-- Esperado: 1 fila, la de "holaaaaaa". Si sale otra cosa, PARA.


-- ── PASO 2. Ver el radio de impacto: qué MÁS se borra en cascada. ──
-- favoritos.dashcode tiene `on delete cascade`, así que borrar la propiedad
-- borra también cualquier favorito que apunte a ella.
select f.id, f.usuario_id, f.dashcode, f.creado_en
from public.favoritos f
where f.dashcode = 'DGD2L';
-- Si devuelve filas, esos favoritos DESAPARECEN con el borrado. Decide si
-- te importa antes de seguir.


-- ── PASO 3. El borrado. Corre esto solo cuando los pasos 1 y 2 cuadren. ──
-- Se apunta por `dashcode`, que es UNIQUE, y no por `where ciudad = 'asdasd'`.
-- Un delete se apunta por clave, no por una condición que mañana puede
-- coincidir con filas que no querías tocar.
delete from public.propiedades
where dashcode = 'DGD2L';
-- Esperado: "DELETE 1". Si dice 0, no se borró (revisa el paso 1).
-- Si dice más de 1, algo está muy mal: dashcode es UNIQUE.


-- ── PASO 4. Confirmar. ──
select count(*) as propiedades_restantes from public.propiedades;
-- Esperado: 7 (eran 8).

select distinct ciudad from public.propiedades order by ciudad;
-- Esperado: sin 'asdasd'.
