-- =====================================================================
-- Migration 0002: RLS Policies
-- Evita a recursão infinita usando o metadado role do auth.jwt()
-- =====================================================================

-- ---------- 1. departments ----------
drop policy if exists "Allow read for authenticated users" on departments;
create policy "Allow read for authenticated users" on departments
  for select to authenticated using (true);

drop policy if exists "Allow write for admins" on departments;
create policy "Allow write for admins" on departments
  for all to authenticated using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- ---------- 2. profiles ----------
drop policy if exists "Allow read for authenticated users" on profiles;
create policy "Allow read for authenticated users" on profiles
  for select to authenticated using (true);

drop policy if exists "Allow update for users on their own profile" on profiles;
create policy "Allow update for users on their own profile" on profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "Allow insert for users on their own profile" on profiles;
create policy "Allow insert for users on their own profile" on profiles
  for insert to authenticated with check (id = auth.uid());

drop policy if exists "Allow all for admins" on profiles;
create policy "Allow all for admins" on profiles
  for all to authenticated using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- ---------- 3. company_principles ----------
drop policy if exists "Allow read for authenticated users" on company_principles;
create policy "Allow read for authenticated users" on company_principles
  for select to authenticated using (true);

drop policy if exists "Allow write for admins" on company_principles;
create policy "Allow write for admins" on company_principles
  for all to authenticated using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- ---------- 4. cycles ----------
drop policy if exists "Allow read for authenticated users" on cycles;
create policy "Allow read for authenticated users" on cycles
  for select to authenticated using (true);

drop policy if exists "Allow write for admins" on cycles;
create policy "Allow write for admins" on cycles
  for all to authenticated using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- ---------- 5. recognitions ----------
drop policy if exists "Allow read for authenticated users" on recognitions;
create policy "Allow read for authenticated users" on recognitions
  for select to authenticated using (true);

drop policy if exists "Allow insert for authenticated users (sender)" on recognitions;
create policy "Allow insert for authenticated users (sender)" on recognitions
  for insert to authenticated with check (sender_id = auth.uid());

drop policy if exists "Allow update/delete for admins" on recognitions;
create policy "Allow update/delete for admins" on recognitions
  for all to authenticated using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- ---------- 6. employee_of_month ----------
drop policy if exists "Allow read for authenticated users" on employee_of_month;
create policy "Allow read for authenticated users" on employee_of_month
  for select to authenticated using (true);

drop policy if exists "Allow write for admins" on employee_of_month;
create policy "Allow write for admins" on employee_of_month
  for all to authenticated using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- ---------- 7. quizzes ----------
drop policy if exists "Allow read for authenticated users" on quizzes;
create policy "Allow read for authenticated users" on quizzes
  for select to authenticated using (true);

drop policy if exists "Allow write for admins" on quizzes;
create policy "Allow write for admins" on quizzes
  for all to authenticated using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- ---------- 8. quiz_questions ----------
drop policy if exists "Allow read for authenticated users" on quiz_questions;
create policy "Allow read for authenticated users" on quiz_questions
  for select to authenticated using (true);

drop policy if exists "Allow write for admins" on quiz_questions;
create policy "Allow write for admins" on quiz_questions
  for all to authenticated using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- ---------- 9. quiz_options ----------
drop policy if exists "Allow read for authenticated users" on quiz_options;
create policy "Allow read for authenticated users" on quiz_options
  for select to authenticated using (true);

drop policy if exists "Allow write for admins" on quiz_options;
create policy "Allow write for admins" on quiz_options
  for all to authenticated using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- ---------- 10. quiz_results ----------
drop policy if exists "Allow read for authenticated users" on quiz_results;
create policy "Allow read for authenticated users" on quiz_results
  for select to authenticated using (true);

drop policy if exists "Allow insert for users on their own result" on quiz_results;
create policy "Allow insert for users on their own result" on quiz_results
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "Allow update/delete for admins" on quiz_results;
create policy "Allow update/delete for admins" on quiz_results
  for all to authenticated using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- ---------- 11. polls ----------
