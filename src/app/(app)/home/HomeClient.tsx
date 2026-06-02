"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Autocomplete,
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MobileStepper,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  FormControlLabel,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  Paper,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import QuizRoundedIcon from "@mui/icons-material/QuizRounded";
import HowToVoteRoundedIcon from "@mui/icons-material/HowToVoteRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import AddCircleRoundedIcon from "@mui/icons-material/AddCircleRounded";
import LocalLibraryRoundedIcon from "@mui/icons-material/LocalLibraryRounded";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import { supabaseBrowser } from "@/lib/supabase/client";
import * as XLSX from "xlsx";

interface HomeClientProps {
  profile: any;
  announcements: any[];
  metrics: { quizzes: number; polls: number; trainings: number };
  ranking: any[];
  employeeOfMonth: any;
  principles: any[];
  collaborators: any[];
}

export default function HomeClient({
  profile,
  announcements,
  metrics,
  ranking,
  employeeOfMonth,
  principles,
  collaborators,
}: HomeClientProps) {
  const router = useRouter();

  // Dialogs control
  const [recognitionOpen, setRecognitionOpen] = useState(false);
  const [adminActionOpen, setAdminActionOpen] = useState<string | null>(null);

  // Recognition Wizard state
  const [wizardStep, setWizardStep] = useState(0);
  const [selectedPrinciple, setSelectedPrinciple] = useState("");
  const [behaviorText, setBehaviorText] = useState("");
  const [selectedCollaborator, setSelectedCollaborator] = useState<any>(null);
  const [recError, setRecError] = useState<string | null>(null);
  const [recSuccess, setRecSuccess] = useState<string | null>(null);
  const [recLoading, setRecLoading] = useState(false);

  // Admin form states
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminSuccess, setAdminSuccess] = useState<string | null>(null);

  // 1. Admin Quiz state
  const [quizTitle, setQuizTitle] = useState("");
  const [quizDesc, setQuizDesc] = useState("");
  const [quizTime, setQuizTime] = useState("60");
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [quizFileName, setQuizFileName] = useState("");
  const [quizCreationMethod, setQuizCreationMethod] = useState<"file" | "manual">("file");
  const [manualStatement, setManualStatement] = useState("");
  const [manualRespA, setManualRespA] = useState("");
  const [manualRespB, setManualRespB] = useState("");
  const [manualRespC, setManualRespC] = useState("");
  const [manualCorrect, setManualCorrect] = useState<"A" | "B" | "C">("A");

  // 2. Admin Poll state
  const [pollTitle, setPollTitle] = useState("");
  const [pollDesc, setPollDesc] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollIsAnonymous, setPollIsAnonymous] = useState(false);
  const [pollDurationDays, setPollDurationDays] = useState("7");
  const [pollDurationMinutes, setPollDurationMinutes] = useState("0");

  // 3. Admin Announcement state
  const [annTitle, setAnnTitle] = useState("");
  const [annDesc, setAnnDesc] = useState("");
  const [annImgUrl, setAnnImgUrl] = useState("");

  const getInitials = (name: string | null, username: string) => {
    const display = name || username;
    const parts = display.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
  };

  const handleOpenRecognition = () => {
    setWizardStep(0);
    setSelectedPrinciple("");
    setBehaviorText("");
    setSelectedCollaborator(null);
    setRecError(null);
    setRecSuccess(null);
    setRecognitionOpen(true);
  };

  const handleNextStep = () => {
    if (wizardStep === 0 && !selectedPrinciple) {
      setRecError("Selecione um princípio corporativo.");
      return;
    }
    if (wizardStep === 1 && !behaviorText.trim()) {
      setRecError("Descreva o comportamento observado.");
      return;
    }
    if (wizardStep === 2 && !selectedCollaborator) {
      setRecError("Selecione o colaborador a ser reconhecido.");
      return;
    }
    setRecError(null);
    setWizardStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setRecError(null);
    setWizardStep((prev) => prev - 1);
  };

  const submitRecognition = async () => {
    setRecLoading(true);
    setRecError(null);

    try {
      // Obter o ciclo ativo
      const { data: cycle } = await supabaseBrowser
        .from("cycles")
        .select("id")
        .eq("is_active", true)
        .maybeSingle();

      const { error } = await supabaseBrowser.from("recognitions").insert({
        sender_id: profile.id,
        receiver_id: selectedCollaborator.id,
        principle_id: selectedPrinciple,
        cycle_id: cycle?.id || null,
        message: behaviorText.trim(),
        status: "approved", // auto-aprovado para teste simplificado
        points: 10,
      });

      if (error) {
        setRecError(`Erro ao registrar: ${error.message}`);
        setRecLoading(false);
        return;
      }

      setRecSuccess("Reconhecimento enviado com sucesso! +10 pontos para seu colega.");
      setTimeout(() => {
        setRecognitionOpen(false);
        router.refresh();
      }, 2000);
    } catch (err: any) {
      setRecError(err?.message || "Ocorreu um erro no servidor.");
    } finally {
      setRecLoading(false);
    }
  };

  // ADMIN CRUDS
  const handleQuizFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setQuizFileName(file.name);
    setAdminError(null);
    setAdminSuccess(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
        
        if (rows.length <= 1) {
          throw new Error("A planilha está vazia ou não contém perguntas.");
        }

        const questions: any[] = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;
          
          const statement = row[0]?.toString().trim();
          const respA = row[1]?.toString().trim();
          const respB = row[2]?.toString().trim();
          const respC = row[3]?.toString().trim();
          const correctCol = row[4]?.toString().trim();

          // Ignorar linhas completamente vazias
          if (!statement && !respA && !respB && !respC && !correctCol) continue;

          if (!statement || !respA || !respB || !respC || !correctCol) {
            throw new Error(`A linha ${i + 1} está incompleta. Todos os campos são obrigatórios.`);
          }

          const correctLower = correctCol.toLowerCase();
          if (
            correctLower !== "resposta a" &&
            correctLower !== "resposta b" &&
            correctLower !== "resposta c"
          ) {
            throw new Error(
              `A coluna 'Resposta Correta' na linha ${i + 1} deve conter exatamente 'Resposta A', 'Resposta B' ou 'Resposta C'. Valor encontrado: '${correctCol}'`
            );
          }

          questions.push({
            statement,
            options: [
              { text: respA, is_correct: correctLower === "resposta a" },
              { text: respB, is_correct: correctLower === "resposta b" },
              { text: respC, is_correct: correctLower === "resposta c" },
            ],
          });
        }

        if (questions.length === 0) {
          throw new Error("Nenhuma pergunta válida encontrada na planilha.");
        }

        setQuizQuestions(questions);
        setAdminSuccess(`Planilha carregada! ${questions.length} perguntas identificadas.`);
      } catch (err: any) {
        setAdminError(`Erro ao ler planilha: ${err.message}`);
        setQuizFileName("");
        setQuizQuestions([]);
      }
    };

    reader.onerror = () => {
      setAdminError("Erro ao ler o arquivo.");
      setQuizFileName("");
      setQuizQuestions([]);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleCloseQuizDialog = () => {
    setAdminActionOpen(null);
    setQuizTitle("");
    setQuizDesc("");
    setQuizTime("60");
    setQuizFileName("");
    setQuizQuestions([]);
    setQuizCreationMethod("file");
    setManualStatement("");
    setManualRespA("");
    setManualRespB("");
    setManualRespC("");
    setManualCorrect("A");
    setAdminError(null);
    setAdminSuccess(null);
  };

  const handleAddManualQuestion = () => {
    setAdminError(null);
    setAdminSuccess(null);

    const statement = manualStatement.trim();
    const respA = manualRespA.trim();
    const respB = manualRespB.trim();
    const respC = manualRespC.trim();

    if (!statement || !respA || !respB || !respC) {
      setAdminError("Por favor, preencha a pergunta e todas as três respostas alternativas.");
      return;
    }

    const newQuestion = {
      statement,
      options: [
        { text: respA, is_correct: manualCorrect === "A" },
        { text: respB, is_correct: manualCorrect === "B" },
        { text: respC, is_correct: manualCorrect === "C" },
      ],
    };

    setQuizQuestions((prev) => [...prev, newQuestion]);
    
    // Limpar os campos para a próxima pergunta
    setManualStatement("");
    setManualRespA("");
    setManualRespB("");
    setManualRespC("");
    setManualCorrect("A");
    
    setAdminSuccess("Pergunta adicionada com sucesso!");
  };

  const handleRemoveManualQuestion = (indexToRemove: number) => {
    setQuizQuestions((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setAdminSuccess("Pergunta removida!");
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoading(true);
    setAdminError(null);
    setAdminSuccess(null);

    if (quizQuestions.length === 0) {
      setAdminError(
        quizCreationMethod === "file"
          ? "Por favor, faça o upload de uma planilha de quiz válida (.xlsx)."
          : "Por favor, adicione pelo menos uma pergunta ao quiz antes de salvar."
      );
      setAdminLoading(false);
      return;
    }

    try {
      const timePerQuestion = parseInt(quizTime);

      const { data: quiz, error: quizError } = await supabaseBrowser
        .from("quizzes")
        .insert({
          title: quizTitle,
          description: quizDesc,
          time_limit_seconds: timePerQuestion,
          created_by: profile.id,
          is_active: true,
          base_points: quizQuestions.length * 10,
        })
        .select("id")
        .single();

      if (quizError) throw quizError;

      // Inserir perguntas e alternativas
      for (let i = 0; i < quizQuestions.length; i++) {
        const q = quizQuestions[i];

        const { data: questionRow, error: questionError } = await supabaseBrowser
          .from("quiz_questions")
          .insert({
            quiz_id: quiz.id,
            statement: q.statement,
            weight: 1,
            sort_order: i + 1,
          })
          .select("id")
          .single();

        if (questionError) throw questionError;

        const optionsInsert = q.options.map((opt: any, optIndex: number) => ({
          question_id: questionRow.id,
          text: opt.text,
          is_correct: opt.is_correct,
          sort_order: optIndex + 1,
        }));

        const { error: optionsError } = await supabaseBrowser
          .from("quiz_options")
          .insert(optionsInsert);

        if (optionsError) throw optionsError;
      }

      setAdminSuccess(`Quiz "${quizTitle}" criado com sucesso com ${quizQuestions.length} perguntas!`);
      
      setQuizTitle("");
      setQuizDesc("");
      setQuizTime("60");
      setQuizFileName("");
      setQuizQuestions([]);

      setTimeout(() => {
        setAdminActionOpen(null);
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setAdminError(err.message || "Erro ao criar quiz no banco de dados.");
    } finally {
      setAdminLoading(false);
    }
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoading(true);
    setAdminError(null);
    setAdminSuccess(null);

    const validOptions = pollOptions.filter((o) => o.trim() !== "");
    if (validOptions.length < 2) {
      setAdminError("Insira pelo menos 2 opções válidas.");
      setAdminLoading(false);
      return;
    }

    try {
      let endsAt: string | null = null;
      const days = parseInt(pollDurationDays);
      const minutes = parseInt(pollDurationMinutes);

      if (!isNaN(days) && !isNaN(minutes) && (days > 0 || minutes > 0)) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        date.setMinutes(date.getMinutes() + minutes);
        endsAt = date.toISOString();
      }

      const { data: poll, error } = await supabaseBrowser
        .from("polls")
        .insert({
          title: pollTitle,
          description: pollDesc,
          type: "single",
          created_by: profile.id,
          is_active: true,
          is_anonymous: pollIsAnonymous,
          ends_at: endsAt,
        })
        .select("id")
        .single();

      if (error) throw error;

      await supabaseBrowser.from("poll_options").insert(
        validOptions.map((text, idx) => ({
          poll_id: poll.id,
          text,
          sort_order: idx + 1,
        }))
      );

      setAdminSuccess("Votação criada com sucesso!");
      setPollTitle("");
      setPollDesc("");
      setPollOptions(["", ""]);
      setPollIsAnonymous(false);
      setPollDurationDays("7");
      setPollDurationMinutes("0");
      setTimeout(() => {
        setAdminActionOpen(null);
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setAdminError(err.message);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoading(true);
    setAdminError(null);
    setAdminSuccess(null);

    try {
      const { error } = await supabaseBrowser.from("home_announcements").insert({
        title: annTitle,
        description: annDesc,
        image_url: annImgUrl.trim() || null,
        created_by: profile.id,
      });

      if (error) throw error;

      setAdminSuccess("Comunicado corporativo publicado!");
      setAnnTitle("");
      setAnnDesc("");
      setAnnImgUrl("");
      setTimeout(() => {
        setAdminActionOpen(null);
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setAdminError(err.message);
    } finally {
      setAdminLoading(false);
    }
  };

  const isAdmin = profile?.role === "admin";

  return (
    <Stack spacing={4}>
      {/* Saudação e Pontuação */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Olá, {profile?.full_name?.split(" ")[0] || profile?.username} 👋
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {profile?.departments?.name
              ? `Departamento: ${profile.departments.name}`
              : "Bem-vindo à rede corporativa Matcon"}
          </Typography>
        </Box>
        <Box
          sx={{
            display: "grid",
            placeItems: "center",
            p: 2,
            borderRadius: 3,
            bgcolor: "warning.light",
            color: "warning.contrastText",
            textAlign: "center",
            boxShadow: 1,
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {profile?.points || 0}
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            SEUS PONTOS
          </Typography>
        </Box>
      </Box>

      {/* Cards de Resumo */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, md: 4 }}>
          <Card>
            <CardActionArea onClick={() => router.push("/quiz")}>
              <CardContent>
                <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                    }}
                  >
                    <QuizRoundedIcon />
                  </Box>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {metrics.quizzes}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Quizzes pendentes
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 4 }}>
          <Card>
            <CardActionArea onClick={() => router.push("/votacao")}>
              <CardContent>
                <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: "secondary.main",
                      color: "secondary.contrastText",
                    }}
                  >
                    <HowToVoteRoundedIcon />
                  </Box>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {metrics.polls}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Votações pendentes
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardActionArea onClick={() => router.push("/treinamentos")}>
              <CardContent>
                <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: "info.main",
                      color: "info.contrastText",
                    }}
                  >
                    <LocalLibraryRoundedIcon />
                  </Box>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {metrics.trainings}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Treinamentos pendentes
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>

      {/* Banner de Comunicados */}
      {announcements.length > 0 && (
        <Card variant="outlined" sx={{ bgcolor: "primary.light", color: "primary.contrastText" }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 1 }}>
              <CampaignRoundedIcon />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: 1 }}>
                MURAL CORPORATIVO
              </Typography>
            </Stack>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              {announcements[0].title}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {announcements[0].description}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* CTA de Reconhecimento */}
      <Card
        sx={{
          background: "linear-gradient(135deg, #1B7A43 0%, #2E7D32 100%)",
          color: "#ffffff",
          borderRadius: 4,
          boxShadow: 2,
        }}
      >
        <CardContent sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            Reconheça um Colaborador! 🤝
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, opacity: 0.9, maxWidth: 500, mx: "auto" }}>
            Viu algum colega demonstrando Trabalho em Equipe, Respeito ou Inovação esta semana?
            Diga a todos e envie pontos!
          </Typography>
          <Button
            variant="contained"
            color="warning"
            size="large"
            onClick={handleOpenRecognition}
            sx={{ fontWeight: 700, px: 4, borderRadius: 999 }}
          >
            Reconhecer Colega
          </Button>
        </CardContent>
      </Card>

      {/* Painel Administrativo */}
      {isAdmin && (
        <Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2 }}>
            <AdminPanelSettingsRoundedIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Painel Administrativo
            </Typography>
          </Stack>
          <Grid container spacing={2}>
            {[
              { label: "Criar Quiz", icon: <QuizRoundedIcon />, key: "quiz" },
              { label: "Criar Votação", icon: <HowToVoteRoundedIcon />, key: "poll" },
              { label: "Publicar Comunicado", icon: <CampaignRoundedIcon />, key: "announcement" },
              { label: "Ver Dashboard", icon: <AssessmentRoundedIcon />, key: "dashboard" },
            ].map((action) => (
              <Grid size={{ xs: 6, sm: 3 }} key={action.key}>
                <Card sx={{ height: "100%" }}>
                  <CardActionArea
                    onClick={() => {
                      if (action.key === "dashboard") {
                        router.push("/admin/dashboard");
                      } else {
                        setAdminActionOpen(action.key);
                      }
                    }}
                    sx={{ height: "100%", py: 3 }}
                  >
                    <CardContent sx={{ textAlign: "center", p: 1 }}>
                      <Box sx={{ color: "primary.main", mb: 1 }}>{action.icon}</Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {action.label}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Colunas do Layout */}
      <Grid container spacing={3}>
        {/* Lado Esquerdo: Funcionário do Mês e Atividades */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Stack spacing={3}>
            {/* Funcionário do Mês */}
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  🏆 Funcionário do Mês
                </Typography>
                {employeeOfMonth ? (
                  <Stack direction="row" spacing={3} sx={{ alignItems: "center" }}>
                    <Avatar
                      sx={{
                        width: 72,
                        height: 72,
                        bgcolor: "secondary.main",
                        fontSize: 28,
                      }}
                    >
                      {getInitials(employeeOfMonth.profiles.full_name, employeeOfMonth.profiles.username)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {employeeOfMonth.profiles.full_name || employeeOfMonth.profiles.username}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {employeeOfMonth.profiles.job_title} • {employeeOfMonth.profiles.departments?.name}
                      </Typography>
                      <Typography variant="caption" sx={{ display: "block", mt: 1, fontWeight: 600 }}>
                        Reconhecimentos: {employeeOfMonth.total_recognitions} | Princípios: {employeeOfMonth.distinct_principles}
                      </Typography>
                      {employeeOfMonth.company_principles && (
                        <Chip
                          size="small"
                          label={`Foco em: ${employeeOfMonth.company_principles.name}`}
                          color="primary"
                          sx={{ mt: 1 }}
                        />
                      )}
                    </Box>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    O primeiro ciclo mensal está em andamento. O vencedor será calculado no último dia do mês.
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Atividades Pendentes */}
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  📝 Atividades Recomendadas
                </Typography>
                <List disablePadding>
                  <ListItem
                    disableGutters
                    divider
                    secondaryAction={
                      <Button size="small" onClick={() => router.push("/quiz")}>
                        Responder
                      </Button>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: "primary.light" }}>
                        <QuizRoundedIcon fontSize="small" />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="Quiz de Boas-Vindas"
                      secondary="Complete o questionário corporativo."
                    />
                  </ListItem>
                  <ListItem
                    disableGutters
                    secondaryAction={
                      <Button size="small" onClick={() => router.push("/votacao")}>
                        Votar
                      </Button>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: "secondary.light" }}>
                        <HowToVoteRoundedIcon fontSize="small" />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="Definição da Próxima SIPAT"
                      secondary="Sua opinião é muito importante."
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Lado Direito: Ranking */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                ⚡ Ranking Semanal (Top 10)
              </Typography>
              {ranking.length > 0 ? (
                <List disablePadding>
                  {ranking.map((user, idx) => (
                    <ListItem
                      key={user.id}
                      disableGutters
                      divider={idx < ranking.length - 1}
                      secondaryAction={
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {user.points} pts
                        </Typography>
                      }
                    >
                      <ListItemAvatar sx={{ minWidth: 40 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 700,
                            color: idx < 3 ? "primary.main" : "text.secondary",
                            width: 24,
                            textAlign: "center",
                          }}
                        >
                          {idx + 1}º
                        </Typography>
                      </ListItemAvatar>
                      <ListItemAvatar>
                        <Avatar sx={{ width: 32, height: 32, fontSize: 12 }}>
                          {getInitials(user.full_name, user.username)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={user.full_name || user.username}
                        secondary={user.departments?.name || "Matcon"}
                        slotProps={{
                          primary: { variant: "body2", sx: { fontWeight: 600 } },
                          secondary: { variant: "caption" },
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Nenhum colaborador pontuou ainda.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* --- MODAL WIZARD RECONHECIMENTO (4 ETAPAS) --- */}
      <Dialog
        open={recognitionOpen}
        onClose={() => setRecognitionOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 4 } } }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Reconhecer Colaborador
          </Typography>
          <IconButton onClick={() => setRecognitionOpen(false)} size="small">
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {recError && <Alert severity="error" sx={{ mb: 2 }}>{recError}</Alert>}
          {recSuccess && <Alert severity="success" sx={{ mb: 2 }}>{recSuccess}</Alert>}

          <AnimatePresence mode="wait">
            {wizardStep === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>
                  Etapa 1: Selecione um princípio corporativo
                </Typography>
                <RadioGroup
                  value={selectedPrinciple}
                  onChange={(e) => {
                    setSelectedPrinciple(e.target.value);
                    setRecError(null);
                  }}
                >
                  {principles.map((pr) => (
                    <Paper
                      key={pr.id}
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        mb: 1.5,
                        borderColor: selectedPrinciple === pr.id ? "primary.main" : "divider",
                        bgcolor: selectedPrinciple === pr.id ? "primary.light" : "background.paper",
                      }}
                    >
                      <FormControlLabel
                        value={pr.id}
                        control={<Radio />}
                        label={
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {pr.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {pr.description}
                            </Typography>
                          </Box>
                        }
                        sx={{ width: "100%", m: 0 }}
                      />
                    </Paper>
                  ))}
                </RadioGroup>
              </motion.div>
            )}

            {wizardStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>
                  Etapa 2: Descreva o comportamento observado
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Seja específico: relate o que o colega fez e como isso impactou a equipe ou o cliente.
                </Typography>
                <TextField
                  multiline
                  rows={4}
                  placeholder="Ex: O João ajudou a equipe de TI a virar a noite para resolver o problema do sistema de faturamento com dedicação máxima..."
                  value={behaviorText}
                  onChange={(e) => {
                    setBehaviorText(e.target.value);
                    setRecError(null);
                  }}
                  fullWidth
                  required
                />
              </motion.div>
            )}

            {wizardStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>
                  Etapa 3: Selecione o colaborador
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Procure pelo nome do seu colega na lista.
                </Typography>
                <Autocomplete
                  options={collaborators}
                  getOptionLabel={(option) => option.full_name || option.username}
                  value={selectedCollaborator}
                  onChange={(_, val) => {
                    setSelectedCollaborator(val);
                    setRecError(null);
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Buscar Colaborador" placeholder="Digite o nome..." />
                  )}
                  fullWidth
                />
              </motion.div>
            )}

            {wizardStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>
                  Etapa 4: Confirmar Envio
                </Typography>
                <Paper variant="outlined" sx={{ p: 2.5, bgcolor: "background.default" }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    COLABORADOR RECONHECIDO
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                    {selectedCollaborator?.full_name || selectedCollaborator?.username}
                  </Typography>

                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    PRINCÍPIO CITADO
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                    {principles.find((p) => p.id === selectedPrinciple)?.name}
                  </Typography>

                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    MENSAGEM DE ELOGIO
                  </Typography>
                  <Typography variant="body2" sx={{ fontStyle: "italic", whiteSpace: "pre-wrap" }}>
                    "{behaviorText}"
                  </Typography>
                </Paper>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>

        <DialogActions sx={{ p: 2, display: "flex", justifyContent: "space-between" }}>
          <MobileStepper
            variant="dots"
            steps={4}
            position="static"
            activeStep={wizardStep}
            backButton={
              <Button size="small" onClick={handlePrevStep} disabled={wizardStep === 0 || recLoading}>
                Voltar
              </Button>
            }
            nextButton={
              wizardStep < 3 ? (
                <Button size="small" variant="contained" onClick={handleNextStep}>
                  Avançar
                </Button>
              ) : (
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  onClick={submitRecognition}
                  disabled={recLoading}
                >
                  {recLoading ? "Enviando..." : "Confirmar & Enviar"}
                </Button>
              )
            }
            sx={{ width: "100%", bgcolor: "transparent", p: 0 }}
          />
        </DialogActions>
      </Dialog>

      {/* --- MODALS DE ADMINISTRAÇÃO --- */}
      {/* 1. Criar Quiz */}
      <Dialog
        open={adminActionOpen === "quiz"}
        onClose={handleCloseQuizDialog}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleCreateQuiz}>
          <DialogTitle>Criar Novo Quiz</DialogTitle>
          <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {adminError && <Alert severity="error">{adminError}</Alert>}
            {adminSuccess && <Alert severity="success">{adminSuccess}</Alert>}
            
            <TextField
              label="Título do Quiz *"
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
              required
              fullWidth
            />
            
            <TextField
              label="Descrição"
              value={quizDesc}
              onChange={(e) => setQuizDesc(e.target.value)}
              multiline
              rows={2}
              fullWidth
            />
            
            <TextField
              label="Tempo por Pergunta (segundos) *"
              type="number"
              value={quizTime}
              onChange={(e) => setQuizTime(e.target.value)}
              required
              fullWidth
            />

            <Divider sx={{ my: 1 }} />

            <Tabs
              value={quizCreationMethod}
              onChange={(_, val) => {
                setQuizCreationMethod(val);
                setQuizQuestions([]);
                setQuizFileName("");
                setAdminError(null);
                setAdminSuccess(null);
              }}
              variant="fullWidth"
              sx={{ borderBottom: 1, borderColor: "divider", mb: 1 }}
            >
              <Tab label="Planilha Excel" value="file" />
              <Tab label="Criar Manualmente" value="manual" />
            </Tabs>

            {quizCreationMethod === "file" ? (
              <Stack spacing={2}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUploadRoundedIcon />}
                  sx={{ py: 1.5, borderStyle: "dashed" }}
                >
                  Selecionar Planilha do Quiz (.xlsx) *
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    hidden
                    onChange={handleQuizFileUpload}
                  />
                </Button>
                {quizFileName && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center" }}>
                    Arquivo selecionado: <strong>{quizFileName}</strong>
                  </Typography>
                )}
              </Stack>
            ) : (
              <Stack spacing={2}>
                <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600 }}>
                  Perguntas Adicionadas ({quizQuestions.length})
                </Typography>
                
                {quizQuestions.length > 0 ? (
                  <Paper variant="outlined" sx={{ maxHeight: 150, overflow: "auto", p: 1, bgcolor: "background.default" }}>
                    <List dense disablePadding>
                      {quizQuestions.map((q, idx) => (
                        <ListItem
                          key={idx}
                          secondaryAction={
                            <IconButton edge="end" size="small" onClick={() => handleRemoveManualQuestion(idx)}>
                              <DeleteRoundedIcon fontSize="small" color="error" />
                            </IconButton>
                          }
                          disablePadding
                        >
                          <ListItemText
                            primary={
                              <Typography variant="body2" noWrap sx={{ pr: 4 }}>
                                {`${idx + 1}. ${q.statement}`}
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                ) : (
                  <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center", py: 2 }}>
                    Nenhuma pergunta adicionada ainda. Crie perguntas abaixo.
                  </Typography>
                )}

                <Divider />

                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Nova Pergunta
                </Typography>

                <TextField
                  label="Enunciado da Pergunta *"
                  placeholder="Ex: Qual o principal valor da Matcon?"
                  value={manualStatement}
                  onChange={(e) => setManualStatement(e.target.value)}
                  fullWidth
                  size="small"
                />

                <TextField
                  label="Alternativa A *"
                  placeholder="Ex: Transparência"
                  value={manualRespA}
                  onChange={(e) => setManualRespA(e.target.value)}
                  fullWidth
                  size="small"
                />

                <TextField
                  label="Alternativa B *"
                  placeholder="Ex: Lucro a qualquer custo"
                  value={manualRespB}
                  onChange={(e) => setManualRespB(e.target.value)}
                  fullWidth
                  size="small"
                />

                <TextField
                  label="Alternativa C *"
                  placeholder="Ex: Agilidade lenta"
                  value={manualRespC}
                  onChange={(e) => setManualRespC(e.target.value)}
                  fullWidth
                  size="small"
                />

                <FormControl component="fieldset">
                  <FormLabel component="legend" sx={{ fontSize: "0.85rem", mb: 0.5 }}>Alternativa Correta *</FormLabel>
                  <RadioGroup
                    row
                    value={manualCorrect}
                    onChange={(e) => setManualCorrect(e.target.value as "A" | "B" | "C")}
                  >
                    <FormControlLabel value="A" control={<Radio size="small" />} label="Alternativa A" />
                    <FormControlLabel value="B" control={<Radio size="small" />} label="Alternativa B" />
                    <FormControlLabel value="C" control={<Radio size="small" />} label="Alternativa C" />
                  </RadioGroup>
                </FormControl>

                <Button
                  variant="outlined"
                  startIcon={<AddCircleRoundedIcon />}
                  onClick={handleAddManualQuestion}
                  fullWidth
                >
                  Adicionar Pergunta
                </Button>
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseQuizDialog}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={adminLoading || quizQuestions.length === 0}>
              Salvar Quiz
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* 2. Criar Votação */}
      <Dialog
        open={adminActionOpen === "poll"}
        onClose={() => setAdminActionOpen(null)}
        maxWidth="xs"
        fullWidth
      >
        <form onSubmit={handleCreatePoll}>
          <DialogTitle>Criar Nova Votação</DialogTitle>
          <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {adminError && <Alert severity="error">{adminError}</Alert>}
            {adminSuccess && <Alert severity="success">{adminSuccess}</Alert>}
            <TextField
              label="Pergunta / Título"
              value={pollTitle}
              onChange={(e) => setPollTitle(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Descrição"
              value={pollDesc}
              onChange={(e) => setPollDesc(e.target.value)}
              multiline
              rows={2}
              fullWidth
            />

            <FormControl component="fieldset" sx={{ mt: 1 }}>
              <FormLabel component="legend" sx={{ fontSize: "0.85rem", mb: 0.5 }}>Tipo de Votação</FormLabel>
              <RadioGroup
                row
                value={pollIsAnonymous ? "anonymous" : "public"}
                onChange={(e) => setPollIsAnonymous(e.target.value === "anonymous")}
              >
                <FormControlLabel value="public" control={<Radio size="small" />} label="Pública" />
                <FormControlLabel value="anonymous" control={<Radio size="small" />} label="Anônima" />
              </RadioGroup>
            </FormControl>

            <Divider sx={{ my: 0.5 }}>Duração da Votação</Divider>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Dias"
                type="number"
                value={pollDurationDays}
                onChange={(e) => setPollDurationDays(e.target.value)}
                slotProps={{ htmlInput: { min: 0 } }}
                fullWidth
              />
              <TextField
                label="Minutos"
                type="number"
                value={pollDurationMinutes}
                onChange={(e) => setPollDurationMinutes(e.target.value)}
                slotProps={{ htmlInput: { min: 0 } }}
                fullWidth
              />
            </Stack>
            <Divider>Opções da Enquete</Divider>
            {pollOptions.map((opt, idx) => (
              <TextField
                key={idx}
                label={`Opção ${idx + 1}`}
                value={opt}
                onChange={(e) => {
                  const copy = [...pollOptions];
                  copy[idx] = e.target.value;
                  setPollOptions(copy);
                }}
                required={idx < 2}
                fullWidth
              />
            ))}
            <Button
              size="small"
              onClick={() => setPollOptions([...pollOptions, ""])}
              sx={{ alignSelf: "flex-start" }}
            >
              + Adicionar Opção
            </Button>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAdminActionOpen(null)}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={adminLoading}>
              Criar Votação
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* 3. Publicar Comunicado */}
      <Dialog
        open={adminActionOpen === "announcement"}
        onClose={() => setAdminActionOpen(null)}
        maxWidth="xs"
        fullWidth
      >
        <form onSubmit={handleCreateAnnouncement}>
          <DialogTitle>Publicar Comunicado Corporativo</DialogTitle>
          <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {adminError && <Alert severity="error">{adminError}</Alert>}
            {adminSuccess && <Alert severity="success">{adminSuccess}</Alert>}
            <TextField
              label="Título do Comunicado"
              value={annTitle}
              onChange={(e) => setAnnTitle(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Descrição"
              value={annDesc}
              onChange={(e) => setAnnDesc(e.target.value)}
              multiline
              rows={4}
              required
              fullWidth
            />
            <TextField
              label="URL da Imagem (opcional)"
              value={annImgUrl}
              onChange={(e) => setAnnImgUrl(e.target.value)}
              fullWidth
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAdminActionOpen(null)}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={adminLoading}>
              Publicar
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Stack>
  );
}
