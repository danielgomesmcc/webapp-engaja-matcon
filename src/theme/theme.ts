"use client";
import { createTheme } from "@mui/material/styles";
import { Roboto } from "next/font/google";

export const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

const CORPORATE_GREEN = "#1B7A43";
const GREEN_DARK = "#13592F";
const GREEN_LIGHT = "#4CAF6D";

const theme = createTheme({
  cssVariables: { colorSchemeSelector: "class" },
  colorSchemes: {
    light: {
      palette: {
        mode: "light",
        primary: {
          main: CORPORATE_GREEN,
          dark: GREEN_DARK,
          light: GREEN_LIGHT,
          contrastText: "#FFFFFF",
        },
        secondary: { main: "#2E7D32" },
        background: { default: "#F8FAF8", paper: "#FFFFFF" },
        text: { primary: "#1A1C19", secondary: "#43483F" },
        divider: "#E0E3DE",
      },
    },
    dark: {
      palette: {
        mode: "dark",
        primary: {
          main: GREEN_LIGHT,
          dark: GREEN_DARK,
          light: "#7BD79A",
          contrastText: "#06210F",
        },
        secondary: { main: "#9CCC9E" },
        background: { default: "#0E110F", paper: "#161A17" },
        text: { primary: "#E2E3E0", secondary: "#C1C7C0" },
        divider: "#424943",
      },
    },
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: roboto.style.fontFamily,
    button: { textTransform: "none", fontWeight: 600 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 999, paddingInline: 24, paddingBlock: 8 } },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { border: "1px solid", borderColor: "var(--mui-palette-divider)" },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: "inherit" },
      styleOverrides: {
        root: { borderBottom: "1px solid var(--mui-palette-divider)" },
      },
    },
    MuiPaper: { styleOverrides: { rounded: { borderRadius: 16 } } },
  },
});

export default theme;
