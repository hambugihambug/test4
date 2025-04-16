import { useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@shared/schema";

// 일정 형식
type Schedule = {
  id: string;
  title: string;
  description: string;
  date: Date;
  startTime: string;
  endTime: string;
  participants: string[];
  category: "회의" | "검진" | "치료" | "약물투여" | "기타";
  createdBy: {
    id: number;
    name: string;
  };
};

// 일정 등록 폼 유효성 검사 스키마
const scheduleFormSchema = z.object({
  title: z.string().min(1, { message: "제목을 입력해주세요" }),
  description: z.string().optional(),
  date: z.date({ required_error: "날짜를 선택해주세요" }),
  startTime: z.string().min(1, { message: "시작 시간을 입력해주세요" }),
  endTime: z.string().min(1, { message: "종료 시간을 입력해주세요" }),
  participants: z.array(z.string()).optional(),
  category: z.enum(["회의", "검진", "치료", "약물투여", "기타"]),
});

// 기본 참가자 목록 (임시 데이터)
const availableParticipants = [
  { id: "1", name: "김간호사", role: "nurse" },
  { id: "2", name: "박의사", role: "doctor" },
  { id: "3", name: "이환자", role: "patient" },
  { id: "4", name: "정환자", role: "patient" },
  { id: "5", name: "최환자", role: "patient" },
];

// 임시 일정 데이터
const initialSchedules: Schedule[] = [
  {
    id: "1",
    title: "환자 회진",
    description: "304호 환자들의 일일 회진",
    date: new Date(2025, 3, 15, 9, 0),
    startTime: "09:00",
    endTime: "10:30",
    participants: ["1", "2", "3"],
    category: "검진",
    createdBy: { id: 1, name: "김간호사" }
  },
  {
    id: "2",
    title: "약물 투여",
    description: "정기 약물 투여",
    date: new Date(2025, 3, 16, 13, 0),
    startTime: "13:00",
    endTime: "14:00",
    participants: ["1", "4"],
    category: "약물투여",
    createdBy: { id: 1, name: "김간호사" }
  },
  {
    id: "3",
    title: "물리 치료",
    description: "재활 물리 치료",
    date: new Date(2025, 3, 16, 15, 0),
    startTime: "15:00",
    endTime: "16:00",
    participants: ["1", "5"],
    category: "치료",
    createdBy: { id: 1, name: "김간호사" }
  }
];

function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // 폼 초기화
  const form = useForm<z.infer<typeof scheduleFormSchema>>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      title: "",
      description: "",
      date: selectedDate,
      startTime: "",
      endTime: "",
      participants: [],
      category: "기타",
    },
  });

  // 선택된 날짜의 일정 필터링
  const filteredSchedules = schedules.filter(schedule => 
    selectedDate && 
    schedule.date.getDate() === selectedDate.getDate() &&
    schedule.date.getMonth() === selectedDate.getMonth() &&
    schedule.date.getFullYear() === selectedDate.getFullYear()
  );

  // 일정 있는 날짜 표시를 위한 함수
  function hasScheduleOnDate(date: Date): boolean {
    return schedules.some(schedule => 
      schedule.date.getDate() === date.getDate() &&
      schedule.date.getMonth() === date.getMonth() &&
      schedule.date.getFullYear() === date.getFullYear()
    );
  }

  // 월 이동 핸들러
  const handleMonthChange = (direction: 'prev' | 'next') => {
    if (!selectedDate) return;
    
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  };

  // 일정 추가 폼 제출 핸들러
  const onSubmit = (values: z.infer<typeof scheduleFormSchema>) => {
    const newSchedule: Schedule = {
      id: `${schedules.length + 1}`,
      title: values.title,
      description: values.description || "",
      date: values.date,
      startTime: values.startTime,
      endTime: values.endTime,
      participants: values.participants || [],
      category: values.category,
      createdBy: {
        id: user?.id || 0,
        name: user?.name || "사용자",
      }
    };
    
    setSchedules([...schedules, newSchedule]);
    setIsAddDialogOpen(false);
    form.reset();
    
    toast({
      title: "일정이 추가되었습니다",
      description: `${format(values.date, 'yyyy년 MM월 dd일')}에 ${values.title} 일정이 추가되었습니다.`,
    });
  };

  // 일정 상세 보기
  const viewScheduleDetails = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsDetailsDialogOpen(true);
  };

  // 일정 삭제
  const deleteSchedule = (id: string) => {
    const updatedSchedules = schedules.filter(schedule => schedule.id !== id);
    setSchedules(updatedSchedules);
    setIsDetailsDialogOpen(false);
    
    toast({
      title: "일정이 삭제되었습니다",
      description: "선택한 일정이 삭제되었습니다.",
    });
  };

  // 일정 카테고리별 색상
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "회의": return "bg-blue-500";
      case "검진": return "bg-green-500";
      case "치료": return "bg-purple-500";
      case "약물투여": return "bg-orange-500";
      default: return "bg-gray-500";
    }
  };

  // 참가자 표시
  const getParticipantNames = (participantIds: string[]) => {
    return participantIds.map(id => 
      availableParticipants.find(p => p.id === id)?.name || "알 수 없음"
    ).join(", ");
  };

  // 추가 버튼 액세스 권한 확인
  const canAddSchedule = user && (
    user.role === UserRole.DIRECTOR || 
    user.role === UserRole.NURSE
  );

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">일정 관리</h1>
        <p className="text-gray-600">환자 치료 및 병원 행사 일정을 관리합니다.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 캘린더 섹션 */}
        <div className="lg:col-span-1 bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">캘린더</h2>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => handleMonthChange('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => handleMonthChange('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            locale={ko}
            className="border rounded-md p-3"
          />
        </div>

        {/* 일정 목록 섹션 */}
        <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              {selectedDate 
                ? `${format(selectedDate, 'yyyy년 MM월 dd일')} 일정` 
                : "일정 목록"}
            </h2>
            
            {canAddSchedule && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    일정 추가
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[525px]">
                  <DialogHeader>
                    <DialogTitle>새 일정 추가</DialogTitle>
                    <DialogDescription>
                      아래 양식을 작성하여 새 일정을 등록하세요.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>제목</FormLabel>
                            <FormControl>
                              <Input placeholder="일정 제목" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>설명</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="일정에 대한 상세 설명" 
                                className="resize-none" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="date"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>날짜</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP", { locale: ko })
                                      ) : (
                                        <span>날짜 선택</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                      date < new Date(new Date().setHours(0, 0, 0, 0))
                                    }
                                    locale={ko}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>카테고리</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="카테고리 선택" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="회의">회의</SelectItem>
                                  <SelectItem value="검진">검진</SelectItem>
                                  <SelectItem value="치료">치료</SelectItem>
                                  <SelectItem value="약물투여">약물투여</SelectItem>
                                  <SelectItem value="기타">기타</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="startTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>시작 시간</FormLabel>
                              <FormControl>
                                <Input type="time" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="endTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>종료 시간</FormLabel>
                              <FormControl>
                                <Input type="time" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="participants"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>참가자</FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                const currentValues = field.value || [];
                                if (!currentValues.includes(value)) {
                                  field.onChange([...currentValues, value]);
                                }
                              }}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="참가자 추가" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availableParticipants.map(participant => (
                                  <SelectItem 
                                    key={participant.id} 
                                    value={participant.id}
                                  >
                                    {participant.name} ({participant.role === "nurse" ? "간호사" : participant.role === "doctor" ? "의사" : "환자"})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {(field.value || []).map(participantId => {
                                const participant = availableParticipants.find(p => p.id === participantId);
                                return (
                                  <Badge 
                                    key={participantId}
                                    variant="secondary"
                                    className="flex items-center"
                                  >
                                    {participant?.name || "알 수 없음"}
                                    <button
                                      type="button"
                                      className="ml-1 text-xs"
                                      onClick={() => {
                                        const newValue = (field.value || []).filter(
                                          id => id !== participantId
                                        );
                                        field.onChange(newValue);
                                      }}
                                    >
                                      ✕
                                    </button>
                                  </Badge>
                                );
                              })}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter>
                        <Button type="submit">일정 저장</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          {filteredSchedules.length > 0 ? (
            <div className="space-y-4">
              {filteredSchedules.map(schedule => (
                <div 
                  key={schedule.id} 
                  className="border rounded-md p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => viewScheduleDetails(schedule)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-lg">{schedule.title}</h3>
                    <Badge className={cn("text-white", getCategoryColor(schedule.category))}>
                      {schedule.category}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500 flex items-center mb-2">
                    <Clock className="h-4 w-4 mr-1" />
                    {schedule.startTime} - {schedule.endTime}
                  </div>
                  {schedule.participants.length > 0 && (
                    <div className="text-sm text-gray-500 flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {getParticipantNames(schedule.participants)}
                    </div>
                  )}
                  {schedule.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {schedule.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              {selectedDate 
                ? `${format(selectedDate, 'yyyy년 MM월 dd일')}에 예정된 일정이 없습니다.` 
                : "날짜를 선택하여 일정을 확인하세요."}
            </div>
          )}
        </div>
      </div>

      {/* 일정 상세 정보 다이얼로그 */}
      {selectedSchedule && (
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>{selectedSchedule.title}</DialogTitle>
                <Badge className={cn("text-white", getCategoryColor(selectedSchedule.category))}>
                  {selectedSchedule.category}
                </Badge>
              </div>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2 text-gray-500" />
                <span>{format(selectedSchedule.date, 'yyyy년 MM월 dd일', { locale: ko })}</span>
              </div>
              
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-gray-500" />
                <span>{selectedSchedule.startTime} - {selectedSchedule.endTime}</span>
              </div>
              
              {selectedSchedule.participants.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-1">참가자</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSchedule.participants.map(participantId => {
                      const participant = availableParticipants.find(p => p.id === participantId);
                      return (
                        <Badge key={participantId} variant="outline">
                          {participant?.name || "알 수 없음"}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {selectedSchedule.description && (
                <div>
                  <h4 className="text-sm font-medium mb-1">설명</h4>
                  <p className="text-gray-600 whitespace-pre-line">
                    {selectedSchedule.description}
                  </p>
                </div>
              )}
              
              <div className="text-sm text-gray-500">
                등록자: {selectedSchedule.createdBy.name}
              </div>
            </div>
            
            <DialogFooter>
              {canAddSchedule && (
                <Button 
                  variant="destructive"
                  onClick={() => deleteSchedule(selectedSchedule.id)}
                  className="mr-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  삭제
                </Button>
              )}
              <Button onClick={() => setIsDetailsDialogOpen(false)}>닫기</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default SchedulePage;