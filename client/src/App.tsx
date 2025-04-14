import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { useState } from "react";

// 간단한 홈 페이지 컴포넌트
const HomePage = () => (
  <div className="p-8 text-center">
    <h1 className="text-2xl font-bold mb-4">병원 모니터링 시스템</h1>
    <p>환영합니다. 이 시스템은 환자의 낙상 사고를 감지하고 환경을 모니터링합니다.</p>
  </div>
);

function App() {
  return (
    <>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </>
  );
}

export default App;
