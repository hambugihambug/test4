import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Route, Redirect } from "wouter";
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
  
  console.log(`ProtectedRoute(${path}) - 인증 상태:`, {
    isLoading,
    userExists: !!user,
    userRole: user?.role,
  });
  
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
    console.log(`ProtectedRoute(${path}) - 미인증 사용자, 로그인 페이지로 이동`);
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
    
    // 디버깅 로그 추가
    console.log(`권한 체크 중: 사용자 역할: "${user.role}", 필요한 역할:`, roles);
    
    for (const role of roles) {
      console.log(`비교: "${user.role}" === "${role}" => ${user.role === role}`);
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
            <h1 className="text-2xl font-bold mb-4">관리자 전용 페이지</h1>
            <p className="text-gray-500 mb-4">
              이 페이지는 관리자 권한이 있는 사용자만 접근할 수 있습니다.
            </p>
            <p className="text-gray-500 mb-4">
              계정 권한: {user.role}
            </p>
          </div>
        </Route>
      );
    }
  }

  return <Route path={path} component={Component} />;
}