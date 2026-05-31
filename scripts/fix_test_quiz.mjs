import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !secret) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env.local");
  process.exit(1);
}

const db = createClient(url, secret);

async function main() {
  console.log("→ Corrigindo tempo limite do quiz 'Teste 1' para 60 segundos por pergunta...");
  
  const { data, error } = await db
    .from("quizzes")
    .update({ time_limit_seconds: 60 })
    .eq("title", "Teste 1");

  if (error) {
    console.error("Erro ao atualizar:", error.message);
  } else {
    console.log("Sucesso! Tempo do quiz 'Teste 1' atualizado para 60s.");
  }
}

main().catch(console.error);
