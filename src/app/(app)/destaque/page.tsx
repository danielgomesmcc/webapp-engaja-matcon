import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
} from "@mui/material";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import LocalLibraryRoundedIcon from "@mui/icons-material/LocalLibraryRounded";
import HowToVoteRoundedIcon from "@mui/icons-material/HowToVoteRounded";

export default async function DestaquesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Carregar Hall da Fama, histórico de quizzes, treinamentos e votações em paralelo
  const [hallOfFameRes, quizHistoryRes, trainingHistoryRes, pollHistoryRes] = await Promise.all([
    supabase
      .from("employee_of_month")
      .select("*, profiles(*, departments(name)), company_principles(name)")
      .order("year", { ascending: false })
      .order("month", { ascending: false }),
    supabase
      .from("quiz_results")
      .select("*, quizzes(title)")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false }),
    supabase
      .from("training_results")
      .select("*, trainings(title)")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false }),
    supabase
      .from("poll_votes")
      .select("*, polls(title)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const hallOfFame = hallOfFameRes.data;
  const quizHistory = quizHistoryRes.data;
  const trainingHistory = trainingHistoryRes.data;
  const pollHistory = pollHistoryRes.data;

  const getInitials = (name: string | null, username: string) => {
    const display = name || username;
    const parts = display.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
  };

  const getMonthName = (m: number) => {
    const months = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return months[m - 1] || "Mês";
  };

  return (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Destaques Corporativos
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Veja as conquistas da nossa equipe e consulte seu histórico pessoal de atividades.
        </Typography>
      </Box>

      {/* Hall da Fama */}
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 3 }}>
            <EmojiEventsRoundedIcon color="warning" sx={{ fontSize: 32 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Hall da Fama — Funcionários do Mês
            </Typography>
          </Stack>

          {hallOfFame && hallOfFame.length > 0 ? (
            <TableContainer component={Paper} variant="outlined" sx={{ border: "none" }}>
              <Table>
                <TableHead sx={{ bgcolor: "background.default" }}>
                  <TableRow>
                    <TableCell><strong>Período</strong></TableCell>
                    <TableCell><strong>Colaborador</strong></TableCell>
                    <TableCell><strong>Departamento</strong></TableCell>
                    <TableCell align="center"><strong>Elogios</strong></TableCell>
                    <TableCell><strong>Princípio Citado</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {hallOfFame.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{getMonthName(row.month)} / {row.year}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                          <Avatar sx={{ width: 32, height: 32, fontSize: 12 }}>
                            {getInitials(row.profiles?.full_name, row.profiles?.username)}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {row.profiles?.full_name || row.profiles?.username}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>{row.profiles?.departments?.name || "Matcon"}</TableCell>
                      <TableCell align="center">{row.total_recognitions}</TableCell>
                      <TableCell>
                        {row.company_principles?.name ? (
                          <Chip label={row.company_principles.name} size="small" color="primary" />
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
              Nenhum registro no Hall da Fama ainda. O primeiro prêmio será calculado em breve!
            </Typography>
          )}
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Histórico de Quizzes e Treinamentos */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                <AssignmentTurnedInRoundedIcon color="primary" />
                Seus Quizzes Concluídos
              </Typography>
              {quizHistory && quizHistory.length > 0 ? (
                <List disablePadding>
                  {quizHistory.map((res, idx) => (
                    <ListItem key={res.id} divider={idx < quizHistory.length - 1} disableGutters>
                      <ListItemText
                        primary={res.quizzes?.title || "Quiz"}
                        secondary={`Pontuação: ${res.score} pts | Acertos: ${res.correct_count} | Tempo: ${res.total_time_seconds}s`}
                        slotProps={{
                          primary: { variant: "body2", sx: { fontWeight: 600 } },
                          secondary: { variant: "caption" }
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(res.completed_at).toLocaleDateString("pt-BR")}
                      </Typography>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  Você ainda não respondeu a nenhum quiz.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                <LocalLibraryRoundedIcon color="secondary" />
                Seus Treinamentos
              </Typography>
              {trainingHistory && trainingHistory.length > 0 ? (
                <List disablePadding>
                  {trainingHistory.map((res, idx) => (
                    <ListItem key={res.id} divider={idx < trainingHistory.length - 1} disableGutters>
                      <ListItemText
                        primary={res.trainings?.title || "Treinamento"}
                        secondary={`Nota: ${res.score} | Status: ${res.status === "approved" ? "Aprovado" : "Pendente"}`}
                        slotProps={{
                          primary: { variant: "body2", sx: { fontWeight: 600 } },
                          secondary: { variant: "caption" }
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {res.completed_at ? new Date(res.completed_at).toLocaleDateString("pt-BR") : "Pendente"}
                      </Typography>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  Você ainda não iniciou nenhum treinamento.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Histórico de Votos */}
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                <HowToVoteRoundedIcon color="info" />
                Suas Votações Respondidas
              </Typography>
              {pollHistory && pollHistory.length > 0 ? (
                <Grid container spacing={2}>
                  {pollHistory.map((v) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={v.id}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {v.polls?.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                          Votado em: {new Date(v.created_at).toLocaleDateString("pt-BR")} às {new Date(v.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Você ainda não participou de nenhuma votação.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
