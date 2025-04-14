import { createRoot } from "react-dom/client";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Route, Switch, Link } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { useState } from "react";

// 홈 페이지 컴포넌트
const HomePage = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">병원 모니터링 시스템</h1>
    <p className="mb-4">환영합니다. 이 시스템은 환자의 낙상 사고를 감지하고 환경을 모니터링합니다.</p>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-medium mb-2">실시간 모니터링</h3>
        <p className="text-gray-600">AI 기반 낙상 감지 시스템으로 환자를 실시간으로 모니터링합니다.</p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-medium mb-2">환경 관리</h3>
        <p className="text-gray-600">병실 온도와 습도를 실시간으로 모니터링하고 이상 상황을 감지합니다.</p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-medium mb-2">알림 시스템</h3>
        <p className="text-gray-600">낙상 또는 환경 이상 발생 시 즉시 담당자에게 알림을 보냅니다.</p>
      </div>
    </div>
  </div>
);

// 로그인 페이지 컴포넌트
const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("로그인 시도:", { username, password });
    // TODO: 로그인 로직 추가
  };
  
  return (
    <div className="flex justify-center items-center p-8 min-h-[calc(100vh-76px)]">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">로그인</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                아이디
              </label>
              <input
                id="username"
                type="text"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="flex items-center justify-between">
              <button
                type="submit"
                className="bg-primary text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              >
                로그인
              </button>
            </div>
          </form>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              아직 계정이 없으신가요? <a href="/register" className="text-primary hover:underline">회원가입</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// 대시보드 페이지 컴포넌트
const DashboardPage = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">대시보드</h1>
    <p className="mb-6">병원 현황 대시보드입니다.</p>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="font-medium">총 환자 수</h3>
        <p className="text-2xl font-bold mt-2">128명</p>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="font-medium">오늘 낙상 감지</h3>
        <p className="text-2xl font-bold mt-2">3건</p>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="font-medium">환경 이상 알림</h3>
        <p className="text-2xl font-bold mt-2">1건</p>
      </div>
    </div>
  </div>
);

// 404 페이지 컴포넌트
const NotFoundPage = () => (
  <div className="flex items-center justify-center min-h-[calc(100vh-76px)]">
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="mb-4">페이지를 찾을 수 없습니다.</p>
    </div>
  </div>
);

// 메인 앱 컴포넌트
const App = () => (
  <>
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 py-4 px-6 shadow-sm">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-primary">스마트 케어 시스템</h1>
          <nav>
            <ul className="flex space-x-6">
              <li><Link href="/" className="text-gray-600 hover:text-primary">홈</Link></li>
              <li><Link href="/dashboard" className="text-gray-600 hover:text-primary">대시보드</Link></li>
              <li><Link href="/login" className="text-gray-600 hover:text-primary">로그인</Link></li>
            </ul>
          </nav>
        </div>
      </header>
      
      <main>
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/login" component={LoginPage} />
          <Route path="/dashboard" component={DashboardPage} />
          <Route component={NotFoundPage} />
        </Switch>
      </main>
    </div>
    <Toaster />
  </>
);

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
