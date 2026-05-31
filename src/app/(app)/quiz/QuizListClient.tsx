"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Alert,
  CircularProgress,
  Divider,
  Paper,
} from "@mui/material";
import QuizRoundedIcon from "@mui/icons-material/QuizRounded";
import TimerRoundedIcon from "@mui/icons-material/TimerRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import { motion, AnimatePresence } from "framer-motion";
import { supabaseBrowser } from "@/lib/supabase/client";

interface Quiz {
  id: string;
  title: string;
  description: string;
  time_limit_seconds: number;
  base_points: number;
  category: string;
  created_at: string;
}

interface UserResult {
  quiz_id: string;
  score: number;
  correct_count: number;
}

interface QuizListClientProps {
  quizzes: Quiz[];
  initialResults: UserResult[];
  profileId: string;
}

export default function QuizListClient({ quizzes, initialResults, profileId }: QuizListClientProps) {
  const router = useRouter();

  // Quiz listing & results state
  const [results, setResults] = useState<UserResult[]>(initialResults);

  // Active quiz playing states
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({}); // questionId -> optionId
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [questionTimeRemaining, setQuestionTimeRemaining] = useState<Record<string, number>>({});

  // Loaders
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Results calculation for post-quiz screen
  const [lastQuizResult, setLastQuizResult] = useState<{
    correctCount: number;
    totalCount: number;
    score: number;
    timeUsed: number;
    speedBonus: number;
  } | null>(null);

  // Confirm dialog state
  const [abortDialogOpen, setAbortDialogOpen] = useState(false);

  // Timer logic - Per question timer
  useEffect(() => {
    if (!activeQuiz || quizFinished || quizQuestions.length === 0) return;

    if (timeLeft <= 0) {
      // Tempo esgotou para esta pergunta
      const q = quizQuestions[currentQuestionIndex];
      if (q) {
        setUserAnswers((prev) => ({
          ...prev,
          [q.id]: "", // marca como não respondida (incorreta)
        }));
        
        setQuestionTimeRemaining((prev) => ({
          ...prev,
          [q.id]: 0,
        }));
      }

      if (currentQuestionIndex < quizQuestions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setTimeLeft(activeQuiz.time_limit_seconds || 60);
      } else {
        handleFinishQuiz(0);
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeQuiz, timeLeft, quizFinished, currentQuestionIndex, quizQuestions]);

  const handleStartQuiz = async (quiz: Quiz) => {
    setLoadingQuestions(true);
    try {
      const { data: questions, error } = await supabaseBrowser
        .from("quiz_questions")
        .select(`
          id,
          statement,
          sort_order,
          quiz_options(id, text, is_correct, sort_order)
        `)
        .eq("quiz_id", quiz.id)
        .order("sort_order");

      if (error) throw error;

      if (!questions || questions.length === 0) {
        alert("Este quiz não possui perguntas cadastradas ainda.");
        setLoadingQuestions(false);
        return;
      }

      setQuizQuestions(questions);
      setActiveQuiz(quiz);
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setQuestionTimeRemaining({});
      setTimeLeft(quiz.time_limit_seconds || 60);
      setQuizFinished(false);
      setLastQuizResult(null);
    } catch (err: any) {
      alert(`Erro ao iniciar quiz: ${err.message}`);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleNextQuestion = () => {
    const q = quizQuestions[currentQuestionIndex];
    if (q) {
      setQuestionTimeRemaining((prev) => ({
        ...prev,
        [q.id]: timeLeft,
      }));
    }

    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setTimeLeft(activeQuiz?.time_limit_seconds || 60);
    } else {
      handleFinishQuiz(timeLeft);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleFinishQuiz = async (lastQuestionTimeLeft?: number) => {
    if (quizFinished) return;
    setSubmitting(true);
    setQuizFinished(true);

    // Mesclar o tempo restante da última pergunta
    const finalTimeLeft = { ...questionTimeRemaining };
    const lastQ = quizQuestions[currentQuestionIndex];
    if (lastQ) {
      finalTimeLeft[lastQ.id] = lastQuestionTimeLeft !== undefined ? lastQuestionTimeLeft : timeLeft;
    }

    let correct = 0;
    quizQuestions.forEach((q) => {
      const selected = userAnswers[q.id];
      const correctOption = q.quiz_options.find((o: any) => o.is_correct);
      if (selected && correctOption && selected === correctOption.id) {
        correct++;
      }
    });

    // Calcular tempo total gasto e bônus de velocidade
    let totalTimeUsed = 0;
    let speedBonus = 0;
    quizQuestions.forEach((q) => {
      const limit = activeQuiz?.time_limit_seconds || 60;
      const remaining = finalTimeLeft[q.id] ?? 0;
      totalTimeUsed += (limit - remaining);

      // Apenas ganha bônus de velocidade para perguntas corretas!
      const selected = userAnswers[q.id];
      const correctOption = q.quiz_options.find((o: any) => o.is_correct);
      if (selected && correctOption && selected === correctOption.id) {
        speedBonus += remaining;
      }
    });

    const baseScore = correct * 10;
    const finalScore = baseScore + speedBonus;

    try {
      const { error } = await supabaseBrowser.from("quiz_results").insert({
        quiz_id: activeQuiz!.id,
        user_id: profileId,
        score: finalScore,
        correct_count: correct,
        total_time_seconds: totalTimeUsed,
      });

      if (error) throw error;

      // Update local results
      const newResult: UserResult = {
        quiz_id: activeQuiz!.id,
        score: finalScore,
        correct_count: correct,
      };
      setResults((prev) => [...prev, newResult]);

      setLastQuizResult({
        correctCount: correct,
        totalCount: quizQuestions.length,
        score: finalScore,
        timeUsed: totalTimeUsed,
        speedBonus,
      });

      router.refresh();
    } catch (err: any) {
      alert(`Erro ao salvar resultados: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClosePlayer = () => {
    setActiveQuiz(null);
    setQuizQuestions([]);
    setLastQuizResult(null);
    setQuizFinished(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const hasAnswered = (quizId: string) => {
    return results.find((r) => r.quiz_id === quizId);
  };

  const currentQuestion = quizQuestions[currentQuestionIndex];
  const progressPercent = quizQuestions.length
    ? ((currentQuestionIndex + 1) / quizQuestions.length) * 100
    : 0;

  return (
    <Box sx={{ width: "100%" }}>
      {/* 1. QUIZ LIST VIEW */}
      {!activeQuiz && (
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Quizzes Corporativos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Responda a questionários, acumule pontos e suba no ranking da Matcon.
            </Typography>
          </Box>

          {loadingQuestions && (
            <Card sx={{ p: 4, display: "flex", justifyContent: "center", alignItems: "center" }}>
              <Stack spacing={2} sx={{ alignItems: "center" }}>
                <CircularProgress color="primary" />
                <Typography variant="body2">Preparando as perguntas do quiz...</Typography>
              </Stack>
            </Card>
          )}

          {!loadingQuestions && quizzes.length > 0 ? (
            <Grid container spacing={3}>
              {quizzes.map((quiz) => {
                const userResult = hasAnswered(quiz.id);
                return (
                  <Grid size={{ xs: 12, md: 6 }} key={quiz.id}>
                    <Card
                      sx={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        border: userResult ? "1px solid var(--mui-palette-success-light)" : "none",
                        position: "relative",
                      }}
                    >
                      <CardContent sx={{ p: 3, flexGrow: 1, display: "flex", flexDirection: "column" }}>
                        <Stack direction="row" spacing={1} sx={{ mb: 1, alignItems: "center" }}>
                          <QuizRoundedIcon color={userResult ? "success" : "primary"} />
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {quiz.title}
                          </Typography>
                        </Stack>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ minHeight: 48, mb: 2, flexGrow: 1 }}>
                          {quiz.description || "Nenhuma descrição fornecida."}
                        </Typography>

                        <Stack direction="row" spacing={1.5} sx={{ mb: 3, flexWrap: "wrap", gap: 1 }}>
                          <Chip
                            icon={<TimerRoundedIcon fontSize="small" />}
                            label={`${quiz.time_limit_seconds || 60} seg / pergunta`}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            icon={<EmojiEventsRoundedIcon fontSize="small" />}
                            label={`Base: ${quiz.base_points} pts`}
                            size="small"
                            color="warning"
                          />
                          {quiz.category && (
                            <Chip label={quiz.category} size="small" variant="outlined" />
                          )}
                          {userResult && (
                            <Chip
                              icon={<CheckCircleRoundedIcon fontSize="small" />}
                              label={`Concluído: ${userResult.score} pts`}
                              size="small"
                              color="success"
                            />
                          )}
                        </Stack>

                        <Button
                          variant={userResult ? "outlined" : "contained"}
                          color={userResult ? "success" : "primary"}
                          fullWidth
                          onClick={() => handleStartQuiz(quiz)}
                          disabled={!!userResult}
                        >
                          {userResult ? "Quiz Respondido" : "Responder Quiz"}
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            !loadingQuestions && (
              <Card variant="outlined" sx={{ py: 6, textAlign: "center" }}>
                <CardContent>
                  <QuizRoundedIcon color="disabled" sx={{ fontSize: 48, mb: 1 }} />
                  <Typography variant="h6" color="text.secondary">
                    Nenhum Quiz Disponível
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Os administradores publicarão novos questionários em breve.
                  </Typography>
                </CardContent>
              </Card>
            )
          )}
        </Stack>
      )}

      {/* 2. QUIZ PLAYING OVERLAY SCREEN */}
      <AnimatePresence>
        {activeQuiz && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            style={{ width: "100%" }}
          >
            {/* RESULTS VIEW */}
            {quizFinished ? (
              <Card sx={{ maxWidth: 500, mx: "auto", mt: 4, p: 3, textAlign: "center" }}>
                <CardContent>
                  {submitting ? (
                    <Stack spacing={2} sx={{ py: 4, alignItems: "center" }}>
                      <CircularProgress color="success" />
                      <Typography variant="h6">Calculando seus pontos...</Typography>
                    </Stack>
                  ) : lastQuizResult ? (
                    <Stack spacing={3}>
                      <Box>
                        <CheckCircleRoundedIcon color="success" sx={{ fontSize: 64, mb: 1 }} />
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                          Quiz Concluído!
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {activeQuiz.title}
                        </Typography>
                      </Box>

                      <Divider />

                      <Grid container spacing={2}>
                        <Grid size={{ xs: 6 }}>
                          <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                              Acertos
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {lastQuizResult.correctCount} / {lastQuizResult.totalCount}
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                              Tempo Gasto
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {lastQuizResult.timeUsed}s
                            </Typography>
                          </Paper>
                        </Grid>
                        {lastQuizResult.speedBonus > 0 && (
                          <Grid size={{ xs: 12 }}>
                            <Alert severity="success" icon={<EmojiEventsRoundedIcon />} sx={{ justifyContent: "center" }}>
                              <strong>Gabarito Completo!</strong> Bônus de velocidade: +{lastQuizResult.speedBonus} pts
                            </Alert>
                          </Grid>
                        )}
                        <Grid size={{ xs: 12 }}>
                          <Paper elevation={1} sx={{ p: 2, bgcolor: "warning.light", color: "warning.contrastText" }}>
                            <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
                              Pontuação Total Obtida
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 800 }}>
                              {lastQuizResult.score} pts
                            </Typography>
                          </Paper>
                        </Grid>
                      </Grid>

                      <Button variant="contained" color="success" fullWidth size="large" onClick={handleClosePlayer}>
                        Voltar aos Quizzes
                      </Button>
                    </Stack>
                  ) : (
                    <Alert severity="error">Erro ao registrar ou calcular sua pontuação.</Alert>
                  )}
                </CardContent>
              </Card>
            ) : (
              /* QUESTION FLOW VIEW */
              <Card sx={{ maxWidth: 700, mx: "auto", mt: 2 }}>
                <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                  {/* Play Header */}
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        {activeQuiz.title}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Pergunta {currentQuestionIndex + 1} de {quizQuestions.length}
                      </Typography>
                    </Box>
                    <Chip
                      icon={<TimerRoundedIcon />}
                      label={formatTime(timeLeft)}
                      color={timeLeft < 20 ? "error" : "primary"}
                      sx={{ fontWeight: 600, fontSize: "1.05rem", py: 2 }}
                    />
                  </Stack>

                  {/* Progress Bar */}
                  <LinearProgress
                    variant="determinate"
                    value={progressPercent}
                    sx={{ mb: 4, height: 6, borderRadius: 3 }}
                  />

                  {/* Question Statement */}
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 4 }}>
                    {currentQuestion?.statement}
                  </Typography>

                  {/* Options List */}
                  <FormControl component="fieldset" fullWidth sx={{ mb: 4 }}>
                    <RadioGroup
                      value={userAnswers[currentQuestion?.id] || ""}
                      onChange={(e) => handleSelectOption(currentQuestion.id, e.target.value)}
                    >
                      <Stack spacing={2}>
                        {currentQuestion?.quiz_options?.map((opt: any) => {
                          const isSelected = userAnswers[currentQuestion.id] === opt.id;
                          return (
                            <Paper
                              variant="outlined"
                              key={opt.id}
                              sx={{
                                border: isSelected
                                  ? "2px solid var(--mui-palette-primary-main)"
                                  : "1px solid var(--mui-palette-divider)",
                                bgcolor: isSelected ? "primary.light" : "transparent",
                                transition: "all 0.2s",
                              }}
                            >
                              <FormControlLabel
                                value={opt.id}
                                control={<Radio color="primary" sx={{ ml: 1.5 }} />}
                                label={opt.text}
                                sx={{
                                  width: "100%",
                                  py: 1.5,
                                  px: 1,
                                  m: 0,
                                  color: isSelected ? "primary.contrastText" : "text.primary",
                                }}
                              />
                            </Paper>
                          );
                        })}
                      </Stack>
                    </RadioGroup>
                  </FormControl>

                  {/* Navigation Buttons */}
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => setAbortDialogOpen(true)}
                    >
                      Desistir
                    </Button>
                    <Stack direction="row" spacing={1.5}>
                      <Button
                        variant="outlined"
                        onClick={handlePrevQuestion}
                        disabled={currentQuestionIndex === 0}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleNextQuestion}
                        disabled={!userAnswers[currentQuestion?.id]}
                      >
                        {currentQuestionIndex === quizQuestions.length - 1 ? "Finalizar" : "Avançar"}
                      </Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONFIRM ABORT DIALOG */}
      <Dialog open={abortDialogOpen} onClose={() => setAbortDialogOpen(false)}>
        <DialogTitle>Confirmar desistência?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Se você sair agora, suas respostas não serão salvas e você não pontuará neste quiz.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAbortDialogOpen(false)}>Voltar ao Quiz</Button>
          <Button color="error" variant="contained" onClick={() => {
            setAbortDialogOpen(false);
            handleClosePlayer();
          }}>
            Desistir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
