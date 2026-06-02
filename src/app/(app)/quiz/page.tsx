import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import QuizListClient from "./QuizListClient";

export default async function QuizPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Buscar quizzes ativos e resultados do usuário em paralelo
  const [quizzesRes, userResultsRes] = await Promise.all([
    supabase
      .from("quizzes")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("quiz_results")
      .select("quiz_id, score, correct_count")
      .eq("user_id", user.id),
  ]);

  const quizzes = quizzesRes.data;
  const userResults = userResultsRes.data;

  return (
    <QuizListClient
      quizzes={quizzes || []}
      initialResults={userResults || []}
      profileId={user.id}
    />
  );
}
