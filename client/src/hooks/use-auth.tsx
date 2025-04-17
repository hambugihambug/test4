import { createContext, useState, ReactNode, useContext, useEffect } from "react";
import { InsertUser, User, UserRole } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

// 인증 컨텍스트 타입
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: InsertUser) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 로컬 스토리지에서 사용자 정보 로드
  useEffect(() => {
    const loadUser = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        
        console.log("토큰 확인:", !!token);
        
        if (token) {
          // 서버에서 사용자 정보 가져오기
          try {
            // 토큰으로 사용자 정보 조회
            const response = await fetch('/api/user', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (response.ok) {
              const userData = await response.json();
              console.log("사용자 정보 로드 성공:", userData);
              setUser(userData);
              
              // 인증 페이지에 있다면 홈으로 리디렉션
              if (window.location.pathname === '/auth') {
                console.log("로그인 상태에서 인증 페이지 방문 - 홈으로 리디렉션");
                setLocation('/');
              }
            } else {
              // 토큰이 유효하지 않은 경우
              console.error("토큰이 유효하지 않음:", response.status);
              localStorage.removeItem('token');
              if (window.location.pathname !== '/auth') {
                console.log("유효하지 않은 토큰 - 로그인 페이지로 리디렉션");
                setLocation('/auth');
              }
            }
          } catch (error) {
            console.error("사용자 정보 로드 오류:", error);
            localStorage.removeItem('token');
            if (window.location.pathname !== '/auth') {
              console.log("사용자 정보 로드 오류 - 로그인 페이지로 리디렉션");
              setLocation('/auth');
            }
          }
        } else {
          // 토큰이 없고 로그인 페이지가 아니면 로그인 페이지로 리디렉션
          if (window.location.pathname !== '/auth') {
            console.log("토큰 없음 - 로그인 페이지로 리디렉션");
            setLocation('/auth');
          } else {
            console.log("토큰 없음, 이미 로그인 페이지에 있음");
          }
        }
      } catch (error) {
        console.error("인증 초기화 오류:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [setLocation]);

  // 로그인 함수
  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      
      const response = await apiRequest('POST', '/api/login', { username, password });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '로그인에 실패했습니다');
      }
      
      const userData = await response.json();
      
      // 사용자 ID를 토큰으로 저장 (실제 구현에서는 JWT 등 사용 권장)
      localStorage.setItem('token', userData.id.toString());
      
      setUser(userData);
      
      // 성공 메시지 표시
      toast({
        title: "로그인 성공",
        description: `${userData.name}님 환영합니다!`,
      });
      
      // 홈 페이지로 이동
      setLocation("/");
    } catch (error) {
      console.error("로그인 오류:", error);
      setError(error instanceof Error ? error : new Error("로그인에 실패했습니다"));
      
      toast({
        title: "로그인 실패",
        description: error instanceof Error ? error.message : "로그인에 실패했습니다",
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 로그아웃 함수
  const logout = async () => {
    try {
      setIsLoading(true);
      
      await apiRequest('POST', '/api/logout');
      
      // 로컬 스토리지에서 토큰 삭제
      localStorage.removeItem('token');
      setUser(null);
      
      toast({
        title: "로그아웃 되었습니다",
      });
      
      // 로그인 페이지로 이동
      setLocation("/auth");
    } catch (error) {
      console.error("로그아웃 오류:", error);
      
      toast({
        title: "로그아웃 처리 중 문제가 발생했습니다",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 회원가입 함수
  const register = async (userData: InsertUser) => {
    try {
      setIsLoading(true);
      
      const response = await apiRequest('POST', '/api/register', userData);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '회원가입에 실패했습니다');
      }
      
      const newUser = await response.json();
      
      // 사용자 ID를 토큰으로 저장
      localStorage.setItem('token', newUser.id.toString());
      
      setUser(newUser);
      
      toast({
        title: "회원가입 성공",
        description: "계정이 성공적으로 생성되었습니다.",
      });
      
      // 홈 페이지로 이동
      setLocation("/");
    } catch (error) {
      console.error("회원가입 오류:", error);
      setError(error instanceof Error ? error : new Error("회원가입에 실패했습니다"));
      
      toast({
        title: "회원가입 실패",
        description: error instanceof Error ? error.message : "회원가입에 실패했습니다",
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        logout,
        register
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}