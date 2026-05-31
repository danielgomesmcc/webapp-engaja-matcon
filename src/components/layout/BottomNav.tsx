"use client";

import { usePathname, useRouter } from "next/navigation";
import { Paper, BottomNavigation, BottomNavigationAction } from "@mui/material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import QuizRoundedIcon from "@mui/icons-material/QuizRounded";
import HowToVoteRoundedIcon from "@mui/icons-material/HowToVoteRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";

const TABS = [
  { label: "Home", icon: <HomeRoundedIcon />, path: "/home" },
  { label: "Quiz", icon: <QuizRoundedIcon />, path: "/quiz" },
  { label: "Votação", icon: <HowToVoteRoundedIcon />, path: "/votacao" },
  { label: "Destaque", icon: <EmojiEventsRoundedIcon />, path: "/destaque" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const current = TABS.findIndex((t) => pathname.startsWith(t.path));

  return (
    <Paper
      elevation={3}
      sx={{
        position: "sticky",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: (t) => t.zIndex.appBar,
        borderTop: "1px solid var(--mui-palette-divider)",
        borderRadius: 0,
      }}
    >
      <BottomNavigation
        showLabels
        value={current === -1 ? 0 : current}
        onChange={(_, idx) => {
          if (idx !== -1) {
            router.push(TABS[idx].path);
          }
        }}
      >
        {TABS.map((t) => (
          <BottomNavigationAction key={t.path} label={t.label} icon={t.icon} />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
