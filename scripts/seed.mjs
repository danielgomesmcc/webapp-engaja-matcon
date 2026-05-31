import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
const defaultPassword = process.env.DEFAULT_USER_PASSWORD || "Mudar!123";

if (!url || !secret) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env.local");
  process.exit(1);
}

const db = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const ADMIN_COUNT = 10;
const USER_COUNT = 100;

async function main() {
  console.log("→ Inicializando seed de dados no Supabase...");

  // 1. Departamentos
  const departments = [
    "Comercial",
    "Marketing",
    "Produto",
    "Financeiro",
    "Contabilidade",
    "Administrativo",
    "RH",
  ];
  console.log("→ Inserindo departamentos…");
  await db
    .from("departments")
    .upsert(
      departments.map((name) => ({ name })),
      { onConflict: "name", ignoreDuplicates: true }
    );
  const { data: deptRows } = await db.from("departments").select("id, name");
  const deptIds = (deptRows ?? []).map((d) => d.id);
  console.log(`   - ${deptIds.length} departamentos encontrados.`);

  // 2. Princípios (7)
  const principles = [
    "Trabalho em Equipe",
    "Respeito",
    "Inovação",
    "Comprometimento",
    "Foco no Cliente",
    "Integridade",
    "Excelência",
  ];
  console.log("→ Inserindo princípios…");
  for (let i = 0; i < principles.length; i++) {
    await db.from("company_principles").upsert({
      name: principles[i],
      sort_order: i,
      active: true,
    }, { onConflict: "name" });
  }

  // 3. Ciclo vigente (4 semanas)
  console.log("→ Inserindo ciclo ativo…");
  const { count: cycleCount } = await db
    .from("cycles")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);
  if (!cycleCount) {
    const start = new Date();
    const end = new Date(start.getTime() + 28 * 24 * 60 * 60 * 1000);
    await db.from("cycles").insert({
      name: `Ciclo ${start.toLocaleDateString("pt-BR")}`,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      is_active: true,
    });
  }

  // 4. Obter usuários existentes do Supabase Auth para evitar duplicações
  console.log("→ Listando usuários do Auth...");
  const { data: { users: authUsers }, error: listError } = await db.auth.admin.listUsers({
    perPage: 200
  });
  if (listError) {
    console.error("Erro ao listar usuários do Auth:", listError.message);
    process.exit(1);
  }
  const existingEmails = new Set((authUsers ?? []).map((u) => u.email));

  // 5. Cadastrar os 100 usuários
  console.log(`→ Criando ${USER_COUNT} usuários no Auth (usuario001..usuario100)...`);
  for (let i = 1; i <= USER_COUNT; i++) {
    const n = String(i).padStart(3, "0");
    const username = `usuario${n}`;
    const email = `usuario${n}@matcon.com.br`;
    const fullName = `Usuário ${n}`;
    const role = i <= ADMIN_COUNT ? "admin" : "user";
    const deptId = deptIds.length ? deptIds[i % deptIds.length] : null;

    let authId = null;

    if (!existingEmails.has(email)) {
      const { data: newUser, error: createError } = await db.auth.admin.createUser({
        email,
        password: defaultPassword,
        email_confirm: true,
        user_metadata: {
          username,
          full_name: fullName,
          role,
          must_change_password: true
        }
      });

      if (createError) {
        console.error(`Erro ao criar ${username}:`, createError.message);
      } else {
        authId = newUser.user.id;
        console.log(`   + Criado: ${username}`);
      }
    } else {
      const existingUser = authUsers.find(u => u.email === email);
      authId = existingUser.id;
      console.log(`   ~ Já existe: ${username}`);
    }

    // Atualizar dados de departamento no profile gerado pelo trigger
    if (authId) {
      const { error: updateError } = await db
        .from("profiles")
        .update({
          department_id: deptId,
          job_title: role === "admin" ? "Gerente / Administrador" : "Colaborador Operacional",
          admission_date: new Date().toISOString().split("T")[0]
        })
        .eq("id", authId);

      if (updateError) {
        console.error(`Erro ao atualizar profile do ${username}:`, updateError.message);
      }
    }
  }

  // 6. Criar um Quiz inicial de teste
  console.log("→ Inserindo quiz demonstrativo...");
  const { data: quizData, error: quizError } = await db.from("quizzes").insert({
    title: "Treinamento de Integração Matcon",
    description: "Avaliação rápida sobre as normas e valores da empresa.",
    category: "Geral",
    time_limit_seconds: 60,
    base_points: 100,
    is_active: true
  }).select("id").maybeSingle();

  if (quizData) {
    const q1 = await db.from("quiz_questions").insert({
      quiz_id: quizData.id,
      statement: "Qual é a missão principal da Matcon?",
      weight: 1,
      sort_order: 1
    }).select("id").maybeSingle();

    if (q1.data) {
      await db.from("quiz_options").insert([
        { question_id: q1.data.id, text: "Garantir a satisfação e engajamento dos colaboradores", is_correct: true, sort_order: 1 },
        { question_id: q1.data.id, text: "Apenas vender materiais de construção sem foco em pessoas", is_correct: false, sort_order: 2 },
        { question_id: q1.data.id, text: "Competir sem ética no mercado", is_correct: false, sort_order: 3 },
      ]);
    }
  }

  // 7. Criar uma Votação inicial de teste
  console.log("→ Inserindo votação demonstrativa...");
  const { data: pollData } = await db.from("polls").insert({
    title: "Escolha o tema da próxima SIPAT",
    description: "Ajude-nos a definir a prioridade de palestras deste ano.",
    type: "single",
    is_active: true
  }).select("id").maybeSingle();

  if (pollData) {
    await db.from("poll_options").insert([
      { poll_id: pollData.id, text: "Saúde Mental no Trabalho", sort_order: 1 },
      { poll_id: pollData.id, text: "Ergonomia e Segurança de Equipamentos", sort_order: 2 },
      { poll_id: pollData.id, text: "Alimentação Saudável e Prática de Exercícios", sort_order: 3 },
    ]);
  }

  console.log("✅ Seed finalizado com sucesso!");
}

main().catch((e) => {
  console.error("Erro fatal no seed:", e);
  process.exit(1);
});
