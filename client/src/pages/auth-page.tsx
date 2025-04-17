import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
// useI18n 제거
import { insertUserSchema, UserRole } from "@shared/schema";

const loginSchema = insertUserSchema.pick({
  username: true,
  password: true,
}).extend({
  usernameOrEmail: z.string().optional(),
});

const registerSchema = insertUserSchema.pick({
  username: true,
  email: true,
  name: true,
  role: true,
}).extend({
  password: z.string()
    .min(8, "비밀번호는 최소 8자 이상이어야 합니다")
    .max(16, "비밀번호는 최대 16자까지 가능합니다")
    .regex(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,16}$/, 
      "비밀번호는 영문, 숫자, 특수문자를 모두 포함해야 합니다"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"],
});

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");
  const [usernameExists, setUsernameExists] = useState<boolean>(false);
  const [emailExists, setEmailExists] = useState<boolean>(false);
  
  // 임시 번역 함수
  const t = (text: string) => text;
  
  // 디버깅: 로그인 상태 확인
  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log("AuthPage - 토큰 상태:", token ? "토큰 있음" : "토큰 없음");
  }, []);

  // 이미 로그인한 경우 메인 페이지로 리다이렉트
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      role: UserRole.PATIENT,
    },
  });

  async function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    try {
      console.log("로그인 시도 (loginMutation 사용):", values.username);
      
      // 직접 fetch 대신 useAuth의 loginMutation 사용
      loginMutation.mutate(values);
    } catch (error) {
      console.error("로그인 오류:", error);
      alert(error instanceof Error ? error.message : '로그인에 실패했습니다');
    }
  }

  async function checkExistingUsername(username: string) {
    try {
      // 실제 API 호출 대신 로컬 스토리지에서 확인 (모의 구현)
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
        const existingUser = JSON.parse(storedUserData);
        const exists = existingUser.username === username;
        setUsernameExists(exists);
        return exists;
      }
      return false;
    } catch (error) {
      console.error("아이디 확인 중 오류:", error);
      return false;
    }
  }
  
  async function checkExistingEmail(email: string) {
    try {
      // 실제 API 호출 대신 로컬 스토리지에서 확인 (모의 구현)
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
        const existingUser = JSON.parse(storedUserData);
        const exists = existingUser.email === email;
        setEmailExists(exists);
        return exists;
      }
      return false;
    } catch (error) {
      console.error("이메일 확인 중 오류:", error);
      return false;
    }
  }
  
  async function onRegisterSubmit(values: z.infer<typeof registerSchema>) {
    // 사용자명 중복 확인
    const usernameExists = await checkExistingUsername(values.username);
    if (usernameExists) {
      return;
    }
    
    // 이메일 중복 확인
    const emailExists = await checkExistingEmail(values.email);
    if (emailExists) {
      return;
    }
    
    const { confirmPassword, ...registerData } = values;
    registerMutation.mutate(registerData, {
      onSuccess: () => {
        // 회원가입 성공 시 로그인 탭으로 전환
        setActiveTab("login");
        // 사용자명 정보를 로그인 폼에 자동으로 채우기
        loginForm.setValue("username", values.username);
      }
    });
  }

  return (
    <div className="flex min-h-screen">
      {/* 왼쪽 폼 영역 */}
      <div className="flex-1 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">{t("병원 안전 관리 시스템")}</h1>
            <p className="text-gray-500 mt-2">{t("로그인 또는 계정을 생성하세요")}</p>
          </div>

          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">{t("로그인")}</TabsTrigger>
              <TabsTrigger value="register">{t("회원가입")}</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("아이디")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("아이디를 입력하세요")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("비밀번호")}</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder={t("비밀번호를 입력하세요")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full mt-6" 
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t("로그인 중...")}
                      </span>
                    ) : (
                      t("로그인")
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="register">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("아이디")}</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input 
                              placeholder={t("아이디를 입력하세요")} 
                              {...field} 
                              onBlur={(e) => {
                                field.onBlur();
                              }}
                            />
                            <Button 
                              type="button" 
                              variant="outline" 
                              className="whitespace-nowrap"
                              onClick={() => {
                                if (field.value) checkExistingUsername(field.value);
                              }}
                            >
                              중복확인
                            </Button>
                          </div>
                        </FormControl>
                        {usernameExists && (
                          <p className="text-sm font-medium text-destructive">이미 사용 중인 아이디입니다</p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("이메일")}</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input 
                              placeholder={t("이메일을 입력하세요")} 
                              type="email" 
                              {...field} 
                              onBlur={(e) => {
                                field.onBlur();
                              }}
                            />
                            <Button 
                              type="button" 
                              variant="outline" 
                              className="whitespace-nowrap"
                              onClick={() => {
                                if (field.value) checkExistingEmail(field.value);
                              }}
                            >
                              중복확인
                            </Button>
                          </div>
                        </FormControl>
                        {emailExists && (
                          <p className="text-sm font-medium text-destructive">이미 사용 중인 이메일입니다</p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("이름")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("이름을 입력하세요")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("비밀번호")}</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder={t("비밀번호를 입력하세요")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("비밀번호 확인")}</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder={t("비밀번호를 다시 입력하세요")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("계정 유형")}</FormLabel>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          <option value={UserRole.PATIENT}>{t("환자")}</option>
                          <option value={UserRole.GUARDIAN}>{t("보호자")}</option>
                        </select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full mt-6" 
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t("가입 중...")}
                      </span>
                    ) : (
                      t("회원가입")
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* 오른쪽 설명 영역 */}
      <div className="hidden lg:flex flex-1 bg-primary text-white p-12 flex-col justify-center">
        <div className="max-w-md mx-auto">
          <h2 className="text-4xl font-bold mb-6">{t("환자 안전을 위한 지능형 모니터링 시스템")}</h2>
          <p className="text-lg mb-8">
            {t("인공지능 기반 낙상 감지, 실시간 환자 모니터링, 그리고 24시간 안전 관리 시스템으로 의료진과 보호자에게 신속한 알림을 제공합니다.")}
          </p>
          <div className="space-y-4">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p>{t("AI 기반 낙상 감지 시스템")}</p>
            </div>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p>{t("실시간 환경 모니터링")}</p>
            </div>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p>{t("의료진과 보호자를 위한 즉각적인 알림")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}