import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { router } from "./routes";
import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="datn-theme">
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>
);
