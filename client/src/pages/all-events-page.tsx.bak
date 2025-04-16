import { useState } from "react";
import { Calendar, Clock, Filter, Search, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@shared/schema";

// 이벤트 타입 정의
type EventType = "낙상" | "약물투여" | "환경알림" | "치료" | "검진" | "방문" | "기타";

// 이벤트 인터페이스
interface Event {
  id: string;
  title: string;
  type: EventType;
  date: Date;
  time: string;
  description: string;
  patient?: {
    id: string;
    name: string;
    roomNumber: string;
  };
  status: "완료" | "진행중" | "예정" | "취소";
  assignedTo?: string[];
}

// 임시 이벤트 데이터
const mockEvents: Event[] = [
  {
    id: "1",
    title: "낙상 감지 알림",
    type: "낙상",
    date: new Date(2025, 3, 10, 14, 30),
    time: "14:30",
    description: "304호 3번 침대 환자가 낙상 감지됨",
    patient: {
      id: "p1",
      name: "이환자",
      roomNumber: "304"
    },
    status: "완료",
    assignedTo: ["김간호사", "박의사"]
  },
  {
    id: "2",
    title: "약물 투여",
    type: "약물투여",
    date: new Date(2025, 3, 15, 9, 0),
    time: "09:00",
    description: "항생제 투여",
    patient: {
      id: "p2",
      name: "정환자",
      roomNumber: "302"
    },
    status: "예정",
    assignedTo: ["김간호사"]
  },
  {
    id: "3",
    title: "실내 온도 이상 알림",
    type: "환경알림",
    date: new Date(2025, 3, 12, 16, 45),
    time: "16:45",
    description: "305호 온도가 30도 이상으로 상승",
    status: "완료"
  },
  {
    id: "4",
    title: "정기 건강 검진",
    type: "검진",
    date: new Date(2025, 3, 18, 10, 30),
    time: "10:30",
    description: "월간 정기 건강 검진",
    patient: {
      id: "p3",
      name: "최환자",
      roomNumber: "301"
    },
    status: "예정",
    assignedTo: ["박의사"]
  },
  {
    id: "5",
    title: "물리 치료",
    type: "치료",
    date: new Date(2025, 3, 14, 13, 0),
    time: "13:00",
    description: "재활 물리 치료",
    patient: {
      id: "p1",
      name: "이환자",
      roomNumber: "304"
    },
    status: "완료",
    assignedTo: ["김물리치료사"]
  },
  {
    id: "6",
    title: "가족 방문",
    type: "방문",
    date: new Date(2025, 3, 16, 15, 0),
    time: "15:00",
    description: "가족 방문 일정",
    patient: {
      id: "p2",
      name: "정환자",
      roomNumber: "302"
    },
    status: "예정"
  },
  {
    id: "7",
    title: "환자 회진",
    type: "검진",
    date: new Date(2025, 3, 13, 11, 0),
    time: "11:00",
    description: "3층 병동 회진",
    status: "완료",
    assignedTo: ["박의사", "김간호사"]
  },
  {
    id: "8",
    title: "산소포화도 저하 알림",
    type: "기타",
    date: new Date(2025, 3, 11, 22, 15),
    time: "22:15",
    description: "303호 1번 침대 환자의 산소포화도가 90% 이하로 감소",
    patient: {
      id: "p4",
      name: "박환자",
      roomNumber: "303"
    },
    status: "완료",
    assignedTo: ["김간호사"]
  },
  {
    id: "9",
    title: "투약 거부",
    type: "약물투여",
    date: new Date(2025, 3, 14, 19, 30),
    time: "19:30",
    description: "환자가 약물 투여를 거부함",
    patient: {
      id: "p3",
      name: "최환자",
      roomNumber: "301"
    },
    status: "완료",
    assignedTo: ["김간호사"]
  },
  {
    id: "10",
    title: "낙상 위험 평가",
    type: "검진",
    date: new Date(2025, 3, 17, 10, 0),
    time: "10:00",
    description: "모든 환자 낙상 위험 정기 평가",
    status: "예정",
    assignedTo: ["김간호사", "박의사"]
  }
];

// 이벤트 타입별 색상 지정
const getEventTypeColor = (type: EventType) => {
  switch (type) {
    case "낙상": return "bg-red-500";
    case "약물투여": return "bg-blue-500";
    case "환경알림": return "bg-orange-500";
    case "치료": return "bg-green-500";
    case "검진": return "bg-purple-500";
    case "방문": return "bg-yellow-500";
    default: return "bg-gray-500";
  }
};

// 이벤트 상태별 색상 지정
const getEventStatusColor = (status: string) => {
  switch (status) {
    case "완료": return "bg-green-100 text-green-800";
    case "진행중": return "bg-blue-100 text-blue-800";
    case "예정": return "bg-purple-100 text-purple-800";
    case "취소": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

function EventsPage() {
  const [events] = useState<Event[]>(mockEvents);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const { user } = useAuth();

  // 이벤트 필터링
  const filteredEvents = events.filter(event => {
    // 검색어 필터링
    const matchesSearch = 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.patient?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.patient?.roomNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 이벤트 타입 필터링
    const matchesType = !filterType || event.type === filterType;
    
    // 상태 필터링
    const matchesStatus = !filterStatus || event.status === filterStatus;
    
    // 날짜 필터링
    const matchesDate = !filterDate || (
      event.date.getDate() === filterDate.getDate() &&
      event.date.getMonth() === filterDate.getMonth() &&
      event.date.getFullYear() === filterDate.getFullYear()
    );
    
    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  // 필터 초기화
  const resetFilters = () => {
    setSearchTerm("");
    setFilterType(null);
    setFilterStatus(null);
    setFilterDate(null);
  };

  // 사용자 권한에 따른 접근 제어
  const canViewAllEvents = user && (
    user.role === UserRole.DIRECTOR || 
    user.role === UserRole.NURSE
  );

  // 환자일 경우 해당 환자의 이벤트만 표시
  const patientFilteredEvents = user?.role === UserRole.PATIENT
    ? filteredEvents.filter(event => event.patient?.id === user.id.toString())
    : filteredEvents;

  // 보호자일 경우 담당 환자의 이벤트만 표시 (가정: 보호자는 환자 ID와 연결되어 있음)
  const guardianFilteredEvents = user?.role === UserRole.GUARDIAN
    ? filteredEvents.filter(event => event.patient?.id === user.patientId?.toString())
    : patientFilteredEvents;

  // 최종 표시될 이벤트 목록
  const displayEvents = canViewAllEvents
    ? filteredEvents
    : guardianFilteredEvents;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">모든 이벤트 보기</h1>
        <p className="text-gray-600">병원 내 발생한 모든 이벤트와 예정된 일정을 확인합니다.</p>
      </div>

      {/* 필터 및 검색 영역 */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="이벤트 검색..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <Select value={filterType || ""} onValueChange={(value) => setFilterType(value || null)}>
            <SelectTrigger>
              <SelectValue placeholder="이벤트 유형" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">모든 유형</SelectItem>
              <SelectItem value="낙상">낙상</SelectItem>
              <SelectItem value="약물투여">약물투여</SelectItem>
              <SelectItem value="환경알림">환경알림</SelectItem>
              <SelectItem value="치료">치료</SelectItem>
              <SelectItem value="검진">검진</SelectItem>
              <SelectItem value="방문">방문</SelectItem>
              <SelectItem value="기타">기타</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterStatus || ""} onValueChange={(value) => setFilterStatus(value || null)}>
            <SelectTrigger>
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">모든 상태</SelectItem>
              <SelectItem value="완료">완료</SelectItem>
              <SelectItem value="진행중">진행중</SelectItem>
              <SelectItem value="예정">예정</SelectItem>
              <SelectItem value="취소">취소</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="md:col-span-3">
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {filterDate ? format(filterDate, 'yyyy년 MM월 dd일', { locale: ko }) : "날짜 선택"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={filterDate || undefined}
                  onSelect={(date) => {
                    setFilterDate(date);
                    setIsCalendarOpen(false);
                  }}
                  locale={ko}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <Button variant="outline" onClick={resetFilters} className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            필터 초기화
          </Button>
        </div>
      </div>

      {/* 이벤트 목록 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">이벤트 목록</h2>
          <p className="text-sm text-gray-500">{displayEvents.length}개의 이벤트가 있습니다.</p>
        </div>

        {displayEvents.length > 0 ? (
          <div className="divide-y">
            {displayEvents.map((event) => (
              <div key={event.id} className="p-4 hover:bg-gray-50">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                  <h3 className="font-medium">{event.title}</h3>
                  <div className="flex items-center space-x-2 mt-2 md:mt-0">
                    <Badge className={cn("text-white", getEventTypeColor(event.type as EventType))}>
                      {event.type}
                    </Badge>
                    <Badge className={getEventStatusColor(event.status)}>
                      {event.status}
                    </Badge>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 mb-3">{event.description}</div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center text-gray-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{format(event.date, 'yyyy년 MM월 dd일', { locale: ko })}</span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{event.time}</span>
                  </div>
                </div>
                
                {event.patient && (
                  <div className="mt-3 text-sm">
                    <span className="text-gray-500">환자:</span> {event.patient.name} ({event.patient.roomNumber}호)
                  </div>
                )}
                
                {event.assignedTo && event.assignedTo.length > 0 && (
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <Users className="h-4 w-4 mr-2" />
                    <span>담당자: {event.assignedTo.join(', ')}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            {searchTerm || filterType || filterStatus || filterDate
              ? "검색 조건에 일치하는 이벤트가 없습니다."
              : "이벤트가 없습니다."}
          </div>
        )}
      </div>
    </div>
  );
}

export default EventsPage;