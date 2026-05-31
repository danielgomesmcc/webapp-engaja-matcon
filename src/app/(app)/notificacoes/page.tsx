import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Box, Card, CardContent, Typography, Stack, List, ListItem, ListItemIcon, ListItemText, Button } from "@mui/material";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";

export default async function NotificacoesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <Stack spacing={3}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Minhas Notificações
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Fique por dentro das atualizações de quizzes, votações, treinamentos e elogios.
          </Typography>
        </Box>
        {notifications && notifications.length > 0 && (
          <Button variant="outlined" size="small">
            Marcar todas como lidas
          </Button>
        )}
      </Box>

      {notifications && notifications.length > 0 ? (
        <Card>
          <CardContent sx={{ p: 0 }}>
            <List disablePadding>
              {notifications.map((notif, idx) => (
                <ListItem key={notif.id} divider={idx < notifications.length - 1} sx={{ px: 3, py: 2 }}>
                  <ListItemIcon>
                    {notif.type === "announcement" ? (
                      <CampaignRoundedIcon color="primary" />
                    ) : (
                      <InfoRoundedIcon color="info" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={notif.title}
                    secondary={notif.body}
                    slotProps={{
                      primary: { variant: "subtitle2", sx: { fontWeight: 600 } },
                      secondary: { variant: "body2", color: "text.secondary" }
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {new Date(notif.created_at).toLocaleDateString("pt-BR")}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      ) : (
        <Card variant="outlined" sx={{ py: 6, textAlign: "center" }}>
          <CardContent>
            <NotificationsRoundedIcon color="disabled" sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h6" color="text.secondary">
              Nenhuma nova notificação
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tudo limpo por aqui! Avisaremos quando houver atualizações.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
