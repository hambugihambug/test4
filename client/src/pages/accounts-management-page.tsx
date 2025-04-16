import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useI18n } from "@/contexts/I18nContext";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, UserPlus, Trash2, Edit } from "lucide-react";

// 새 사용자 등록 폼 스키마
const userFormSchema = z.object({
  username: z.string().min(3, {
    message: "아이디는 3글자 이상이어야 합니다.",
  }),
  password: z.string().min(6, {
    message: "비밀번호는 6글자 이상이어야 합니다.",
  }),
  name: z.string().min(2, {
    message: "이름은 2글자 이상이어야 합니다.",
  }),
  email: z.string().email({
    message: "올바른 이메일 주소를 입력해주세요.",
  }),
  role: z.enum([UserRole.DIRECTOR, UserRole.NURSE, UserRole.PATIENT, UserRole.GUARDIAN]),
  preferredLanguage: z.string().optional(),
});

// 사용자 정보 업데이트 스키마 (비밀번호 필드 제외)
const userUpdateSchema = userFormSchema.omit({ password: true }).extend({
  password: z.string().min(6, {
    message: "비밀번호는 6글자 이상이어야 합니다.",
  }).optional(),
});

// 역할에 따른 한글 표시
function getRoleDisplay(role: UserRole) {
  switch (role) {
    case UserRole.DIRECTOR:
      return "병원장";
    case UserRole.NURSE:
      return "간호사";
    case UserRole.PATIENT:
      return "환자";
    case UserRole.GUARDIAN:
      return "보호자";
    default:
      return "알 수 없음";
  }
}

