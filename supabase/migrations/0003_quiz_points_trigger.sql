-- =====================================================================
-- Migration 0003: Quiz Points Trigger
-- Adiciona automaticamente os pontos do quiz ao perfil do usuário
-- =====================================================================

create or replace function public.add_quiz_points_to_user()
returns trigger as $$
begin
  update public.profiles
  set points = points + new.score
  where id = new.user_id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_quiz_result_inserted on quiz_results;
create trigger on_quiz_result_inserted
  after insert on quiz_results
  for each row execute procedure public.add_quiz_points_to_user();
