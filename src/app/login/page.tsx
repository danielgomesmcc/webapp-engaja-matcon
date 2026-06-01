"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const trimmedUsername = username.trim().toLowerCase();
    if (!trimmedUsername || !password) {
      setError("Por favor, preencha todos os campos.");
      setLoading(false);
      return;
    }

    // Mapeamento simplificado: usuario001 -> usuario001@matcon.com.br
    const email = trimmedUsername.includes("@")
      ? trimmedUsername
      : `${trimmedUsername}@matcon.com.br`;

    try {
      const { error: signInError } = await supabaseBrowser.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message === "Invalid login credentials") {
          setError("Usuário ou senha incorretos.");
        } else {
          setError(signInError.message);
        }
        setLoading(false);
        return;
      }

      router.replace("/home");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Ocorreu um erro ao fazer login.");
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        p: 2,
        background:
          "linear-gradient(160deg, var(--mui-palette-primary-dark) 0%, var(--mui-palette-primary-main) 60%, var(--mui-palette-primary-light) 100%)",
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 420 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack spacing={1} sx={{ alignItems: "center", mb: 3 }}>
            <Box
              component="img"
              src="/logo.png"
              alt="Matcon Casa Logo"
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                objectFit: "contain",
              }}
            />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Engaja Matcon
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
              Plataforma Corporativa de Engajamento
            </Typography>
          </Stack>

          <form onSubmit={handleLogin}>
            <Stack spacing={2.5}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField
                label="Usuário"
                placeholder="usuario001"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                fullWidth
                disabled={loading}
                autoFocus
              />
              <TextField
                label="Senha"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                fullWidth
                disabled={loading}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
                sx={{ py: 1.5 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Entrar"}
              </Button>
            </Stack>
          </form>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 3, textAlign: "center" }}
          >
            Acesso simplificado: utilize de <strong>usuario001</strong> até{" "}
            <strong>usuario100</strong> e a senha padrão <strong>Mudar!123</strong>.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
