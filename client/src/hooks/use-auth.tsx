import { createContext, useState, ReactNode, useContext, useEffect } from "react";
import { InsertUser, User, UserRole } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// 단순화된 인증 컨텍스트 타입
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
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
    // 로컬 스토리지에서 사용자 정보 가져오기
    const loadUser = () => {
      try {
        const userData = localStorage.getItem('userData');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          
          // 인증 페이지에 있다면 홈으로 리디렉트
          if (window.location.pathname === '/auth') {
            setLocation('/');
          }
        } else {
          // 로그인 페이지가 아니면서 사용자 데이터가 없는 경우 로그인 페이지로 리디렉션
          if (window.location.pathname !== '/auth') {
            setLocation('/auth');
          }
        }
      } catch (error) {
        console.error("사용자 정보 로드 오류:", error);
        localStorage.removeItem('userData');
        if (window.location.pathname !== '/auth') {
          setLocation('/auth');
        }
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
      
      // 하드코딩된 테스트 계정 확인
      if (username === "director2" && password === "password123") {
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
        
        // 로컬 스토리지에 사용자 정보 저장
        localStorage.setItem('userData', JSON.stringify(mockUser));
        setUser(mockUser);
        
        // 성공 메시지 표시
        toast({
          title: "로그인 성공",
          description: `${mockUser.name}님 환영합니다!`,
        });
        
        // 홈 페이지로 이동
        setLocation("/");
      } else {
        throw new Error("아이디 또는 비밀번호가 올바르지 않습니다");
      }
    } catch (error) {
      console.error("로그인 오류:", error);
      setError(error instanceof Error ? error : new Error("로그인에 실패했습니다"));
      
      toast({
        title: "로그인 실패",
        description: error instanceof Error ? error.message : "로그인에 실패했습니다",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 로그아웃 함수
  const logout = () => {
    try {
      // 로컬 스토리지에서 사용자 정보 삭제
      localStorage.removeItem('userData');
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
    }
  };

  // 회원가입 함수
  const register = async (userData: InsertUser) => {
    try {
      setIsLoading(true);
      
      // 아이디 중복 확인
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
        const existingUser = JSON.parse(storedUserData);
        if (existingUser.username === userData.username) {
          throw new Error("이미 사용 중인 아이디입니다");
        }
        if (existingUser.email === userData.email) {
          throw new Error("이미 사용 중인 이메일입니다");
        }
      }
      
      // 새 사용자 생성
      const newUser: User = {
        id: Date.now(), // 임시 ID 생성
        username: userData.username,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        password: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        preferredLanguage: "ko"
      };
      
      // 로컬 스토리지에 사용자 정보 저장
      localStorage.setItem('userData', JSON.stringify(newUser));
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