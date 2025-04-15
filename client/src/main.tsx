import { createRoot } from "react-dom/client";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Route, Switch, Link, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { useState } from "react";
import FallDetectionPage from "./pages/fall-detection-page";
import DashboardPage from "./pages/dashboard-page";
import { 
  Home, 
  LayoutDashboard, 
  MonitorSmartphone, 
  Users, 
  Activity, 
  LogIn,
  Search,
  Settings,
  Bell,
  Camera,
  Menu,
  User,
  ChevronDown 
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

// 홈 페이지 컴포넌트
const HomePage = () => {
  const [currentLang, setCurrentLang] = useState('ko');
  
  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">스마트 케어 시스템</h1>
          <p className="text-gray-500">환자 안전을 위한 AI 기반 낙상 감지 및 모니터링 플랫폼</p>
        </div>
        
        <div className="flex gap-3">
          <Select value={currentLang} onValueChange={setCurrentLang}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ko">한국어</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="ja">日本語</SelectItem>
              <SelectItem value="zh">中文</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
        <Card className="bg-gradient-to-br from-primary/90 to-primary/70 text-white p-6 shadow-md rounded-lg border-none">
          <div className="flex flex-col h-full">
            <div className="mb-4">
              <Badge className="bg-white/20 hover:bg-white/30 text-white border-none">New</Badge>
            </div>
            <h2 className="text-2xl font-bold mb-3">실시간 환자 모니터링</h2>
            <p className="mb-6 opacity-90">
              최첨단 AI 기술을 활용하여 환자의 낙상 사고를 실시간으로 감지하고 즉시 알림을 제공합니다.
            </p>
            <div className="mt-auto">
              <Link href="/dashboard">
                <Button className="bg-white text-primary hover:bg-white/90">
                  대시보드 바로가기
                </Button>
              </Link>
            </div>
          </div>
        </Card>
        
        <Card className="bg-white p-6 shadow-md rounded-lg">
          <div className="flex flex-col h-full">
            <div className="mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <MonitorSmartphone className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-3">AI 낙상 감지 시스템</h3>
            <p className="text-gray-600 mb-6">
              TensorFlow 기반의 AI 포즈 감지 기술을 활용하여 실시간으로 환자의 낙상을 감지하고 의료진에게 즉시 알립니다.
            </p>
            <div className="mt-auto">
              <Link href="/fall-detection">
                <Button variant="outline">낙상 감지 시스템 확인</Button>
              </Link>
            </div>
          </div>
        </Card>
        
        <Card className="bg-white p-6 shadow-md rounded-lg">
          <div className="flex flex-col h-full">
            <div className="mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Activity className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-3">환경 모니터링 및 알림</h3>
            <p className="text-gray-600 mb-6">
              병실의 온도, 습도 등 환경 조건을 실시간으로 모니터링하고, 설정된 임계값을 벗어나면 자동으로 알림을 생성합니다.
            </p>
            <div className="mt-auto">
              <Link href="/room-management">
                <Button variant="outline">병실 관리 시스템</Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold mb-4">주요 기능</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 bg-white rounded-lg border shadow-sm">
              <div className="p-2 rounded-lg bg-blue-100">
                <Camera className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium mb-1">실시간 영상 모니터링</h3>
                <p className="text-sm text-gray-600">
                  AI 기반 실시간 영상 분석을 통해 환자의 낙상 감지 및 이상 행동을 즉시 포착합니다.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-white rounded-lg border shadow-sm">
              <div className="p-2 rounded-lg bg-green-100">
                <Bell className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium mb-1">즉각적인 알림 시스템</h3>
                <p className="text-sm text-gray-600">
                  낙상 감지 시 담당 의료진에게 즉시 알림을 보내 신속한 대응이 가능하도록 합니다.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-white rounded-lg border shadow-sm">
              <div className="p-2 rounded-lg bg-purple-100">
                <LayoutDashboard className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium mb-1">종합 대시보드</h3>
                <p className="text-sm text-gray-600">
                  병원 전체의 환자 상태, 낙상 감지 통계, 환경 정보를 한눈에 확인할 수 있는 대시보드를 제공합니다.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-white rounded-lg border shadow-sm">
              <div className="p-2 rounded-lg bg-amber-100">
                <Users className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-medium mb-1">환자 및 직원 관리</h3>
                <p className="text-sm text-gray-600">
                  환자, 보호자, 의료진 정보를 체계적으로 관리하고 권한에 따른 접근 제어를 제공합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold mb-4">시작하기</h2>
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="font-bold text-primary">1</span>
                </div>
                <p className="text-gray-700">로그인하여 시스템에 접속하세요.</p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="font-bold text-primary">2</span>
                </div>
                <p className="text-gray-700">대시보드에서 병원 전체 현황을 확인하세요.</p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="font-bold text-primary">3</span>
                </div>
                <p className="text-gray-700">낙상 감지 시스템으로 이동하여 실시간 모니터링을 시작하세요.</p>
              </div>
              
              <div className="mt-6">
                <Link href="/login">
                  <Button className="w-full">로그인하고 시작하기</Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

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
    <div className="flex min-h-[calc(100vh-64px)]">
      <div className="hidden md:flex md:w-1/2 bg-primary/90 p-8 flex-col justify-center">
        <div className="max-w-md mx-auto text-white">
          <h1 className="text-3xl font-bold mb-4">스마트 케어 시스템</h1>
          <p className="text-xl text-white/90 mb-6">AI 기반 환자 낙상 감지 및 모니터링 플랫폼</p>
          
          <div className="space-y-6 mt-10">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-white/10 mt-1">
                <MonitorSmartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-lg">실시간 모니터링</h3>
                <p className="text-white/80">24시간 AI 기반 실시간 낙상 감지 및 환자 모니터링</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-white/10 mt-1">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-lg">즉각적인 알림</h3>
                <p className="text-white/80">낙상 감지 시 담당 의료진에게 즉시 알림 전송</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-white/10 mt-1">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-lg">분석 및 보고</h3>
                <p className="text-white/80">환자 상태 및 낙상 사고에 대한 상세 분석 및 보고서 제공</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="w-full md:w-1/2 p-6 md:p-8 flex items-center">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8 md:hidden">
            <h1 className="text-2xl font-bold text-primary">스마트 케어 시스템</h1>
            <p className="text-gray-600">의료진 접속 시스템</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <h2 className="text-2xl font-bold mb-6">로그인</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="username">
                    아이디
                  </label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="아이디를 입력하세요"
                    required
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="password">
                    비밀번호
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호를 입력하세요"
                    required
                    className="w-full"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                      로그인 상태 유지
                    </label>
                  </div>
                  
                  <a href="#" className="text-sm text-primary hover:underline">
                    비밀번호 찾기
                  </a>
                </div>
              </div>
              
              <Button type="submit" className="w-full">
                로그인
              </Button>
            </form>
            
            <div className="mt-6 text-center text-sm text-gray-600">
              <p>
                계정이 없으신가요? <a href="#" className="text-primary hover:underline">회원가입 요청</a>
              </p>
            </div>
          </div>
          
          <p className="text-center text-sm text-gray-500 mt-8">
            © 2025 스마트 케어 시스템. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

// 404 페이지 컴포넌트
const NotFoundPage = () => (
  <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <h2 className="text-2xl font-medium text-gray-800 mb-4">페이지를 찾을 수 없습니다</h2>
      <p className="text-gray-600 mb-8">요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.</p>
      <Link href="/">
        <Button>
          <Home className="mr-2 h-4 w-4" />
          홈으로 돌아가기
        </Button>
      </Link>
    </div>
  </div>
);

// 모바일 내비게이션 컴포넌트
const MobileNav = () => {
  const [location] = useLocation();
  
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <div className="flex flex-col h-full">
          <div className="px-2 py-4">
            <h2 className="text-xl font-bold text-primary">스마트 케어 시스템</h2>
            <p className="text-sm text-gray-500">병원 관리 플랫폼</p>
          </div>
          
          <nav className="flex-1">
            <ul className="space-y-2 px-2">
              <li>
                <Link href="/">
                  <button className={`flex items-center w-full px-3 py-2 rounded-md ${location === '/' ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100'}`}>
                    <Home className="mr-3 h-5 w-5" />
                    홈
                  </button>
                </Link>
              </li>
              <li>
                <Link href="/dashboard">
                  <button className={`flex items-center w-full px-3 py-2 rounded-md ${location === '/dashboard' ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100'}`}>
                    <LayoutDashboard className="mr-3 h-5 w-5" />
                    대시보드
                  </button>
                </Link>
              </li>
              <li>
                <Link href="/fall-detection">
                  <button className={`flex items-center w-full px-3 py-2 rounded-md ${location === '/fall-detection' ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100'}`}>
                    <MonitorSmartphone className="mr-3 h-5 w-5" />
                    낙상 감지
                  </button>
                </Link>
              </li>
              <li>
                <Link href="/login">
                  <button className={`flex items-center w-full px-3 py-2 rounded-md ${location === '/login' ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100'}`}>
                    <LogIn className="mr-3 h-5 w-5" />
                    로그인
                  </button>
                </Link>
              </li>
            </ul>
          </nav>
          
          <div className="border-t pt-4 px-2 pb-8">
            <p className="text-xs text-gray-500">© 2025 스마트 케어 시스템</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// 메인 앱 컴포넌트
const App = () => {
  const [location] = useLocation();
  
  return (
    <>
      <div className="min-h-screen bg-gray-50/50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="container mx-auto px-4 flex h-16 items-center justify-between">
            <div className="flex items-center gap-2 md:gap-8">
              <div className="flex items-center">
                <MobileNav />
                <Link href="/" className="hidden md:flex items-center">
                  <img src="https://via.placeholder.com/32" alt="Logo" className="w-8 h-8 mr-2" />
                  <h1 className="text-xl font-bold text-primary">스마트 케어</h1>
                </Link>
                <Link href="/" className="md:hidden flex items-center">
                  <img src="https://via.placeholder.com/32" alt="Logo" className="w-8 h-8" />
                </Link>
              </div>
              
              <nav className="hidden md:flex">
                <ul className="flex space-x-1">
                  <li>
                    <Link href="/">
                      <Button variant={location === '/' ? "secondary" : "ghost"} className="gap-2">
                        <Home className="h-4 w-4" />
                        홈
                      </Button>
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard">
                      <Button variant={location === '/dashboard' ? "secondary" : "ghost"} className="gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        대시보드
                      </Button>
                    </Link>
                  </li>
                  <li>
                    <Link href="/fall-detection">
                      <Button variant={location === '/fall-detection' ? "secondary" : "ghost"} className="gap-2">
                        <MonitorSmartphone className="h-4 w-4" />
                        낙상 감지
                      </Button>
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden md:flex relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="검색..." 
                  className="pl-10 w-[200px] focus-visible:ring-primary" 
                />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      3
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[300px]">
                  <DropdownMenuLabel>알림</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-[300px] overflow-y-auto">
                    <DropdownMenuItem className="py-3 flex flex-col items-start cursor-pointer">
                      <div className="flex items-center text-red-500 mb-1 w-full">
                        <span className="font-medium">낙상 감지 알림</span>
                        <span className="text-xs ml-auto">5분 전</span>
                      </div>
                      <span className="text-sm">102호 3번 병상 환자 낙상 감지됨</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="py-3 flex flex-col items-start cursor-pointer">
                      <div className="flex items-center text-amber-500 mb-1 w-full">
                        <span className="font-medium">온도 경고</span>
                        <span className="text-xs ml-auto">30분 전</span>
                      </div>
                      <span className="text-sm">104호 실내 온도 임계값 초과 (27.5°C)</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="py-3 flex flex-col items-start cursor-pointer">
                      <div className="flex items-center mb-1 w-full">
                        <span className="font-medium">새 환자 등록</span>
                        <span className="text-xs ml-auto">2시간 전</span>
                      </div>
                      <span className="text-sm">홍길동 환자가 102호에 새로 등록되었습니다</span>
                    </DropdownMenuItem>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer justify-center">
                    모든 알림 보기
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Link href="/login">
                <Button variant="outline" className="hidden md:flex gap-2">
                  <LogIn className="h-4 w-4" />
                  로그인
                </Button>
              </Link>
              
              <Link href="/login" className="md:hidden">
                <Button variant="outline" size="icon">
                  <LogIn className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </header>
        
        <main>
          <Switch>
            <Route path="/" component={HomePage} />
            <Route path="/login" component={LoginPage} />
            <Route path="/dashboard" component={DashboardPage} />
            <Route path="/fall-detection" component={FallDetectionPage} />
            <Route component={NotFoundPage} />
          </Switch>
        </main>
        
        <footer className="bg-white border-t py-6">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-center md:text-left mb-4 md:mb-0">
                <p className="text-sm text-gray-500">© 2025 스마트 케어 시스템. All rights reserved.</p>
              </div>
              
              <div className="flex gap-6">
                <a href="#" className="text-gray-500 hover:text-primary text-sm">이용약관</a>
                <a href="#" className="text-gray-500 hover:text-primary text-sm">개인정보처리방침</a>
                <a href="#" className="text-gray-500 hover:text-primary text-sm">고객지원</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
      <Toaster />
    </>
  );
};

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
