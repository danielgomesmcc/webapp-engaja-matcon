-- ---------- Adiciona campo is_anonymous na tabela polls ----------
alter table polls add column if not exists is_anonymous boolean not null default false;
