import { createRoot } from "react-dom/client";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import App from "./App";

// 토큰 디버깅: 앱 시작 시 토큰 확인
const token = localStorage.getItem('token');
console.log("앱 시작 시 토큰 상태:", token ? "토큰 있음" : "토큰 없음");
if (token) {
  console.log("토큰 샘플:", token.substring(0, 20) + "...");
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);