import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Route, Redirect } from "wouter";
import { ReactNode, useEffect } from "react";
import { UserRole } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType<any>;
  roles?: UserRole[];
}

export function ProtectedRoute({
  path,
  component: Component,
  roles,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  
  // 토큰 확인 로직 추가
  const token = localStorage.getItem('token');
  
  // 디버깅용 로그 추가
  console.log(`ProtectedRoute(${path}) - 인증 상태:`, {
    isLoading,
    userExists: !!user,
    userRole: user?.role,
    tokenExists: !!token
  });
  
  // 토큰이 있지만 user가 없는 경우 직접 리턴해서 useEffect에서 처리하도록 함
  if (token && !user && !isLoading) {
    console.log("토큰은 있지만 user 객체가 없음. 리디렉션 중...");
    
    // AuthProvider에서 토큰 처리가 중요하므로, 여기서는 일단 로딩 화면만 노출
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen flex-col">
          <Loader2 className="h-8 w-8 animate-spin text-border mb-4" />
          <p className="text-gray-500">계정 정보를 확인 중입니다...</p>
        </div>
      </Route>
    );
  }

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  // 사용자가 로그인하지 않은 경우
  if (!user) {
    console.log(`ProtectedRoute(${path}) - 미인증 사용자 감지, 로그인 페이지로 리디렉션`);
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // 특정 역할이 필요한 경우 역할 확인
  if (roles && roles.length > 0) {
    // 역할 권한 확인
    let hasAccess = false;
    
    for (const role of roles) {
      if (user.role === role) {
        hasAccess = true;
        break;
      }
    }
    
    if (!hasAccess) {
      console.log(`사용자 ${user.username}(${user.role})는 ${path} 페이지에 접근 권한이 없음`);
      return (
        <Route path={path}>
          <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <h1 className="text-2xl font-bold mb-4">접근 권한이 없습니다</h1>
            <p className="text-gray-500 mb-4">
              이 페이지에 접근하기 위한 권한이 없습니다.
            </p>
          </div>
        </Route>
      );
    }
  }

  return <Route path={path} component={Component} />;
}