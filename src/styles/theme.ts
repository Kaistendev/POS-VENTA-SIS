import { createTheme } from "@mui/material/styles";
import type {} from "@mui/x-data-grid/themeAugmentation";
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#c084fc", // purple-400 equivalent for the accent
    },
    background: {
      default: "#121212", // tailwind neutral-950/gray-900 baseline
      paper: "#1e1e1e", // Slightly lighter for paper elements
    },
    text: {
      primary: "#f3f4f6", // gray-100
      secondary: "#9ca3af", // gray-400
    },
  },
  typography: {
    fontFamily: [
      "Inter",
      "ui-sans-serif",
      "system-ui",
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
    ].join(","),
  },
  components: {
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: "none",
          backgroundColor: "#16171d", // matching your dark background token
          color: "#f3f4f6",
          borderRadius: "12px", // rounded-xl Look
          boxShadow:
            "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        },
        columnHeaders: {
          backgroundColor: "#1f2028",
          borderBottom: "1px solid #2e303a",
          color: "#f3f4f6",
          fontWeight: 600,
        },
        cell: {
          borderBottom: "1px solid #2e303a",
          color: "#d1d5db",
        },
        footerContainer: {
          backgroundColor: "#1f2028",
          borderTop: "1px solid #2e303a",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
  },
});

export default darkTheme;
