import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Route, Redirect } from "wouter";
import { ReactNode } from "react";
import { UserRole } from "@shared/schema";

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
  
  // 토큰이 있지만 user가 없는 경우 토큰 유효성 명시적 확인 및 페이지 새로고침
  if (token && !user && !isLoading) {
    console.log("토큰은 있지만 user 객체가 없음. 토큰 유효성 확인 필요");
    
    // 토큰 유효성 검사를 위한 비동기 함수
    (async () => {
      try {
        const response = await fetch('/api/user', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          console.log("토큰이 유효함, 페이지 새로고침");
          window.location.reload(); // 페이지 새로고침으로 user 객체 갱신
        } else {
          console.log("토큰이 유효하지 않음, 토큰 제거");
          localStorage.removeItem('token');
          window.location.href = '/auth';
        }
      } catch (error) {
        console.error("토큰 유효성 확인 중 오류:", error);
      }
    })();
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
    let hasAccess = false;
    for (const role of roles) {
      if (user.role === role) {
        hasAccess = true;
        break;
      }
    }
    
    if (!hasAccess) {
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