export default function AccountsManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [filter, setFilter] = useState<UserRole | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // 아이디/이메일 중복 체크 상태
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);

  // 사용자 목록 조회
  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/users");
      return await res.json();
    },
  });

  // 사용자 생성 폼
  const createForm = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      email: "",
      role: UserRole.NURSE,
      preferredLanguage: "ko",
    },
  });

  // 사용자 수정 폼
  const editForm = useForm<z.infer<typeof userUpdateSchema>>({
    resolver: zodResolver(userUpdateSchema),
    defaultValues: {
      username: "",
      name: "",
      email: "",
      role: UserRole.NURSE,
      preferredLanguage: "ko",
    },
  });

  // 사용자 생성 mutation
  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof userFormSchema>) => {
      const res = await apiRequest("POST", "/api/users/create", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "사용자 등록 성공",
        description: "새 사용자가 성공적으로 등록되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "사용자 등록 실패",
        description: error.message || "사용자 등록 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  // 사용자 수정 mutation
  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof userUpdateSchema> & { id: number }) => {
      const { id, ...updateData } = data;
      const res = await apiRequest("PUT", `/api/users/${id}`, updateData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "사용자 정보 수정 성공",
        description: "사용자 정보가 성공적으로 수정되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "사용자 정보 수정 실패",
        description: error.message || "사용자 정보 수정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  // 사용자 삭제 mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/users/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "사용자 삭제 성공",
        description: "사용자가 성공적으로 삭제되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "사용자 삭제 실패",
        description: error.message || "사용자 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  // 아이디 중복 체크 함수
  async function checkUsername(username: string) {
    if (!username || username.length < 3) return;
    
    setUsernameChecking(true);
    try {
      const res = await apiRequest("GET", `/api/users/check-username/${username}`);
      const data = await res.json();
      setUsernameAvailable(!data.exists);
    } catch (error) {
      console.error("아이디 중복 체크 오류:", error);
      toast({
        title: "아이디 중복 체크 실패",
        description: "서버 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setUsernameChecking(false);
    }
  }
  
  // 이메일 중복 체크 함수
  async function checkEmail(email: string) {
    if (!email || !email.includes('@')) return;
    
    setEmailChecking(true);
    try {
      const res = await apiRequest("GET", `/api/users/check-email/${email}`);
      const data = await res.json();
      setEmailAvailable(!data.exists);
    } catch (error) {
      console.error("이메일 중복 체크 오류:", error);
      toast({
        title: "이메일 중복 체크 실패",
        description: "서버 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setEmailChecking(false);
    }
  }
  
  // 폼 필드 값 변경 시 중복 체크 상태 초기화
  useEffect(() => {
    const usernameSubscription = createForm.watch((value, { name }) => {
      if (name === 'username') {
        setUsernameAvailable(null);
      }
      if (name === 'email') {
        setEmailAvailable(null);
      }
    });
    
    return () => usernameSubscription.unsubscribe();
  }, [createForm]);
  
  // 사용자 생성 폼 제출 함수
  function onCreateSubmit(data: z.infer<typeof userFormSchema>) {
    // 아이디와 이메일 중복 여부 확인
    if (usernameAvailable === false) {
      toast({
        title: "아이디 중복",
        description: "이미 사용 중인 아이디입니다. 다른 아이디를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    
    if (emailAvailable === false) {
      toast({
        title: "이메일 중복",
        description: "이미 사용 중인 이메일입니다. 다른 이메일을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    
    createMutation.mutate(data);
  }

  // 사용자 수정 폼 제출 함수
  function onEditSubmit(data: z.infer<typeof userUpdateSchema>) {
    if (!selectedUser) return;
    updateMutation.mutate({ ...data, id: selectedUser.id });
  }

  // 사용자 수정 모달 열기
  function handleEditUser(userData: any) {
    setSelectedUser(userData);
    editForm.reset({
      username: userData.username,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      preferredLanguage: userData.preferredLanguage || "ko",
    });
    setIsEditDialogOpen(true);
  }

  // 사용자 삭제 함수
  function handleDeleteUser(id: number) {
    deleteMutation.mutate(id);
  }

  // 필터링된 사용자 목록
  const filteredUsers = users?.filter((u: any) => {
    // 본인은 목록에서 제외 (삭제 방지)
    if (u.id === user?.id) return false;
    
    // 병원장(Director)은 모든 사용자 관리 가능
    if (user?.role === UserRole.DIRECTOR) {
      // 역할 필터
      if (filter !== "all" && u.role !== filter) return false;
      
      // 검색어 필터
      if (searchTerm && !u.name.includes(searchTerm) && !u.username.includes(searchTerm)) return false;
      
      return true;
    } 
    // 간호사(Nurse)는 환자와 보호자만 관리 가능
    else if (user?.role === UserRole.NURSE) {
      // 일단 병원장과 다른 간호사는 관리 불가능
      if (u.role === UserRole.DIRECTOR || u.role === UserRole.NURSE) return false;
      
      // 역할 필터
      if (filter !== "all" && u.role !== filter) return false;
      
      // 검색어 필터
      if (searchTerm && !u.name.includes(searchTerm) && !u.username.includes(searchTerm)) return false;
      
      return true;
    }
    
    // 기본적으로 필터링에서 제외
    return false;
  });

  if (!user || (user.role !== UserRole.DIRECTOR && user.role !== UserRole.NURSE)) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">권한 없음</h1>
        <p>이 페이지에 접근할 권한이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">회원 관리</h1>
        
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Input
              placeholder="이름 또는 아이디 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          
          <Select
            value={filter}
            onValueChange={(value: any) => setFilter(value)}
          >
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="역할 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 보기</SelectItem>
              {user.role === UserRole.DIRECTOR && (
                <>
                  <SelectItem value={UserRole.DIRECTOR}>병원장</SelectItem>
                  <SelectItem value={UserRole.NURSE}>간호사</SelectItem>
                </>
              )}
              <SelectItem value={UserRole.PATIENT}>환자</SelectItem>
              <SelectItem value={UserRole.GUARDIAN}>보호자</SelectItem>
            </SelectContent>
          </Select>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto">
                <UserPlus className="mr-2 h-4 w-4" />
                새 사용자 등록
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>새 사용자 등록</DialogTitle>
                <DialogDescription>
                  새로운 사용자 계정을 생성합니다. 모든 필드를 입력해주세요.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-6 py-4">
                  <FormField
                    control={createForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>아이디</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input placeholder="아이디" {...field} />
                          </FormControl>
                          <Button 
                            type="button" 
                            variant="outline"
                            size="sm"
                            disabled={!field.value || field.value.length < 3 || usernameChecking}
                            onClick={() => checkUsername(field.value)}
                          >
                            {usernameChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : "중복확인"}
                          </Button>
                        </div>
                        {usernameAvailable === true && (
                          <p className="text-sm text-green-600">사용 가능한 아이디입니다.</p>
                        )}
                        {usernameAvailable === false && (
                          <p className="text-sm text-red-600">이미 사용 중인 아이디입니다.</p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>비밀번호</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="비밀번호" {...field} />
                        </FormControl>
                        <FormDescription>
                          최소 6자 이상의 비밀번호를 사용하세요.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
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
                    control={createForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>이메일</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input placeholder="이메일" {...field} />
                          </FormControl>
                          <Button 
                            type="button" 
                            variant="outline"
                            size="sm"
                            disabled={!field.value || !field.value.includes('@') || emailChecking}
                            onClick={() => checkEmail(field.value)}
                          >
                            {emailChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : "중복확인"}
                          </Button>
                        </div>
                        {emailAvailable === true && (
                          <p className="text-sm text-green-600">사용 가능한 이메일입니다.</p>
                        )}
                        {emailAvailable === false && (
                          <p className="text-sm text-red-600">이미 사용 중인 이메일입니다.</p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>역할</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="역할 선택" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {user.role === UserRole.DIRECTOR && (
                              <>
                                <SelectItem value={UserRole.DIRECTOR}>병원장</SelectItem>
                                <SelectItem value={UserRole.NURSE}>간호사</SelectItem>
                              </>
                            )}
                            <SelectItem value={UserRole.PATIENT}>환자</SelectItem>
                            <SelectItem value={UserRole.GUARDIAN}>보호자</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="preferredLanguage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>선호 언어</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value || "ko"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="언어 선택" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ko">한국어</SelectItem>
                            <SelectItem value="en">영어</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createMutation.isPending}
                    >
                      {createMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      사용자 등록
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>아이디</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>역할</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.length > 0 ? (
                  filteredUsers.map((userData: any) => (
                    <TableRow key={userData.id}>
                      <TableCell className="font-medium">{userData.name}</TableCell>
                      <TableCell>{userData.username}</TableCell>
                      <TableCell>{userData.email}</TableCell>
                      <TableCell>{getRoleDisplay(userData.role)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUser(userData)}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">수정</span>
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">삭제</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>사용자 삭제</AlertDialogTitle>
                                <AlertDialogDescription>
                                  정말로 이 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>취소</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteUser(userData.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  삭제
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6">
                      {searchTerm ? "검색 결과가 없습니다." : "사용자가 없습니다."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* 사용자 수정 모달 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>사용자 정보 수정</DialogTitle>
            <DialogDescription>
              사용자 정보를 수정합니다. 비밀번호는 변경할 경우에만 입력하세요.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6 py-4">
              <FormField
                control={editForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>아이디</FormLabel>
                    <FormControl>
                      <Input placeholder="아이디" {...field} readOnly />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>비밀번호 (선택사항)</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="변경하려면 새 비밀번호 입력" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      변경하지 않을 경우 비워두세요.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
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
                control={editForm.control}
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
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>역할</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="역할 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {user?.role === UserRole.DIRECTOR && (
                          <>
                            <SelectItem value={UserRole.DIRECTOR}>병원장</SelectItem>
                            <SelectItem value={UserRole.NURSE}>간호사</SelectItem>
                          </>
                        )}
                        <SelectItem value={UserRole.PATIENT}>환자</SelectItem>
                        <SelectItem value={UserRole.GUARDIAN}>보호자</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="preferredLanguage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>선호 언어</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || "ko"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="언어 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ko">한국어</SelectItem>
                        <SelectItem value="en">영어</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  변경사항 저장
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}