import { createContext, useState, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { InsertUser, User } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, InsertUser>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [initialChecked, setInitialChecked] = useState(false);
  
  // 페이지 로드 시 필요한 로직
  useEffect(() => {
    const checkLoggedInStatus = async () => {
      try {
        // 로컬 스토리지에서 토큰 가져오기
        const token = localStorage.getItem('token');
        
        if (token) {
          console.log("토큰 발견:", token.substring(0, 20) + "...");
          const response = await fetch('/api/user', {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            credentials: 'include'
          });
          
          if (response.ok) {
            const userData = await response.json();
            console.log("사용자 데이터 로드됨:", userData.username);
            queryClient.setQueryData(["/api/user"], userData);
            
            // 인증 페이지에 있다면 홈으로 리디렉트
            if (window.location.pathname === '/auth') {
              setLocation('/');
            }
          } else {
            console.error("사용자 데이터 로드 실패:", response.status);
            // 토큰이 유효하지 않으면 삭제
            localStorage.removeItem('token');
          }
        } else {
          console.log("저장된 토큰 없음");
        }
        setInitialChecked(true);
      } catch (error) {
        console.error("세션 확인 중 오류 발생:", error);
        // 오류 발생 시 토큰 삭제
        localStorage.removeItem('token');
        setInitialChecked(true);
      }
    };
    
    checkLoggedInStatus();
  }, [setLocation]);
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: initialChecked,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      const userData = await res.json();
      
      // 서버에서 받은 토큰을 로컬 스토리지에 저장
      if (userData.token) {
        localStorage.setItem('token', userData.token);
        // 응답에서 token 필드 제거 (사용자 객체에 불필요한 정보)
        const { token, ...userWithoutToken } = userData;
        return userWithoutToken;
      }
      
      return userData;
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "로그인 성공",
        description: `${user.name}님 환영합니다!`,
      });
      // 로그인 성공 시 메인 페이지로 이동 (직접 URL 변경)
      window.location.href = "/";
    },
    onError: (error: Error) => {
      let errorMessage = "로그인에 실패했습니다";
      
      if (error.message.includes("Unauthorized") || error.message.includes("401")) {
        errorMessage = "아이디 또는 비밀번호가 올바르지 않습니다";
      }
      
      toast({
        title: "로그인 실패",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      const userData = await res.json();
      
      // 서버에서 받은 토큰을 로컬 스토리지에 저장
      if (userData.token) {
        localStorage.setItem('token', userData.token);
        // 응답에서 token 필드 제거
        const { token, ...userWithoutToken } = userData;
        return userWithoutToken;
      }
      
      return userData;
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "회원가입 성공",
        description: "계정이 성공적으로 생성되었습니다.",
      });
      // 회원가입 성공 시 메인 페이지로 이동
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "회원가입 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
      // 로그아웃 시 토큰 삭제
      localStorage.removeItem('token');
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "로그아웃 되었습니다",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "로그아웃 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
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