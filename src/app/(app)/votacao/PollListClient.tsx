"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  Grid,
  LinearProgress,
  Radio,
  RadioGroup,
  Stack,
  Typography,
  Chip,
} from "@mui/material";
import HowToVoteRoundedIcon from "@mui/icons-material/HowToVoteRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import { supabaseBrowser } from "@/lib/supabase/client";

interface PollOption {
  id: string;
  poll_id: string;
  text: string;
  sort_order: number;
}

interface Poll {
  id: string;
  title: string;
  description: string | null;
  type: "single" | "multiple" | "yesno";
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  is_anonymous?: boolean;
}

interface PollListClientProps {
  polls: (Poll & { poll_options: PollOption[] })[];
  votedPollIds: string[];
  allVotes: { poll_id: string; option_id: string }[];
  userId: string;
}

export default function PollListClient({
  polls,
  votedPollIds: initialVotedPollIds,
  allVotes: initialAllVotes,
  userId,
}: PollListClientProps) {
  const router = useRouter();

  // Local state for interactive updates
  const [votedPollIds, setVotedPollIds] = useState<string[]>(initialVotedPollIds);
  const [allVotes, setAllVotes] = useState(initialAllVotes);

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [loadingPollId, setLoadingPollId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVote = async (pollId: string) => {
    setError(null);
    const selectedOptionId = selectedOptions[pollId];

    if (!selectedOptionId) {
      setError("Por favor, selecione uma opção antes de votar.");
      return;
    }

    setLoadingPollId(pollId);

    try {
      const { error: voteError } = await supabaseBrowser.from("poll_votes").insert({
        poll_id: pollId,
        option_id: selectedOptionId,
        user_id: userId,
      });

      if (voteError) {
        setError(`Erro ao registrar seu voto: ${voteError.message}`);
        setLoadingPollId(null);
        return;
      }

      // Atualizar estados locais para exibição em tempo real
      setVotedPollIds((prev) => [...prev, pollId]);
      setAllVotes((prev) => [...prev, { poll_id: pollId, option_id: selectedOptionId }]);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Erro inesperado.");
    } finally {
      setLoadingPollId(null);
    }
  };

  const getResults = (pollId: string, options: PollOption[]) => {
    const votesForPoll = allVotes.filter((v) => v.poll_id === pollId);
    const totalVotes = votesForPoll.length;

    return options.map((opt) => {
      const voteCount = votesForPoll.filter((v) => v.option_id === opt.id).length;
      const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
      return {
        ...opt,
        count: voteCount,
        percentage,
      };
    });
  };

  return (
    <Stack spacing={2.5}>
      {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

      <Grid container spacing={2.5}>
        {polls.map((poll) => {
          const isExpired = poll.ends_at ? new Date(poll.ends_at) < new Date() : false;
          const hasVoted = votedPollIds.includes(poll.id);
          
          // O resultado só sai depois que termina o tempo para responder (isExpired = true)
          // Se for permanente (sem data de expiração), sai logo após votar
          const showResults = isExpired || (!poll.ends_at && hasVoted);
          const showVotedWaitMessage = hasVoted && !isExpired && !!poll.ends_at;

          const results = getResults(poll.id, poll.poll_options);
          const totalVotes = allVotes.filter((v) => v.poll_id === poll.id).length;

          return (
            <Grid size={{ xs: 12, md: 6 }} key={poll.id}>
              <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <CardContent sx={{ p: 3, flexGrow: 1, display: "flex", flexDirection: "column" }}>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 1 }}>
                    <HowToVoteRoundedIcon color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {poll.title}
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: "wrap", gap: 0.5 }}>
                    <Chip
                      label={poll.is_anonymous ? "Votação Anônima" : "Votação Pública"}
                      size="small"
                      variant="outlined"
                      color={poll.is_anonymous ? "default" : "primary"}
                    />
                    {isExpired ? (
                      <Chip label="Encerrada" size="small" color="error" />
                    ) : poll.ends_at ? (
                      <Chip
                        label={`Expira em: ${new Date(poll.ends_at).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`}
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    ) : (
                      <Chip label="Votação Permanente" size="small" color="success" variant="outlined" />
                    )}
                  </Stack>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {poll.description || "Sem descrição."}
                  </Typography>

                  <Box sx={{ flexGrow: 1 }}>
                    {showResults ? (
                      // Exibir resultados (Gráfico de barras estilizado com LinearProgress)
                      <Stack spacing={2}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
                          {hasVoted ? (
                            <>
                              <CheckCircleOutlineRoundedIcon color="success" fontSize="small" />
                              Seu voto foi registrado! {isExpired && "(Encerrada)"}
                            </>
                          ) : (
                            <Typography variant="subtitle2" color="error" sx={{ fontWeight: 700, m: 0 }}>
                              Votação Encerrada
                            </Typography>
                          )}
                        </Typography>
                        {results.map((opt) => (
                          <Box key={opt.id}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {opt.text}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {opt.percentage}% ({opt.count} votos)
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={opt.percentage}
                              sx={{
                                height: 8,
                                borderRadius: 4,
                                bgcolor: "divider",
                                "& .MuiLinearProgress-bar": {
                                  borderRadius: 4,
                                },
                              }}
                            />
                          </Box>
                        ))}
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                          Total de participações: {totalVotes}
                        </Typography>
                      </Stack>
                    ) : showVotedWaitMessage ? (
                      // Exibir confirmação do voto com mensagem de espera pelos resultados
                      <Stack spacing={2} sx={{ py: 2, alignItems: "center", textAlign: "center" }}>
                        <CheckCircleOutlineRoundedIcon color="success" sx={{ fontSize: 48 }} />
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            Voto Confirmado!
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Esta votação possui prazo de término. Os resultados parciais estão ocultos e serão revelados após o encerramento em:
                          </Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1, color: "warning.main" }}>
                            {new Date(poll.ends_at!).toLocaleString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Typography>
                        </Box>
                      </Stack>
                    ) : (
                      // Exibir formulário de votação
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleVote(poll.id);
                        }}
                      >
                        <RadioGroup
                          value={selectedOptions[poll.id] || ""}
                          onChange={(e) =>
                            setSelectedOptions((prev) => ({
                              ...prev,
                              [poll.id]: e.target.value,
                            }))
                          }
                          sx={{ gap: 1.5, mb: 3 }}
                        >
                          {poll.poll_options.map((opt) => (
                            <Box
                              key={opt.id}
                              sx={{
                                border: "1px solid",
                                borderColor: selectedOptions[poll.id] === opt.id ? "primary.main" : "divider",
                                borderRadius: 3,
                                px: 2,
                                py: 0.5,
                                bgcolor: selectedOptions[poll.id] === opt.id ? "primary.light" : "background.paper",
                                transition: "all 0.2s",
                              }}
                            >
                              <FormControlLabel
                                value={opt.id}
                                control={<Radio />}
                                label={opt.text}
                                sx={{ width: "100%", m: 0 }}
                              />
                            </Box>
                          ))}
                        </RadioGroup>
                        <Button
                          type="submit"
                          variant="contained"
                          fullWidth
                          disabled={loadingPollId === poll.id}
                        >
                          {loadingPollId === poll.id ? "Enviando Voto..." : "Confirmar Voto"}
                        </Button>
                      </form>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Stack>
  );
}
