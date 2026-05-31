"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { supabaseBrowser } from "@/lib/supabase/client";
import { updateEmailAdmin } from "@/app/actions/profileActions";

interface Department {
  id: string;
  name: string;
}

interface ProfileClientProps {
  profile: any;
  userId: string;
  departments: Department[];
  firstAccess: boolean;
}

export default function ProfileClient({ profile, userId, departments, firstAccess }: ProfileClientProps) {
  const router = useRouter();

  // Profile fields state
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [jobTitle, setJobTitle] = useState(profile?.job_title || "");
  const [departmentId, setDepartmentId] = useState(profile?.department_id || "");
  const [admissionDate, setAdmissionDate] = useState(profile?.admission_date || "");
  const [email, setEmail] = useState(profile?.email?.endsWith("@matcon.com.br") && firstAccess ? "" : profile?.email || "");

  // Password fields state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Status state
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setProfileLoading(true);

    try {
      // 1. Atualizar e-mail no Supabase Auth se for diferente usando a server action admin
      if (email && email !== profile?.email) {
        const result = await updateEmailAdmin(email);
        if (result.error) {
          setProfileError(`Erro ao atualizar e-mail de login: ${result.error}`);
          setProfileLoading(false);
          return;
        }
      }

      // 2. Atualizar ou inserir na tabela profiles usando upsert
      const { error: dbError } = await supabaseBrowser
        .from("profiles")
        .upsert({
          id: profile?.id || userId,
          username: profile?.username || email.split("@")[0] || `user_${userId.substring(0, 8)}`,
          full_name: fullName.trim() || null,
          phone: phone.trim() || null,
          job_title: jobTitle.trim() || null,
          department_id: departmentId || null,
          admission_date: admissionDate || null,
          email: email.trim() || null,
          updated_at: new Date().toISOString(),
        });

      if (dbError) {
        setProfileError(`Erro ao salvar no banco: ${dbError.message}`);
      } else {
        setProfileSuccess("Perfil atualizado com sucesso!");
        router.refresh();
      }
    } catch (err: any) {
      setProfileError(err?.message || "Ocorreu um erro ao atualizar o perfil.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);
    setPwLoading(true);

    if (password.length < 6) {
      setPwError("A nova senha deve ter pelo menos 6 caracteres.");
      setPwLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setPwError("As senhas não coincidem.");
      setPwLoading(false);
      return;
    }

    try {
      // 1. Se for primeiro acesso, exige e-mail preenchido antes de mudar a senha
      const targetEmail = email.trim();
      if (firstAccess && !targetEmail) {
        setPwError("Por favor, preencha seu novo e-mail no formulário de perfil primeiro.");
        setPwLoading(false);
        return;
      }

      // 2. Atualizar senha no Supabase Auth
      const { error: authPwError } = await supabaseBrowser.auth.updateUser({
        password: password,
      });

      if (authPwError) {
        setPwError(`Erro ao redefinir senha: ${authPwError.message}`);
        setPwLoading(false);
        return;
      }

      const activeId = profile?.id || userId;
      // 3. Atualizar e-mail no Auth e profiles table se for primeiro acesso
      if (firstAccess) {
        const emailResult = await updateEmailAdmin(targetEmail);
        if (emailResult.error) {
          setPwError(`Erro ao atualizar e-mail de login: ${emailResult.error}`);
          setPwLoading(false);
          return;
        }
        await supabaseBrowser
          .from("profiles")
          .upsert({
            id: activeId,
            username: profile?.username || targetEmail.split("@")[0] || `user_${activeId.substring(0, 8)}`,
            email: targetEmail,
            must_change_password: false,
            updated_at: new Date().toISOString(),
          });
      } else {
        // Redefinir sinalizador de alteração de senha
        await supabaseBrowser
          .from("profiles")
          .upsert({
            id: activeId,
            username: profile?.username || email.split("@")[0] || `user_${activeId.substring(0, 8)}`,
            email: email.trim() || null,
            must_change_password: false,
            updated_at: new Date().toISOString(),
          });
      }

      setPwSuccess("Senha alterada com sucesso!");
      setPassword("");
      confirmPassword && setConfirmPassword("");

      // Se for primeiro acesso, redireciona para a home
      if (firstAccess) {
        setTimeout(() => {
          router.replace("/home");
          router.refresh();
        }, 1500);
      }
    } catch (err: any) {
      setPwError(err?.message || "Erro ao processar alteração de senha.");
    } finally {
      setPwLoading(false);
    }
  };

  const getInitials = (name: string | null, username: string) => {
    const display = name || username;
    const parts = display.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Meu Perfil
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Atualize seus dados corporativos, e-mail e senha.
        </Typography>
      </Box>

      {firstAccess && (
        <Alert severity="warning" sx={{ borderRadius: 3 }}>
          <strong>Primeiro acesso necessário:</strong> Preencha seu <strong>e-mail corporativo real</strong> no formulário e defina uma <strong>nova senha de acesso</strong> para ativar sua conta.
        </Alert>
      )}

      <Card>
        <CardContent>
          <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 3 }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: "primary.main" }}>
              {profile ? getInitials(profile.full_name, profile.username) : "?"}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {profile?.full_name || profile?.username}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                <Chip
                  size="small"
                  label={profile?.role === "admin" ? "Administrador" : "Colaborador"}
                  color={profile?.role === "admin" ? "primary" : "default"}
                  variant="outlined"
                />
                <Chip
                  size="small"
                  label={`${profile?.points || 0} pts`}
                  color="warning"
                  variant="filled"
                />
              </Stack>
            </Box>
          </Stack>

          <form onSubmit={handleUpdateProfile}>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Nome Completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  fullWidth
                  disabled={profileLoading}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Usuário (login)"
                  value={profile?.username || ""}
                  fullWidth
                  disabled
                  helperText="Nome de usuário gerenciado pelo administrador."
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="E-mail Corporativo"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                  required={firstAccess}
                  disabled={profileLoading}
                  helperText={firstAccess ? "Insira seu e-mail real para futuros logins." : "Utilizado para login e recebimento de notificações."}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Cargo"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  fullWidth
                  disabled={profileLoading}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  label="Departamento"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  fullWidth
                  disabled={profileLoading}
                >
                  <MenuItem value="">
                    <em>Nenhum</em>
                  </MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Telefone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  fullWidth
                  disabled={profileLoading}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Data de Admissão"
                  type="date"
                  value={admissionDate}
                  onChange={(e) => setAdmissionDate(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  fullWidth
                  disabled={profileLoading}
                />
              </Grid>

              <Grid size={12}>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  {profileError && <Alert severity="error">{profileError}</Alert>}
                  {profileSuccess && <Alert severity="success">{profileSuccess}</Alert>}
                  <Box>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={profileLoading}
                    >
                      {profileLoading ? "Salvando..." : "Salvar Dados Cadastrais"}
                    </Button>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Definir Nova Senha
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Sua senha deve conter no mínimo 6 caracteres.
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <form onSubmit={handleChangePassword}>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Nova Senha"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  fullWidth
                  required
                  disabled={pwLoading}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Confirmar Nova Senha"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  fullWidth
                  required
                  disabled={pwLoading}
                />
              </Grid>

              <Grid size={12}>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  {pwError && <Alert severity="error">{pwError}</Alert>}
                  {pwSuccess && <Alert severity="success">{pwSuccess}</Alert>}
                  <Box>
                    <Button
                      type="submit"
                      variant="contained"
                      color="secondary"
                      disabled={pwLoading}
                    >
                      {pwLoading ? "Alterando..." : "Atualizar Senha"}
                    </Button>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Stack>
  );
}
