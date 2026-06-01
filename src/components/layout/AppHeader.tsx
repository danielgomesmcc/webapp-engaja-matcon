"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AppBar,
  Avatar,
  Box,
  Chip,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { supabaseBrowser } from "@/lib/supabase/client";

interface AppHeaderProps {
  userProfile: {
    full_name: string | null;
    username: string;
    email: string | null;
    role: "admin" | "user";
  } | null;
}

export default function AppHeader({ userProfile }: AppHeaderProps) {
  const router = useRouter();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const open = Boolean(anchor);

  const handleSignOut = async () => {
    setAnchor(null);
    await supabaseBrowser.auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  const getInitials = (name: string | null, username: string) => {
    const display = name || username;
    const parts = display.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
  };

  const isAdmin = userProfile?.role === "admin";

  return (
    <AppBar position="sticky" color="inherit">
      <Toolbar sx={{ gap: 1.5 }}>
        <Box
          component="img"
          src="/logo.png"
          alt="Matcon Casa Logo"
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1,
            objectFit: "contain",
          }}
        />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Engaja Matcon
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        {isAdmin && (
          <Chip
            label="Admin"
            size="small"
            color="primary"
            variant="outlined"
            sx={{ display: { xs: "none", sm: "inline-flex" } }}
          />
        )}
        <Typography
          variant="body2"
          sx={{ display: { xs: "none", sm: "block" }, fontWeight: 500 }}
        >
          {userProfile?.full_name || userProfile?.username || "Carregando..."}
        </Typography>

        <IconButton onClick={(e) => setAnchor(e.currentTarget)} size="small">
          <Avatar sx={{ width: 36, height: 36, bgcolor: "primary.main" }}>
            {userProfile ? getInitials(userProfile.full_name, userProfile.username) : "?"}
          </Avatar>
        </IconButton>

        <Menu
          anchorEl={anchor}
          open={open}
          onClose={() => setAnchor(null)}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          slotProps={{ paper: { sx: { minWidth: 220, mt: 1 } } }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle2">
              {userProfile?.full_name || userProfile?.username}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {userProfile?.email || `@${userProfile?.username}`}
            </Typography>
          </Box>
          <Divider />
          <MenuItem
            onClick={() => {
              setAnchor(null);
              router.push("/perfil");
            }}
          >
            <ListItemIcon>
              <PersonRoundedIcon fontSize="small" />
            </ListItemIcon>
            Meu Perfil
          </MenuItem>
          <MenuItem
            onClick={() => {
              setAnchor(null);
              router.push("/configuracoes");
            }}
          >
            <ListItemIcon>
              <SettingsRoundedIcon fontSize="small" />
            </ListItemIcon>
            Configurações
          </MenuItem>
          <MenuItem
            onClick={() => {
              setAnchor(null);
              router.push("/notificacoes");
            }}
          >
            <ListItemIcon>
              <NotificationsRoundedIcon fontSize="small" />
            </ListItemIcon>
            Notificações
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleSignOut}>
            <ListItemIcon>
              <LogoutRoundedIcon fontSize="small" />
            </ListItemIcon>
            Sair
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
