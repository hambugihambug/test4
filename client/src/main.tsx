import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { I18nProvider } from "./contexts/I18nContext";
import { AuthProvider } from "./hooks/use-auth";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <I18nProvider>
      <App />
    </I18nProvider>
  </AuthProvider>
);
