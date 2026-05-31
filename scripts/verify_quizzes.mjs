import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !secret) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env.local");
  process.exit(1);
}

const db = createClient(url, secret);

async function check() {
  console.log("→ Buscando quizzes recentes no banco de dados...");
  
  // Buscar quizzes ordenados por data de criação descrescente
  const { data: quizzes, error } = await db
    .from("quizzes")
    .select("id, title, description, time_limit_seconds, base_points, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Erro ao buscar quizzes:", error.message);
    return;
  }

  if (!quizzes || quizzes.length === 0) {
    console.log("Nenhum quiz encontrado.");
    return;
  }

  console.log(`\nEncontrados ${quizzes.length} quizzes recentes:`);
  for (const q of quizzes) {
    console.log(`\n----------------------------------------`);
    console.log(`Título: ${q.title}`);
    console.log(`Descrição: ${q.description || "Sem descrição"}`);
    console.log(`Tempo Limite Total: ${q.time_limit_seconds} segundos`);
    console.log(`Pontos Base: ${q.base_points}`);
    console.log(`Criado em: ${q.created_at}`);

    // Buscar perguntas desse quiz
    const { data: questions, error: qErr } = await db
      .from("quiz_questions")
      .select("id, statement, sort_order")
      .eq("quiz_id", q.id)
      .order("sort_order");

    if (qErr) {
      console.error(`  Erro ao carregar perguntas:`, qErr.message);
      continue;
    }

    console.log(`Perguntas (${questions.length}):`);
    for (const qst of questions) {
      console.log(`  - [Q${qst.sort_order}] ${qst.statement}`);
      
      // Buscar opções para essa pergunta
      const { data: options, error: oErr } = await db
        .from("quiz_options")
        .select("text, is_correct, sort_order")
        .eq("question_id", qst.id)
        .order("sort_order");

      if (oErr) {
        console.error(`    Erro ao carregar alternativas:`, oErr.message);
        continue;
      }

      for (const opt of options) {
        console.log(`    * [${opt.sort_order}] ${opt.text} ${opt.is_correct ? "✓ (Correta)" : ""}`);
      }
    }
  }
}

check().catch(console.error);
