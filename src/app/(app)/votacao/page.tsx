import { createClient } from "@/lib/supabase/server";
import { Box, Stack, Typography, Card, CardContent } from "@mui/material";
import HowToVoteRoundedIcon from "@mui/icons-material/HowToVoteRounded";
import PollListClient from "./PollListClient";

export default async function VotacaoPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Obter enquetes, votos do usuário e todos os votos em paralelo
  const [pollsRes, userVotesRes, allVotesRes] = await Promise.all([
    supabase
      .from("polls")
      .select("*, poll_options(*)")
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("poll_votes")
      .select("poll_id, option_id")
      .eq("user_id", user?.id || ""),
    supabase
      .from("poll_votes")
      .select("poll_id, option_id"),
  ]);

  const polls = pollsRes.data;
  const userVotes = userVotesRes.data;
  const allVotes = allVotesRes.data;

  const votedPollIds = new Set((userVotes || []).map((v) => v.poll_id));

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Votações e Decisões
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Participe das pesquisas internas e ajude a construir o futuro da Matcon.
        </Typography>
      </Box>

      {polls && polls.length > 0 ? (
        <PollListClient
          polls={polls}
          votedPollIds={Array.from(votedPollIds)}
          allVotes={allVotes || []}
          userId={user?.id || ""}
        />
      ) : (
        <Card variant="outlined" sx={{ py: 6, textAlign: "center" }}>
          <CardContent>
            <HowToVoteRoundedIcon color="disabled" sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h6" color="text.secondary">
              Nenhuma Votação Ativa
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Não há enquetes abertas no momento. Volte em breve!
            </Typography>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
