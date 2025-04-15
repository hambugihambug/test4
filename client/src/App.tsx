import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import FallDetectionPage from "@/pages/fall-detection-page";
import DashboardPage from "@/pages/dashboard-page";
import { Home, LayoutDashboard, MonitorSmartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

function App() {
  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b shadow-sm p-4">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-xl font-bold text-primary">스마트 케어 시스템</span>
            </div>
            <nav className="hidden md:flex space-x-2">
              <a href="/" className="px-3 py-2 rounded hover:bg-gray-100">홈</a>
              <a href="/dashboard" className="px-3 py-2 rounded hover:bg-gray-100">대시보드</a>
              <a href="/fall-detection" className="px-3 py-2 rounded hover:bg-gray-100">낙상 감지</a>
            </nav>
            <div>
              <Button variant="outline" size="sm">로그인</Button>
            </div>
          </div>
        </header>
        
        <main>
          <Switch>
            <Route path="/">
              <div className="p-8 max-w-screen-lg mx-auto">
                <h1 className="text-2xl font-bold mb-4">병원 모니터링 시스템</h1>
                <p className="mb-6">환영합니다. 이 시스템은 환자의 낙상 사고를 감지하고 환경을 모니터링합니다.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-white p-4 rounded shadow-sm border">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                      <MonitorSmartphone className="h-5 w-5 text-blue-600" />
                    </div>
                    <h2 className="font-bold mb-2">낙상 감지</h2>
                    <p className="text-sm text-gray-600 mb-4">AI 기술을 활용한 실시간 환자 낙상 감지 시스템입니다.</p>
                    <a href="/fall-detection" className="text-sm text-primary font-medium">낙상 감지 페이지 &rarr;</a>
                  </div>
                  
                  <div className="bg-white p-4 rounded shadow-sm border">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
                      <LayoutDashboard className="h-5 w-5 text-indigo-600" />
                    </div>
                    <h2 className="font-bold mb-2">대시보드</h2>
                    <p className="text-sm text-gray-600 mb-4">병원 전체 현황과 환자 상태를 모니터링하는 대시보드입니다.</p>
                    <a href="/dashboard" className="text-sm text-primary font-medium">대시보드 확인 &rarr;</a>
                  </div>
                  
                  <div className="bg-white p-4 rounded shadow-sm border">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-3">
                      <Home className="h-5 w-5 text-green-600" />
                    </div>
                    <h2 className="font-bold mb-2">환경 모니터링</h2>
                    <p className="text-sm text-gray-600 mb-4">병실 환경을 모니터링하고 이상 상황을 감지합니다.</p>
                    <a href="/environment" className="text-sm text-primary font-medium">환경 모니터링 &rarr;</a>
                  </div>
                </div>
              </div>
            </Route>
            <Route path="/dashboard">
              <DashboardPage />
            </Route>
            <Route path="/fall-detection">
              <FallDetectionPage />
            </Route>
            <Route>
              <NotFound />
            </Route>
          </Switch>
        </main>
        
        <footer className="bg-white border-t py-4 mt-8">
          <div className="container mx-auto px-4 text-center text-sm text-gray-500">
            © 2025 스마트 케어 시스템. All rights reserved.
          </div>
        </footer>
      </div>
      <Toaster />
    </>
  );
}

export default App;
