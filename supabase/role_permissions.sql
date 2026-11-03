create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select lower(coalesce(p.rol, ''))
  from public.perfiles_usuario p
  where p.id = (select auth.uid())
  limit 1
$$;

revoke all on function public.current_app_role() from public;
grant execute on function public.current_app_role() to authenticated;

alter table public.perfiles_usuario enable row level security;
alter table public.materias enable row level security;
alter table public.semanas enable row level security;
alter table public.temas enable row level security;
alter table public.conocimientos_adquiridos enable row level security;
alter table public.evaluaciones enable row level security;
alter table public.examenes_guardados enable row level security;
alter table public.examenes_guardados_semanas enable row level security;

drop policy if exists "Usuarios pueden consultar su perfil y administradores todos"
  on public.perfiles_usuario;
create policy "Usuarios pueden consultar su perfil y administradores todos"
  on public.perfiles_usuario
  for select
  to authenticated
  using (
    id = (select auth.uid())
    or public.current_app_role() in ('admin', 'administrador')
  );

drop policy if exists "Administradores gestionan perfiles"
  on public.perfiles_usuario;
create policy "Administradores gestionan perfiles"
  on public.perfiles_usuario
  for all
  to authenticated
  using (public.current_app_role() in ('admin', 'administrador'))
  with check (public.current_app_role() in ('admin', 'administrador'));

drop policy if exists "Usuarios autenticados consultan materias"
  on public.materias;
create policy "Usuarios autenticados consultan materias"
  on public.materias
  for select
  to authenticated
  using (true);

drop policy if exists "Administradores gestionan materias"
  on public.materias;
create policy "Administradores gestionan materias"
  on public.materias
  for all
  to authenticated
  using (public.current_app_role() in ('admin', 'administrador'))
  with check (public.current_app_role() in ('admin', 'administrador'));

drop policy if exists "Usuarios autenticados consultan semanas"
  on public.semanas;
create policy "Usuarios autenticados consultan semanas"
  on public.semanas
  for select
  to authenticated
  using (true);

drop policy if exists "Administradores gestionan semanas"
  on public.semanas;
create policy "Administradores gestionan semanas"
  on public.semanas
  for all
  to authenticated
  using (public.current_app_role() in ('admin', 'administrador'))
  with check (public.current_app_role() in ('admin', 'administrador'));

drop policy if exists "Usuarios autenticados consultan temas"
  on public.temas;
create policy "Usuarios autenticados consultan temas"
  on public.temas
  for select
  to authenticated
  using (true);

drop policy if exists "Administradores gestionan temas"
  on public.temas;
create policy "Administradores gestionan temas"
  on public.temas
  for all
  to authenticated
  using (public.current_app_role() in ('admin', 'administrador'))
  with check (public.current_app_role() in ('admin', 'administrador'));

drop policy if exists "Usuarios autenticados consultan conocimientos adquiridos"
  on public.conocimientos_adquiridos;
create policy "Usuarios autenticados consultan conocimientos adquiridos"
  on public.conocimientos_adquiridos
  for select
  to authenticated
  using (true);

drop policy if exists "Administradores gestionan conocimientos adquiridos"
  on public.conocimientos_adquiridos;
create policy "Administradores gestionan conocimientos adquiridos"
  on public.conocimientos_adquiridos
  for all
  to authenticated
  using (public.current_app_role() in ('admin', 'administrador'))
  with check (public.current_app_role() in ('admin', 'administrador'));

drop policy if exists "Usuarios autenticados consultan evaluaciones"
  on public.evaluaciones;
create policy "Usuarios autenticados consultan evaluaciones"
  on public.evaluaciones
  for select
  to authenticated
  using (true);

drop policy if exists "Administradores gestionan evaluaciones"
  on public.evaluaciones;
create policy "Administradores gestionan evaluaciones"
  on public.evaluaciones
  for all
  to authenticated
  using (public.current_app_role() in ('admin', 'administrador'))
  with check (public.current_app_role() in ('admin', 'administrador'));

drop policy if exists "Usuarios autenticados pueden gestionar examenes"
  on public.examenes_guardados;
drop policy if exists "Administradores y docentes consultan examenes"
  on public.examenes_guardados;
create policy "Administradores y docentes consultan examenes"
  on public.examenes_guardados
  for select
  to authenticated
  using (
    public.current_app_role() in ('admin', 'administrador')
    or creador_id = (select auth.uid())
  );

drop policy if exists "Docentes crean sus examenes"
  on public.examenes_guardados;
create policy "Docentes crean sus examenes"
  on public.examenes_guardados
  for insert
  to authenticated
  with check (
    public.current_app_role() = 'docente'
    and creador_id = (select auth.uid())
  );

drop policy if exists "Docentes actualizan sus examenes"
  on public.examenes_guardados;
create policy "Docentes actualizan sus examenes"
  on public.examenes_guardados
  for update
  to authenticated
  using (
    public.current_app_role() = 'docente'
    and creador_id = (select auth.uid())
  )
  with check (
    public.current_app_role() = 'docente'
    and creador_id = (select auth.uid())
  );

drop policy if exists "Docentes eliminan sus examenes"
  on public.examenes_guardados;
create policy "Docentes eliminan sus examenes"
  on public.examenes_guardados
  for delete
  to authenticated
  using (
    public.current_app_role() = 'docente'
    and creador_id = (select auth.uid())
  );

drop policy if exists "Usuarios autenticados pueden gestionar semanas de examenes"
  on public.examenes_guardados_semanas;
drop policy if exists "Usuarios consultan semanas de sus examenes"
  on public.examenes_guardados_semanas;
create policy "Usuarios consultan semanas de sus examenes"
  on public.examenes_guardados_semanas
  for select
  to authenticated
  using (
    public.current_app_role() in ('admin', 'administrador')
    or exists (
      select 1
      from public.examenes_guardados e
      where e.id = examen_id
        and e.creador_id = (select auth.uid())
    )
  );

drop policy if exists "Docentes gestionan semanas de sus examenes"
  on public.examenes_guardados_semanas;
create policy "Docentes gestionan semanas de sus examenes"
  on public.examenes_guardados_semanas
  for all
  to authenticated
  using (
    public.current_app_role() = 'docente'
    and exists (
      select 1
      from public.examenes_guardados e
      where e.id = examen_id
        and e.creador_id = (select auth.uid())
    )
  )
  with check (
    public.current_app_role() = 'docente'
    and exists (
      select 1
      from public.examenes_guardados e
      where e.id = examen_id
        and e.creador_id = (select auth.uid())
    )
  );
