-- =============================================
-- PrestaControl NI - Schema Supabase
-- Ejecuta esto en el SQL Editor de Supabase
-- =============================================

-- Tabla de usuarios con roles
create table if not exists public.usuarios (
  id uuid references auth.users on delete cascade primary key,
  rol text not null default 'cobrador' check (rol in ('admin', 'cobrador')),
  nombre text,
  created_at timestamptz default now()
);

-- Tabla de préstamos
create table if not exists public.prestamos (
  id bigserial primary key,
  nombre text not null,
  telefono text,
  monto numeric(12,2) not null,
  interes numeric(5,2) not null default 10,
  total numeric(12,2) not null,
  n_cuotas int not null,
  frecuencia_dias int not null default 7,
  created_at timestamptz default now()
);

-- Tabla de cuotas
create table if not exists public.cuotas (
  id bigserial primary key,
  prestamo_id bigint references public.prestamos on delete cascade not null,
  num int not null,
  monto numeric(12,2) not null,
  fecha date not null,
  pagada boolean not null default false,
  fecha_pago date,
  created_at timestamptz default now()
);

-- Índices
create index if not exists cuotas_prestamo_id_idx on public.cuotas(prestamo_id);
create index if not exists cuotas_pagada_idx on public.cuotas(pagada);

-- RLS (Row Level Security)
alter table public.usuarios enable row level security;
alter table public.prestamos enable row level security;
alter table public.cuotas enable row level security;

-- Políticas: usuarios autenticados pueden leer/escribir todo
create policy "Autenticados pueden leer usuarios" on public.usuarios
  for select using (auth.role() = 'authenticated');

create policy "Autenticados pueden leer prestamos" on public.prestamos
  for all using (auth.role() = 'authenticated');

create policy "Autenticados pueden leer cuotas" on public.cuotas
  for all using (auth.role() = 'authenticated');

-- Trigger: crear registro en usuarios al registrarse
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.usuarios (id, rol)
  values (new.id, 'cobrador');
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================
-- DESPUÉS de crear los usuarios en Auth,
-- cambia el rol del admin así:
--
-- update public.usuarios
-- set rol = 'admin'
-- where id = '<UUID del admin>';
-- =============================================
