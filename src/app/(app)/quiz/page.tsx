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

  // Buscar todos os quizzes ativos
  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  // Buscar resultados de quizzes para este usuário específico
  const { data: userResults } = await supabase
    .from("quiz_results")
    .select("quiz_id, score, correct_count")
    .eq("user_id", user.id);

  return (
    <QuizListClient
      quizzes={quizzes || []}
      initialResults={userResults || []}
      profileId={user.id}
    />
  );
}
