-- =====================================================================
-- Engaja — Plataforma Corporativa de Engajamento
-- Migration 0001: Schema Inicial Completo
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Enums ----------
do $$ begin
  create type role_type as enum ('admin', 'user');
exception when duplicate_object then null; end $$;

do $$ begin
  create type recognition_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type vote_type as enum ('single', 'multiple', 'yesno');
exception when duplicate_object then null; end $$;

do $$ begin
  create type training_status as enum ('in_progress', 'approved', 'failed');
exception when duplicate_object then null; end $$;

-- ---------- Departamentos ----------
create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

-- ---------- Perfis (profiles vinculados ao auth.users do Supabase) ----------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  email text unique,
  full_name text,
  role role_type not null default 'user',
  department_id uuid references departments(id) on delete set null,
  job_title text,
  phone text,
  admission_date date,
  avatar_url text,
  points integer not null default 0,
  must_change_password boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_email on profiles(email);
create index if not exists idx_profiles_username on profiles(username);
create index if not exists idx_profiles_department on profiles(department_id);

-- ---------- Princípios Corporativos (company_principles) ----------
create table if not exists company_principles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  active boolean not null default true,
  sort_order integer not null default 0
);

-- ---------- Ciclos Semanais/Mensais ----------
create table if not exists cycles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- Reconhecimentos ----------
create table if not exists recognitions (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references profiles(id) on delete cascade,
  receiver_id uuid not null references profiles(id) on delete cascade,
  principle_id uuid references company_principles(id) on delete set null,
  cycle_id uuid references cycles(id) on delete set null,
  message text not null,
  status recognition_status not null default 'pending',
  points integer not null default 10, -- cada elogio gera 10 pontos
  reviewed_by uuid references profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_recognitions_receiver on recognitions(receiver_id);
create index if not exists idx_recognitions_cycle on recognitions(cycle_id);

-- ---------- Funcionário do Mês (employee_of_month) ----------
create table if not exists employee_of_month (
  id uuid primary key default gen_random_uuid(),
  year integer not null,
  month integer not null,
  user_id uuid references profiles(id) on delete set null,
  total_recognitions integer not null default 0,
  distinct_principles integer not null default 0,
  top_principle_id uuid references company_principles(id) on delete set null,
  awarded_at timestamptz not null default now(),
  unique (year, month)
);

-- ---------- Quiz ----------
create table if not exists quizzes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  time_limit_seconds integer,
  base_points integer not null default 100,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  statement text not null,
  weight integer not null default 1,
  sort_order integer not null default 0
);

create table if not exists quiz_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references quiz_questions(id) on delete cascade,
  text text not null,
  is_correct boolean not null default false,
  sort_order integer not null default 0
);

create table if not exists quiz_results (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  score integer not null default 0,
  correct_count integer not null default 0,
  total_time_seconds integer not null default 0,
  completed_at timestamptz not null default now(),
  unique (quiz_id, user_id)
);

-- ---------- Votações (polls) ----------
create table if not exists polls (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  type vote_type not null default 'single',
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls(id) on delete cascade,
  text text not null,
  sort_order integer not null default 0
);

create table if not exists poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls(id) on delete cascade,
  option_id uuid not null references poll_options(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (poll_id, option_id, user_id)
);

create index if not exists idx_poll_votes_user on poll_votes(poll_id, user_id);

-- ---------- Treinamentos ----------
create table if not exists trainings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  is_mandatory boolean not null default false,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists training_contents (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null references trainings(id) on delete cascade,
  title text not null,
  type text not null, -- 'video', 'pdf', 'image', 'text'
  url text, -- URL do arquivo no bucket
  text_content text, -- texto livre
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists training_tests (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null references trainings(id) on delete cascade,
  num_questions integer not null default 5,
  time_limit_seconds integer,
  min_score integer not null default 70,
  created_at timestamptz not null default now()
);

create table if not exists training_results (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null references trainings(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  score integer not null default 0,
  status training_status not null default 'in_progress',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (training_id, user_id)
);

create table if not exists certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  training_id uuid not null references trainings(id) on delete cascade,
  score integer not null default 0,
  url text not null, -- link do PDF do certificado no storage
  issued_at timestamptz not null default now(),
  unique (user_id, training_id)
);

-- ---------- Comunicação (home_announcements) ----------
create table if not exists home_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------- Notificações ----------
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on notifications(user_id, read);

-- ---------- Logs de Auditoria ----------
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  action text not null,
  entity text,
  entity_id uuid,
  meta jsonb,
  created_at timestamptz not null default now()
);

-- ---------- Trigger de criação automática do Profile no Auth.users ----------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id,
    username,
    email,
    full_name,
    role,
    must_change_password,
    is_active
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::role_type, 'user'::role_type),
    coalesce((new.raw_user_meta_data->>'must_change_password')::boolean, true),
    true
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- Triggers para Atualização de Pontos / Auditoria ----------
-- Função de incremento de pontos
create or replace function public.add_points_to_user()
returns trigger as $$
begin
  if new.status = 'approved' and (old.status is null or old.status <> 'approved') then
    update public.profiles
    set points = points + new.points
    where id = new.receiver_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_recognition_approved
  after update of status on recognitions
  for each row execute procedure public.add_points_to_user();

-- ---------- Habilitação de RLS em todas as tabelas ----------
alter table departments enable row level security;
alter table profiles enable row level security;
alter table company_principles enable row level security;
alter table cycles enable row level security;
alter table recognitions enable row level security;
alter table employee_of_month enable row level security;
alter table quizzes enable row level security;
alter table quiz_questions enable row level security;
alter table quiz_options enable row level security;
alter table quiz_results enable row level security;
alter table polls enable row level security;
alter table poll_options enable row level security;
alter table poll_votes enable row level security;
alter table trainings enable row level security;
alter table training_contents enable row level security;
alter table training_tests enable row level security;
alter table training_results enable row level security;
alter table certificates enable row level security;
alter table home_announcements enable row level security;
alter table notifications enable row level security;
alter table audit_logs enable row level security;
