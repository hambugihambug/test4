import { createRoot } from "react-dom/client";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

// 극히 간단한 앱으로 시작
const App = () => (
  <div className="p-8 text-center">
    <h1 className="text-2xl font-bold mb-4">병원 모니터링 시스템</h1>
    <p>환영합니다. 이 시스템은 환자의 낙상 사고를 감지하고 환경을 모니터링합니다.</p>
  </div>
);

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
