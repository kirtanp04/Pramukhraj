import { BrowserRouter } from "react-router-dom";
import { useEffect } from "react";
import { AppRoutes } from "@/routes/AppRoutes";
import { useUIStore } from "@/store/uiStore";

export default function App() {
  const theme = useUIStore(s => s.theme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