drop policy if exists "Allow read for authenticated users" on polls;
create policy "Allow read for authenticated users" on polls
  for select to authenticated using (true);

drop policy if exists "Allow write for admins" on polls;
create policy "Allow write for admins" on polls
  for all to authenticated using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- ---------- 12. poll_options ----------
drop policy if exists "Allow read for authenticated users" on poll_options;
create policy "Allow read for authenticated users" on poll_options
  for select to authenticated using (true);

drop policy if exists "Allow write for admins" on poll_options;
create policy "Allow write for admins" on poll_options
  for all to authenticated using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- ---------- 13. poll_votes ----------
drop policy if exists "Allow read for authenticated users" on poll_votes;
create policy "Allow read for authenticated users" on poll_votes
  for select to authenticated using (true);

drop policy if exists "Allow insert for users on their own vote" on poll_votes;
create policy "Allow insert for users on their own vote" on poll_votes
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "Allow write for admins" on poll_votes;
create policy "Allow write for admins" on poll_votes
  for all to authenticated using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- ---------- 14. trainings ----------
drop policy if exists "Allow read for authenticated users" on trainings;
create policy "Allow read for authenticated users" on trainings
  for select to authenticated using (true);

drop policy if exists "Allow write for admins" on trainings;
create policy "Allow write for admins" on trainings
  for all to authenticated using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- ---------- 15. training_contents ----------
drop policy if exists "Allow read for authenticated users" on training_contents;
create policy "Allow read for authenticated users" on training_contents
  for select to authenticated using (true);

drop policy if exists "Allow write for admins" on training_contents;
create policy "Allow write for admins" on training_contents
  for all to authenticated using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- ---------- 16. training_tests ----------
drop policy if exists "Allow read for authenticated users" on training_tests;
create policy "Allow read for authenticated users" on training_tests
  for select to authenticated using (true);

drop policy if exists "Allow write for admins" on training_tests;
create policy "Allow write for admins" on training_tests
  for all to authenticated using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- ---------- 17. training_results ----------
drop policy if exists "Allow read for authenticated users" on training_results;
create policy "Allow read for authenticated users" on training_results
  for select to authenticated using (true);

drop policy if exists "Allow insert for users on their own result" on training_results;
create policy "Allow insert for users on their own result" on training_results
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "Allow update for users on their own result" on training_results;
create policy "Allow update for users on their own result" on training_results
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Allow write for admins" on training_results;
create policy "Allow write for admins" on training_results
  for all to authenticated using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- ---------- 18. certificates ----------
drop policy if exists "Allow read for users on their own certificate" on certificates;
create policy "Allow read for users on their own certificate" on certificates
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "Allow read for admins" on certificates;
create policy "Allow read for admins" on certificates
  for select to authenticated using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

drop policy if exists "Allow write for admins" on certificates;
create policy "Allow write for admins" on certificates
  for all to authenticated using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- ---------- 19. home_announcements ----------
drop policy if exists "Allow read for authenticated users" on home_announcements;
create policy "Allow read for authenticated users" on home_announcements
  for select to authenticated using (true);

drop policy if exists "Allow write for admins" on home_announcements;
create policy "Allow write for admins" on home_announcements
  for all to authenticated using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- ---------- 20. notifications ----------
drop policy if exists "Allow read/update for users on their own notifications" on notifications;
create policy "Allow read/update for users on their own notifications" on notifications
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "Allow update for users on their own notifications" on notifications;
create policy "Allow update for users on their own notifications" on notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Allow write for admins" on notifications;
create policy "Allow write for admins" on notifications
  for all to authenticated using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- ---------- 21. audit_logs ----------
drop policy if exists "Allow read/write for admins" on audit_logs;
create policy "Allow read/write for admins" on audit_logs
  for all to authenticated using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
