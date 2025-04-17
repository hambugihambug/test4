import { createContext, useState, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { InsertUser, User, UserRole } from "@shared/schema";
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
          
          // 토큰이 있으면 로그인 상태로 간주
          // 실제 구현에서는 여기서 API 호출로 토큰 유효성 검사
          const storedUserData = localStorage.getItem('userData');
          if (storedUserData) {
            try {
              const userData = JSON.parse(storedUserData);
              console.log("저장된 사용자 데이터 로드됨:", userData.username, userData.role);
              queryClient.setQueryData(["/api/user"], userData);
              
              // 인증 페이지에 있다면 홈으로 리디렉트
              if (window.location.pathname === '/auth') {
                setLocation('/');
              }
            } catch (e) {
              console.error("저장된 사용자 데이터 파싱 오류:", e);
              localStorage.removeItem('token');
              localStorage.removeItem('userData');
              if (window.location.pathname !== '/auth') {
                setLocation('/auth');
              }
            }
          } else {
            // 토큰은 있지만 사용자 데이터가 없는 경우
            localStorage.removeItem('token');
            if (window.location.pathname !== '/auth') {
              setLocation('/auth');
            }
          }
        } else {
          console.log("저장된 토큰 없음");
          
          // 로그인 페이지가 아니면서 토큰이 없는 경우 로그인 페이지로 리디렉션
          if (window.location.pathname !== '/auth') {
            console.log("토큰 없음으로 인한 리디렉션");
            setLocation('/auth');
          }
        }
        setInitialChecked(true);
      } catch (error) {
        console.error("세션 확인 중 오류 발생:", error);
        // 오류 발생 시 토큰 삭제
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        setInitialChecked(true);
        setLocation('/auth');
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
    queryFn: async ({ queryKey }) => {
      try {
        // 로컬 스토리지에서 사용자 정보 가져오기
        const token = localStorage.getItem('token');
        if (!token) {
          console.log("토큰 없음, null 반환");
          return null;
        }
        
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
          const userData = JSON.parse(storedUserData);
          console.log("사용자 정보 로드 성공:", userData.username, userData.role);
          return userData;
        }
        
        return null;
      } catch (error) {
        console.error("사용자 정보 로드 오류:", error);
        return null;
      }
    },
    enabled: initialChecked,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      // 실제 구현에서는 서버에 인증 요청을 보내고 토큰을 받아옴
      // 현재는 클라이언트 측에서 하드코딩된 사용자 계정으로 테스트
      
      console.log("로그인 시도:", credentials.username);
      
      // 테스트용 하드코딩된 사용자 (실제 구현에서는 제거)
      if (credentials.username === "director2" && credentials.password === "password123") {
        // 병원장 계정
        const mockUser: User = {
          id: 1,
          username: "director2",
          email: "director@hospital.com",
          name: "김원장",
          role: UserRole.DIRECTOR,
          password: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          preferredLanguage: "ko"
        };
        
        // 토큰 생성 (실제로는 서버에서 수행)
        const mockToken = "mock_token_" + Math.random().toString(36).substring(2, 15);
        
        // 사용자 데이터와 토큰 저장
        localStorage.setItem('token', mockToken);
        localStorage.setItem('userData', JSON.stringify(mockUser));
        
        return mockUser;
      }
      
      // 나머지 계정은 인증 실패
      throw new Error("아이디 또는 비밀번호가 올바르지 않습니다");
    },
    onSuccess: (user: User) => {
      console.log("로그인 성공, 사용자 정보:", user.username);
      
      // 명시적으로 쿼리 캐시 업데이트
      queryClient.setQueryData(["/api/user"], user);
      
      toast({
        title: "로그인 성공",
        description: `${user.name}님 환영합니다!`,
      });
      
      console.log("로그인 성공 후 사용자 역할:", user.role);
      
      // 지연을 주어 상태 업데이트가 완료된 후 페이지 이동
      setTimeout(() => {
        console.log("메인 페이지로 이동합니다");
        setLocation("/");
      }, 1000);
    },
    onError: (error: Error) => {
      let errorMessage = "로그인에 실패했습니다";
      
      if (error.message.includes("아이디 또는 비밀번호")) {
        errorMessage = error.message;
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
      // 실제 구현에서는 서버에 회원가입 요청을 보냄
      // 현재는 클라이언트 측에서 하드코딩된 응답으로 테스트
      
      console.log("회원가입 시도:", credentials.username);
      
      // 중복 검사 (실제로는 서버에서 수행)
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
        const existingUser = JSON.parse(storedUserData);
        if (existingUser.username === credentials.username) {
          throw new Error("이미 사용 중인 아이디입니다");
        }
        if (existingUser.email === credentials.email) {
          throw new Error("이미 사용 중인 이메일입니다");
        }
      }
      
      // 새 사용자 생성
      const newUser: User = {
        id: Date.now(), // 임시 ID 생성
        username: credentials.username,
        email: credentials.email,
        name: credentials.name,
        role: credentials.role,
        password: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        preferredLanguage: "ko"
      };
      
      // 토큰 생성 (실제로는 서버에서 수행)
      const mockToken = "mock_token_" + Math.random().toString(36).substring(2, 15);
      
      // 사용자 데이터와 토큰 저장
      localStorage.setItem('token', mockToken);
      localStorage.setItem('userData', JSON.stringify(newUser));
      
      return newUser;
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
      // 토큰과 사용자 데이터 삭제
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
    },
    onSuccess: () => {
      // 인증 상태를 즉시 null로 설정
      queryClient.setQueryData(["/api/user"], null);
      
      toast({
        title: "로그아웃 되었습니다",
      });
      
      // 강제로 페이지 새로고침하여 모든 상태 초기화
      console.log("로그아웃 성공, 상태 초기화 후 로그인 페이지로 이동");
      setTimeout(() => {
        setLocation("/auth");
      }, 500);
    },
    onError: (error: Error) => {
      // 오류가 발생해도 로컬 토큰은 이미 제거됨
      console.error("로그아웃 처리 중 오류:", error);
      
      toast({
        title: "로그아웃 처리 중 문제가 발생했습니다",
        description: "하지만 로그아웃은 완료되었습니다. 페이지를 새로고침해주세요.",
        variant: "destructive",
      });
      
      // 오류가 발생해도 인증 상태를 초기화하고 로그인 페이지로 리디렉션
      queryClient.setQueryData(["/api/user"], null);
      setTimeout(() => {
        setLocation("/auth");
      }, 1000);
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