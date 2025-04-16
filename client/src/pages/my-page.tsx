import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { UserRole } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

// 프로필 업데이트 스키마
const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "이름은 2글자 이상이어야 합니다.",
  }),
  email: z.string().email({
    message: "올바른 이메일 주소를 입력해주세요.",
  }),
  phoneNumber: z.string().optional(),
  preferredLanguage: z.string().optional(),
});

// 비밀번호 변경 스키마
const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, {
    message: "현재 비밀번호는 6글자 이상이어야 합니다.",
  }),
  newPassword: z.string().min(6, {
    message: "새 비밀번호는 6글자 이상이어야 합니다.",
  }),
  confirmPassword: z.string().min(6, {
    message: "비밀번호 확인은 6글자 이상이어야 합니다.",
  }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "새 비밀번호와 비밀번호 확인이 일치하지 않습니다.",
  path: ["confirmPassword"],
});

export default function MyPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");

  // 프로필 폼
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phoneNumber: user?.phoneNumber || "",
      preferredLanguage: user?.preferredLanguage || "ko",
    },
  });

  // 비밀번호 폼
  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // 프로필 업데이트 mutation
  const profileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileFormSchema>) => {
      const res = await apiRequest("PATCH", "/api/user", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "프로필 업데이트 성공",
        description: "프로필 정보가 성공적으로 업데이트되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "프로필 업데이트 실패",
        description: error.message || "프로필 업데이트 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  // 비밀번호 변경 mutation
  const passwordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof passwordFormSchema>) => {
      const res = await apiRequest("POST", "/api/user/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "비밀번호 변경 성공",
        description: "비밀번호가 성공적으로 변경되었습니다.",
      });
      passwordForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "비밀번호 변경 실패",
        description: error.message || "비밀번호 변경 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  // 프로필 폼 제출 함수
  function onProfileSubmit(data: z.infer<typeof profileFormSchema>) {
    profileMutation.mutate(data);
  }

  // 비밀번호 폼 제출 함수
  function onPasswordSubmit(data: z.infer<typeof passwordFormSchema>) {
    passwordMutation.mutate(data);
  }

  if (!user) {
    return <div className="p-8">로딩 중...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">마이페이지</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">사용자 정보</CardTitle>
              <CardDescription>기본 계정 정보</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-500">사용자 이름</p>
                <p className="font-medium">{user.username}</p>
              </div>
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-500">역할</p>
                <p className="font-medium">
                  {user.role === UserRole.DIRECTOR ? "병원장" : 
                   user.role === UserRole.NURSE ? "간호사" : 
                   user.role === UserRole.PATIENT ? "환자" : "보호자"}
                </p>
              </div>
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-500">이메일</p>
                <p className="font-medium">{user.email}</p>
              </div>
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-500">연락처</p>
                <p className="font-medium">
                  {user.phoneNumber || "등록된 연락처가 없습니다"}
                </p>
              </div>
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-500">가입일</p>
                <p className="font-medium">
                  {new Date(user.createdAt || "").toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">프로필 설정</TabsTrigger>
              <TabsTrigger value="password">비밀번호 변경</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>프로필 설정</CardTitle>
                  <CardDescription>
                    프로필 정보를 업데이트할 수 있습니다.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                      <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>이름</FormLabel>
                            <FormControl>
                              <Input placeholder="이름" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>이메일</FormLabel>
                            <FormControl>
                              <Input placeholder="이메일" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>연락처</FormLabel>
                            <FormControl>
                              <Input placeholder="연락처 (예: 010-1234-5678)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="preferredLanguage"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel>선호 언어</FormLabel>
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="lang-ko"
                                  value="ko"
                                  checked={field.value === "ko"}
                                  onChange={() => field.onChange("ko")}
                                  className="h-4 w-4"
                                />
                                <Label htmlFor="lang-ko">한국어</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="lang-en"
                                  value="en"
                                  checked={field.value === "en"}
                                  onChange={() => field.onChange("en")}
                                  className="h-4 w-4"
                                />
                                <Label htmlFor="lang-en">영어</Label>
                              </div>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" disabled={profileMutation.isPending}>
                        {profileMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        저장
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="password">
              <Card>
                <CardHeader>
                  <CardTitle>비밀번호 변경</CardTitle>
                  <CardDescription>
                    계정 비밀번호를 변경할 수 있습니다.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>현재 비밀번호</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="현재 비밀번호" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>새 비밀번호</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="새 비밀번호" {...field} />
                            </FormControl>
                            <FormDescription>
                              최소 6자 이상의 비밀번호를 사용하세요.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>비밀번호 확인</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="비밀번호 확인" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" disabled={passwordMutation.isPending}>
                        {passwordMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        비밀번호 변경
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}