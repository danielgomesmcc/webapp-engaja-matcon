"use client";

import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";

export default function ConfiguracoesPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Configurações
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Personalize as preferências de exibição e notificações do aplicativo.
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
            <SettingsRoundedIcon color="primary" />
            Preferências do Aplicativo
          </Typography>
          <List disablePadding>
            <ListItem
              disableGutters
              secondaryAction={
                <Switch
                  checked={darkMode}
                  onChange={(e) => setDarkMode(e.target.checked)}
                />
              }
            >
              <ListItemText
                primary="Modo Escuro (Dark Mode)"
                secondary="Alternar visualização entre tema claro e escuro."
                slotProps={{
                  primary: { variant: "subtitle2", sx: { fontWeight: 600 } },
                  secondary: { variant: "body2" },
                }}
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
            <NotificationsActiveRoundedIcon color="secondary" />
            Preferências de Notificações
          </Typography>
          <List disablePadding>
            <ListItem
              disableGutters
              divider
              secondaryAction={
                <Switch
                  checked={emailNotif}
                  onChange={(e) => setEmailNotif(e.target.checked)}
                />
              }
            >
              <ListItemText
                primary="Notificações por E-mail"
                secondary="Receber e-mails semanais sobre novos quizzes e reconhecimentos recebidos."
                slotProps={{
                  primary: { variant: "subtitle2", sx: { fontWeight: 600 } },
                  secondary: { variant: "body2" },
                }}
              />
            </ListItem>
            <ListItem
              disableGutters
              secondaryAction={
                <Switch
                  checked={pushNotif}
                  onChange={(e) => setPushNotif(e.target.checked)}
                />
              }
            >
              <ListItemText
                primary="Notificações em Tempo Real (Push)"
                secondary="Mostrar alertas sonoros e balões visuais no navegador ao receber mensagens."
                slotProps={{
                  primary: { variant: "subtitle2", sx: { fontWeight: 600 } },
                  secondary: { variant: "body2" },
                }}
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Stack>
  );
}
