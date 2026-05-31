import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
  Button,
} from "@mui/material";
import LocalLibraryRoundedIcon from "@mui/icons-material/LocalLibraryRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";

export default async function TreinamentosPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Obter treinamentos do banco
  const { data: trainings } = await supabase
    .from("trainings")
    .select("*")
    .order("created_at", { ascending: false });

  // Obter status de conclusão do usuário logado
  const { data: userResults } = await supabase
    .from("training_results")
    .select("training_id, status, score")
    .eq("user_id", user.id);

  const completionMap = new Map(
    (userResults || []).map((r) => [r.training_id, { status: r.status, score: r.score }])
  );

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Treinamentos Corporativos
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Aprimore suas habilidades e adquira conhecimentos técnicos para evoluir na Matcon.
        </Typography>
      </Box>

      {trainings && trainings.length > 0 ? (
        <Grid container spacing={2.5}>
          {trainings.map((t) => {
            const progress = completionMap.get(t.id);
            const isCompleted = progress?.status === "approved";
            const isFailed = progress?.status === "failed";
            const isProgress = progress?.status === "in_progress";

            return (
              <Grid size={{ xs: 12, md: 6 }} key={t.id}>
                <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                  <CardContent sx={{ p: 3, flexGrow: 1, display: "flex", flexDirection: "column" }}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 1.5 }}>
                      <LocalLibraryRoundedIcon color="primary" />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {t.title}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1, mb: 3 }}>
                      {t.description || "Nenhuma descrição disponível."}
                    </Typography>

                    <Stack direction="row" spacing={1} sx={{ mb: 3, alignItems: "center" }}>
                      {t.is_mandatory && (
                        <Chip label="Obrigatório" size="small" color="error" />
                      )}
                      {isCompleted && (
                        <Chip
                          icon={<CheckCircleRoundedIcon />}
                          label="Concluído"
                          size="small"
                          color="success"
                        />
                      )}
                      {isFailed && <Chip label="Reprovado (Refazer)" size="small" color="error" />}
                      {isProgress && <Chip label="Em Andamento" size="small" color="info" />}
                      {!progress && <Chip label="Não Iniciado" size="small" variant="outlined" />}
                    </Stack>

                    <Button
                      variant={isCompleted ? "outlined" : "contained"}
                      startIcon={<PlayCircleRoundedIcon />}
                      fullWidth
                    >
                      {isCompleted ? "Rever Conteúdo" : "Iniciar Treinamento"}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Card variant="outlined" sx={{ py: 6, textAlign: "center" }}>
          <CardContent>
            <LocalLibraryRoundedIcon color="disabled" sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h6" color="text.secondary">
              Nenhum Treinamento Publicado
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Os treinamentos e cursos de integração serão exibidos aqui em breve.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
