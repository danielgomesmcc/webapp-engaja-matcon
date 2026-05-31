import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import HomeClient from "./HomeClient";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const now = new Date().toISOString();

  // 1. Carregar perfil do usuário logado
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, departments(name)")
    .eq("id", user.id)
    .single();

  // 2. Carregar anúncios ativos (comunicados)
  const { data: announcements } = await supabase
    .from("home_announcements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  // 3. Contagens de itens pendentes (não respondidos)
  const { data: activeQuizzes } = await supabase
    .from("quizzes")
    .select("id")
    .eq("is_active", true);

  const { data: userQuizResults } = await supabase
    .from("quiz_results")
    .select("quiz_id")
    .eq("user_id", user.id);

  const activeQuizzesSet = new Set((activeQuizzes ?? []).map((q) => q.id));
  const userQuizResultsSet = new Set((userQuizResults ?? []).map((r) => r.quiz_id));

  let pendingQuizzes = 0;
  for (const qId of activeQuizzesSet) {
    if (!userQuizResultsSet.has(qId)) {
      pendingQuizzes++;
    }
  }

  const { data: activePolls } = await supabase
    .from("polls")
    .select("id")
    .eq("is_active", true);

  const { data: userVotes } = await supabase
    .from("poll_votes")
    .select("poll_id")
    .eq("user_id", user.id);

  const activePollsSet = new Set((activePolls ?? []).map((p) => p.id));
  const userVotesSet = new Set((userVotes ?? []).map((v) => v.poll_id));

  let pendingPolls = 0;
  for (const pId of activePollsSet) {
    if (!userVotesSet.has(pId)) {
      pendingPolls++;
    }
  }

  const { data: allTrainings } = await supabase
    .from("trainings")
    .select("id");

  const { data: userCompletedTrainings } = await supabase
    .from("training_results")
    .select("training_id")
    .eq("user_id", user.id)
    .eq("status", "approved");

  const allTrainingsSet = new Set((allTrainings ?? []).map((t) => t.id));
  const userCompletedTrainingsSet = new Set((userCompletedTrainings ?? []).map((tc) => tc.training_id));

  let pendingTrainings = 0;
  for (const tId of allTrainingsSet) {
    if (!userCompletedTrainingsSet.has(tId)) {
      pendingTrainings++;
    }
  }

  // 4. Ranking atual (Top 10 colaboradores por pontos)
  const { data: ranking } = await supabase
    .from("profiles")
    .select("id, username, full_name, points, departments(name)")
    .eq("is_active", true)
    .order("points", { ascending: false })
    .limit(10);

  // 5. Funcionário do mês mais recente
  const { data: employeeOfMonth } = await supabase
    .from("employee_of_month")
    .select("*, profiles(*, departments(name)), company_principles(name)")
    .order("awarded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // 6. Princípios para o fluxo de reconhecimento
  const { data: principles } = await supabase
    .from("company_principles")
    .select("*")
    .eq("active", true)
    .order("sort_order");

  // 7. Lista de usuários para o autocomplete do reconhecimento (excluindo o próprio usuário logado)
  const { data: collaborators } = await supabase
    .from("profiles")
    .select("id, username, full_name")
    .eq("is_active", true)
    .neq("id", user.id)
    .order("full_name");

  return (
    <HomeClient
      profile={profile}
      announcements={announcements || []}
      metrics={{
        quizzes: pendingQuizzes,
        polls: pendingPolls,
        trainings: pendingTrainings,
      }}
      ranking={ranking || []}
      employeeOfMonth={employeeOfMonth}
      principles={principles || []}
      collaborators={collaborators || []}
    />
  );
}
