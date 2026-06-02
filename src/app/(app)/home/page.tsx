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

  // Carregar todas as informações em paralelo para evitar o efeito cascata (waterfall) e reduzir o tempo de resposta
  const [
    profileRes,
    announcementsRes,
    activeQuizzesRes,
    userQuizResultsRes,
    activePollsRes,
    userVotesRes,
    allTrainingsRes,
    userCompletedTrainingsRes,
    rankingRes,
    employeeOfMonthRes,
    principlesRes,
    collaboratorsRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*, departments(name)")
      .eq("id", user.id)
      .single(),
    supabase
      .from("home_announcements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("quizzes")
      .select("id")
      .eq("is_active", true),
    supabase
      .from("quiz_results")
      .select("quiz_id")
      .eq("user_id", user.id),
    supabase
      .from("polls")
      .select("id")
      .eq("is_active", true),
    supabase
      .from("poll_votes")
      .select("poll_id")
      .eq("user_id", user.id),
    supabase
      .from("trainings")
      .select("id"),
    supabase
      .from("training_results")
      .select("training_id")
      .eq("user_id", user.id)
      .eq("status", "approved"),
    supabase
      .from("profiles")
      .select("id, username, full_name, points, departments(name)")
      .eq("is_active", true)
      .order("points", { ascending: false })
      .limit(10),
    supabase
      .from("employee_of_month")
      .select("*, profiles(*, departments(name)), company_principles(name)")
      .order("awarded_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("company_principles")
      .select("*")
      .eq("active", true)
      .order("sort_order"),
    supabase
      .from("profiles")
      .select("id, username, full_name")
      .eq("is_active", true)
      .neq("id", user.id)
      .order("full_name"),
  ]);

  const profile = profileRes.data;
  const announcements = announcementsRes.data;
  const activeQuizzes = activeQuizzesRes.data;
  const userQuizResults = userQuizResultsRes.data;
  const activePolls = activePollsRes.data;
  const userVotes = userVotesRes.data;
  const allTrainings = allTrainingsRes.data;
  const userCompletedTrainings = userCompletedTrainingsRes.data;
  const ranking = rankingRes.data;
  const employeeOfMonth = employeeOfMonthRes.data;
  const principles = principlesRes.data;
  const collaborators = collaboratorsRes.data;

  const activeQuizzesSet = new Set((activeQuizzes ?? []).map((q) => q.id));
  const userQuizResultsSet = new Set((userQuizResults ?? []).map((r) => r.quiz_id));

  let pendingQuizzes = 0;
  for (const qId of activeQuizzesSet) {
    if (!userQuizResultsSet.has(qId)) {
      pendingQuizzes++;
    }
  }

  const activePollsSet = new Set((activePolls ?? []).map((p) => p.id));
  const userVotesSet = new Set((userVotes ?? []).map((v) => v.poll_id));

  let pendingPolls = 0;
  for (const pId of activePollsSet) {
    if (!userVotesSet.has(pId)) {
      pendingPolls++;
    }
  }

  const allTrainingsSet = new Set((allTrainings ?? []).map((t) => t.id));
  const userCompletedTrainingsSet = new Set((userCompletedTrainings ?? []).map((tc) => tc.training_id));

  let pendingTrainings = 0;
  for (const tId of allTrainingsSet) {
    if (!userCompletedTrainingsSet.has(tId)) {
      pendingTrainings++;
    }
  }

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
