import { createContext, useState, ReactNode, useContext, useEffect } from "react";
import { InsertUser, User, UserRole } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

// 인증 토큰 관련 상수
const TOKEN_KEY = 'auth_token';

// 인증 컨텍스트 타입
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: InsertUser) => Promise<void>;
  getAuthHeader: () => { Authorization?: string };
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // JWT 토큰 관리 함수들
  const getToken = () => localStorage.getItem(TOKEN_KEY);
  const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
  const removeToken = () => localStorage.removeItem(TOKEN_KEY);
  
  // 인증 헤더 생성 함수
  const getAuthHeader = () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // 로컬 스토리지에서 사용자 정보 로드
  useEffect(() => {
    const loadUser = async () => {
      try {
        setIsLoading(true);
        const token = getToken();
        
        console.log("앱 시작 시 토큰 상태:", token ? "토큰 있음" : "토큰 없음");
        
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
              removeToken();
              if (window.location.pathname !== '/auth') {
                console.log("유효하지 않은 토큰 - 로그인 페이지로 리디렉션");
                setLocation('/auth');
              }
            }
          } catch (error) {
            console.error("사용자 정보 로드 오류:", error);
            removeToken();
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
      
      // JWT 토큰 저장
      if (!userData.token) {
        throw new Error('서버에서 인증 토큰을 받지 못했습니다');
      }
      
      setToken(userData.token);
      
      // 사용자 정보 설정 (토큰 제외)
      const { token, ...userInfo } = userData;
      setUser(userInfo);
      
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
      
      // JWT는 stateless이므로 실제로는 서버에 요청할 필요가 없지만,
      // 로깅이나 추가적인 서버 측 처리를 위해 호출
      await apiRequest('POST', '/api/logout', {}, { headers: getAuthHeader() });
      
      // 로컬 스토리지에서 토큰 삭제
      removeToken();
      setUser(null);
      
      toast({
        title: "로그아웃 되었습니다",
      });
      
      // 로그인 페이지로 이동
      setLocation("/auth");
    } catch (error) {
      console.error("로그아웃 오류:", error);
      
      // 로그아웃은 클라이언트 측에서 토큰을 삭제하면 되므로,
      // 서버 오류가 있더라도 로컬에서 로그아웃 처리
      removeToken();
      setUser(null);
      setLocation("/auth");
      
      toast({
        title: "로그아웃 처리 중 문제가 발생했지만, 로그아웃되었습니다",
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
      
      // JWT 토큰 저장
      if (!newUser.token) {
        throw new Error('서버에서 인증 토큰을 받지 못했습니다');
      }
      
      setToken(newUser.token);
      
      // 사용자 정보 설정 (토큰 제외)
      const { token, ...userInfo } = newUser;
      setUser(userInfo);
      
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
        register,
        getAuthHeader
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