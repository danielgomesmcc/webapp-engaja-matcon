import { redirect } from "next/navigation";
import { Box, Container } from "@mui/material";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import SessionGuard from "@/components/layout/SessionGuard";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Obter o perfil do usuário logado
  let profile = null;
  try {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, username, email, role, must_change_password")
      .eq("id", user.id)
      .maybeSingle();
    profile = data;
  } catch (err) {
    console.error("Erro ao carregar perfil:", err);
  }

  const mustChangePassword = profile?.must_change_password ?? true;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
      }}
    >
      <SessionGuard mustChangePassword={mustChangePassword} />
      <AppHeader userProfile={profile} />
      <Container
        component="main"
        maxWidth="lg"
        sx={{ flexGrow: 1, py: { xs: 2, sm: 3 } }}
      >
        {children}
      </Container>
      <BottomNav />
    </Box>
  );
}
