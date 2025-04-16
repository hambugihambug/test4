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
  
  // 토큰이 있지만 user가 없는 경우 토큰 유효성 명시적 확인 및 수동 업데이트
  if (token && !user && !isLoading) {
    console.log("토큰은 있지만 user 객체가 없음. 토큰 유효성 확인 필요");
    
    // 무한 리디렉션 방지를 위해 sessionStorage 상태 확인
    const redirectAttempt = sessionStorage.getItem('redirectAttempt') || '0';
    const attempt = parseInt(redirectAttempt);
    
    if (attempt < 3) {  // 최대 3번만 시도
      // 시도 횟수 증가
      sessionStorage.setItem('redirectAttempt', (attempt + 1).toString());
      
      // 토큰 유효성 검사를 위한 비동기 함수
      (async () => {
        try {
          console.log("토큰 유효성 검사 실행 중 (시도: " + (attempt + 1) + ")");
          const response = await fetch('/api/user', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            // 응답이 정상이면 사용자 데이터를 수동으로 설정
            const userData = await response.json();
            console.log("수동 검증으로 사용자 데이터 획득:", userData);
            
            // 전역 상태의 사용자 정보 업데이트
            if (userData && userData.id) {
              queryClient.setQueryData(["/api/user"], userData);
              console.log("사용자 데이터 수동 업데이트 완료");
              
              // 홈페이지로 이동 (무한 리디렉션 방지를 위해 setTimeout 사용)
              setTimeout(() => {
                sessionStorage.removeItem('redirectAttempt'); // 성공했으므로 시도 횟수 초기화
                window.location.href = '/';
              }, 100);
              return; // 조기 종료
            }
          } else {
            console.log("토큰이 유효하지 않음, 토큰 제거");
            localStorage.removeItem('token');
            sessionStorage.removeItem('redirectAttempt');
            window.location.href = '/auth';
          }
        } catch (error) {
          console.error("토큰 유효성 확인 중 오류:", error);
        }
      })();
    } else {
      console.log("최대 리디렉션 시도 횟수 초과, 로그아웃 처리");
      localStorage.removeItem('token');
      sessionStorage.removeItem('redirectAttempt');
      window.location.href = '/auth';
    }
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