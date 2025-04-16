import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Search, 
  Filter, 
  AlertCircle, 
  Pill, 
  Thermometer, 
  Stethoscope, 
  Calendar,
  PlusCircle,
  Edit,
  Trash2,
  User
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

// 이벤트 데이터 타입
type EventType = '낙상' | '약물투여' | '환경알림' | '치료' | '검진';
type EventStatus = '완료' | '진행중' | '예정' | '취소';

interface Event {
  id: string;
  title: string;
  type: EventType;
  datetime: string;
  status: EventStatus;
  roomNumber: string;
  patientName?: string;
  description?: string;
  createdBy?: string; // 작성자 정보 추가
  createdAt?: string; // 생성 날짜/시간
}

// 이벤트 데이터
let events: Event[] = [
  {
    id: '1',
    title: '낙상 감지 알림',
    type: '낙상',
    datetime: '2025-04-10 14:30',
    status: '완료',
    roomNumber: '304',
    patientName: '김환자',
    description: '침대에서 내려오다 미끄러짐',
    createdBy: '김간호사',
    createdAt: '2025-04-10 14:35'
  },
  {
    id: '2',
    title: '약물 투여',
    type: '약물투여',
    datetime: '2025-04-15 09:00',
    status: '예정',
    roomNumber: '302',
    patientName: '이환자',
    description: '혈압약 투여',
    createdBy: '이간호사',
    createdAt: '2025-04-14 09:15'
  },
  {
    id: '3',
    title: '실내 온도 이상 알림',
    type: '환경알림',
    datetime: '2025-04-12 16:45',
    status: '완료',
    roomNumber: '305',
    description: '실내 온도 과열 (30°C 초과)',
    createdBy: '시스템',
    createdAt: '2025-04-12 16:46'
  },
  {
    id: '4',
    title: '정기 건강 검진',
    type: '검진',
    datetime: '2025-04-18 10:30',
    status: '예정',
    roomNumber: '301',
    patientName: '박환자',
    createdBy: '박의사',
    createdAt: '2025-04-13 15:20'
  },
  {
    id: '5',
    title: '물리 치료',
    type: '치료',
    datetime: '2025-04-14 13:00',
    status: '완료',
    roomNumber: '304',
    patientName: '김환자',
    description: '어깨 물리치료',
    createdBy: '최물리치료사',
    createdAt: '2025-04-12 09:45'
  }
];

// 이벤트 타입별 아이콘 및 색상
const getEventTypeIcon = (type: EventType) => {
  switch (type) {
    case '낙상': return { icon: <AlertCircle className="h-4 w-4" />, color: 'bg-red-100 text-red-800 border-red-200' };
    case '약물투여': return { icon: <Pill className="h-4 w-4" />, color: 'bg-blue-100 text-blue-800 border-blue-200' };
    case '환경알림': return { icon: <Thermometer className="h-4 w-4" />, color: 'bg-orange-100 text-orange-800 border-orange-200' };
    case '치료': return { icon: <Stethoscope className="h-4 w-4" />, color: 'bg-green-100 text-green-800 border-green-200' };
    case '검진': return { icon: <Stethoscope className="h-4 w-4" />, color: 'bg-purple-100 text-purple-800 border-purple-200' };
    default: return { icon: <AlertCircle className="h-4 w-4" />, color: 'bg-gray-100 text-gray-800 border-gray-200' };
  }
};

// 이벤트 상태별 색상
const getStatusColor = (status: EventStatus) => {
  switch (status) {
    case '완료': return 'bg-green-100 text-green-800';
    case '진행중': return 'bg-blue-100 text-blue-800';
    case '예정': return 'bg-purple-100 text-purple-800';
    case '취소': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// 이벤트 페이지 컴포넌트
const EventsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [activeTab, setActiveTab] = useState("recent");
  
  // 이벤트 추가/수정 다이얼로그 상태
  const [showAddEventDialog, setShowAddEventDialog] = useState(false);
  const [showEditEventDialog, setShowEditEventDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  // 권한 확인 (관리자, 간호사, 의사만 수정 가능)
  const canEdit = user?.role === 'director' || user?.role === 'nurse';
  
  // 이벤트 추가 처리
  const handleAddEvent = (newEventData: Omit<Event, 'id'>) => {
    // 실제 구현에서는 API 호출로 서버에 데이터 저장
    // 현재는 임시 로컬 데이터로 구현
    
    // 새 ID 생성 (실제로는 서버에서 할당)
    const newId = (parseInt(events[events.length - 1].id) + 1).toString();
    
    // 이벤트 추가
    const newEvent = {
      id: newId,
      ...newEventData
    };
    
    events = [newEvent, ...events];
    
    // 다이얼로그 닫기
    setShowAddEventDialog(false);
    
    // 성공 메시지
    toast({
      title: "이벤트 추가 완료",
      description: "새 이벤트가 성공적으로 추가되었습니다.",
    });
  };
  
  // 이벤트 수정 처리
  const handleEditEvent = (updatedEvent: Event) => {
    // 실제 구현에서는 API 호출로 서버에 데이터 업데이트
    // 현재는 임시 로컬 데이터로 구현
    
    // 이벤트 업데이트
    const eventIndex = events.findIndex(e => e.id === updatedEvent.id);
    if (eventIndex !== -1) {
      events[eventIndex] = updatedEvent;
    }
    
    // 다이얼로그 닫기
    setShowEditEventDialog(false);
    
    // 성공 메시지
    toast({
      title: "이벤트 수정 완료",
      description: "이벤트가 성공적으로 수정되었습니다.",
    });
  };
  
  // 이벤트 삭제 처리
  const handleDeleteEvent = () => {
    if (!selectedEvent) return;
    
    // 실제 구현에서는 API 호출로 서버에서 데이터 삭제
    // 현재는 임시 로컬 데이터로 구현
    
    // 이벤트 삭제
    const eventIndex = events.findIndex(e => e.id === selectedEvent.id);
    if (eventIndex !== -1) {
      events.splice(eventIndex, 1);
    }
    
    // 다이얼로그 닫기
    setShowDeleteDialog(false);
    
    // 성공 메시지
    toast({
      title: "이벤트 삭제 완료",
      description: "이벤트가 성공적으로 삭제되었습니다.",
    });
  };
  
  // 필터링된 이벤트 목록
  const filteredEvents = events.filter(event => {
    // 검색어 필터링
    const matchesSearch = searchTerm ? 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (event.patientName && event.patientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      event.roomNumber.includes(searchTerm) : true;
    
    // 유형 필터링
    const matchesType = selectedType && selectedType !== "all" ? event.type === selectedType : true;
    
    // 상태 필터링
    const matchesStatus = selectedStatus && selectedStatus !== "all" ? event.status === selectedStatus : true;
    
    // 날짜 필터링
    const matchesDate = selectedDate ? 
      event.datetime.includes(format(selectedDate, 'yyyy-MM-dd')) : true;
    
    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });
  
  // 최근 이벤트 (최대 5개)
  const recentEvents = [...events]
    .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())
    .slice(0, 5);
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">이벤트 관리</h1>
          <p className="text-gray-600 mt-1">병원 내 발생한 모든 이벤트와 예정된 일정을 확인합니다.</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button className="flex items-center gap-1">
            <Filter className="h-4 w-4" />
            내 담당 환자만
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle>이벤트 타임라인</CardTitle>
              {canEdit && (
                <Button 
                  size="sm" 
                  className="h-8 gap-1"
                  onClick={() => setShowAddEventDialog(true)}
                >
                  <PlusCircle className="h-4 w-4" />
                  이벤트 추가
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="mb-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">전체</TabsTrigger>
                  <TabsTrigger value="today">오늘</TabsTrigger>
                  <TabsTrigger value="upcoming">예정</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="space-y-4">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map(event => {
                    const { icon, color } = getEventTypeIcon(event.type as EventType);
                    return (
                      <div 
                        key={event.id} 
                        className="flex items-start p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                      >
                        <div className={`flex items-center justify-center h-10 w-10 rounded-full ${color.split(' ')[0]} mr-3 shrink-0`}>
                          {icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-sm font-medium truncate">{event.title}</h3>
                            <Badge variant="outline" className={getStatusColor(event.status as EventStatus)}>
                              {event.status}
                            </Badge>
                          </div>
                          <div className="flex items-center text-sm text-gray-500 mb-1">
                            <Clock className="h-3.5 w-3.5 mr-1" />
                            {event.datetime}
                            <span className="mx-2">•</span>
                            {event.roomNumber}호실
                            {event.patientName && (
                              <>
                                <span className="mx-2">•</span>
                                {event.patientName}
                              </>
                            )}
                          </div>
                          {event.description && (
                            <p className="text-xs text-gray-600 mt-1">{event.description}</p>
                          )}
                          {/* 작성자 정보 표시 */}
                          {event.createdBy && (
                            <div className="flex items-center text-xs text-gray-500 mt-2 pt-2 border-t">
                              <User className="h-3 w-3 mr-1" />
                              작성자: {event.createdBy}
                              {event.createdAt && (
                                <>
                                  <span className="mx-2">•</span>
                                  {event.createdAt}
                                </>
                              )}
                            </div>
                          )}
                          {/* 수정/삭제 버튼 */}
                          {canEdit && (
                            <div className="flex gap-2 mt-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 px-2"
                                onClick={() => {
                                  setSelectedEvent(event);
                                  setShowEditEventDialog(true);
                                }}
                              >
                                <Edit className="h-3.5 w-3.5 mr-1" /> 수정
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 px-2 text-red-500 hover:text-red-600"
                                onClick={() => {
                                  setSelectedEvent(event);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-1" /> 삭제
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    표시할 이벤트가 없습니다
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle>필터</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="이벤트 검색..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium block mb-2">이벤트 유형</label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="모든 유형" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">모든 유형</SelectItem>
                    <SelectItem value="낙상">낙상</SelectItem>
                    <SelectItem value="약물투여">약물투여</SelectItem>
                    <SelectItem value="환경알림">환경알림</SelectItem>
                    <SelectItem value="치료">치료</SelectItem>
                    <SelectItem value="검진">검진</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium block mb-2">상태</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="모든 상태" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">모든 상태</SelectItem>
                    <SelectItem value="완료">완료</SelectItem>
                    <SelectItem value="진행중">진행중</SelectItem>
                    <SelectItem value="예정">예정</SelectItem>
                    <SelectItem value="취소">취소</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium block mb-2">날짜</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? (
                        format(selectedDate, 'PPP', { locale: ko })
                      ) : (
                        <span>날짜 선택</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <Button 
                className="w-full" 
                onClick={() => {
                  setSelectedType(undefined);
                  setSelectedStatus(undefined);
                  setSelectedDate(undefined);
                  setSearchTerm("");
                }}
              >
                필터 초기화
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>이벤트 요약</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-center">
                  <p className="text-2xl font-bold text-red-600 mb-1">3</p>
                  <p className="text-sm">오늘 발생</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-center">
                  <p className="text-2xl font-bold text-blue-600 mb-1">12</p>
                  <p className="text-sm">이번 주</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-center">
                  <p className="text-2xl font-bold text-green-600 mb-1">5</p>
                  <p className="text-sm">완료됨</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-center">
                  <p className="text-2xl font-bold text-purple-600 mb-1">7</p>
                  <p className="text-sm">예정됨</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* 이벤트 추가 다이얼로그 */}
      <AddEventDialog 
        open={showAddEventDialog}
        onOpenChange={setShowAddEventDialog}
        onSave={handleAddEvent}
        user={user}
      />
      
      {/* 이벤트 수정 다이얼로그 */}
      <EditEventDialog 
        open={showEditEventDialog}
        onOpenChange={setShowEditEventDialog}
        onSave={handleEditEvent}
        event={selectedEvent}
      />
      
      {/* 이벤트 삭제 확인 다이얼로그 */}
      <DeleteEventDialog 
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteEvent}
        event={selectedEvent}
      />
    </div>
  );
};

// 이벤트 추가 다이얼로그
const AddEventDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (event: Omit<Event, 'id'>) => void;
  user: any;
}> = ({ open, onOpenChange, onSave, user }) => {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<EventType | "">("");
  const [datetime, setDatetime] = useState("");
  const [status, setStatus] = useState<EventStatus | "">("");
  const [roomNumber, setRoomNumber] = useState("");
  const [patientName, setPatientName] = useState("");
  const [description, setDescription] = useState("");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !type || !datetime || !status || !roomNumber) {
      return; // 필수 필드 검증
    }
    
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    onSave({
      title,
      type: type as EventType,
      datetime,
      status: status as EventStatus,
      roomNumber,
      patientName: patientName || undefined,
      description: description || undefined,
      createdBy: user?.username || '시스템',
      createdAt: formattedDate
    });
    
    // 폼 초기화
    setTitle("");
    setType("");
    setDatetime("");
    setStatus("");
    setRoomNumber("");
    setPatientName("");
    setDescription("");
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>새 이벤트 추가</DialogTitle>
          <DialogDescription>새로운 이벤트를 생성합니다.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div>
              <label htmlFor="title" className="text-sm font-medium block mb-1">제목</label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="이벤트 제목"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="type" className="text-sm font-medium block mb-1">유형</label>
                <Select value={type} onValueChange={(value) => setType(value as EventType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="유형 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="낙상">낙상</SelectItem>
                    <SelectItem value="약물투여">약물투여</SelectItem>
                    <SelectItem value="환경알림">환경알림</SelectItem>
                    <SelectItem value="치료">치료</SelectItem>
                    <SelectItem value="검진">검진</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label htmlFor="status" className="text-sm font-medium block mb-1">상태</label>
                <Select value={status} onValueChange={(value) => setStatus(value as EventStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="상태 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="완료">완료</SelectItem>
                    <SelectItem value="진행중">진행중</SelectItem>
                    <SelectItem value="예정">예정</SelectItem>
                    <SelectItem value="취소">취소</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <label htmlFor="datetime" className="text-sm font-medium block mb-1">날짜 및 시간</label>
              <Input
                id="datetime"
                type="datetime-local"
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="roomNumber" className="text-sm font-medium block mb-1">병실 번호</label>
                <Input
                  id="roomNumber"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="예: 301"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="patientName" className="text-sm font-medium block mb-1">환자 이름</label>
                <Input
                  id="patientName"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="(선택사항)"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="description" className="text-sm font-medium block mb-1">설명</label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="이벤트에 대한 상세 설명"
                className="resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
            <Button type="submit">저장</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// 이벤트 수정 다이얼로그
const EditEventDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (event: Event) => void;
  event: Event | null;
}> = ({ open, onOpenChange, onSave, event }) => {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<EventType | "">("");
  const [datetime, setDatetime] = useState("");
  const [status, setStatus] = useState<EventStatus | "">("");
  const [roomNumber, setRoomNumber] = useState("");
  const [patientName, setPatientName] = useState("");
  const [description, setDescription] = useState("");
  
  // 이벤트 데이터로 폼 필드 초기화
  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setType(event.type);
      setDatetime(event.datetime);
      setStatus(event.status);
      setRoomNumber(event.roomNumber);
      setPatientName(event.patientName || "");
      setDescription(event.description || "");
    }
  }, [event]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !title || !type || !datetime || !status || !roomNumber) {
      return; // 필수 필드 검증
    }
    
    onSave({
      ...event,
      title,
      type: type as EventType,
      datetime,
      status: status as EventStatus,
      roomNumber,
      patientName: patientName || undefined,
      description: description || undefined,
    });
  };
  
  if (!event) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>이벤트 수정</DialogTitle>
          <DialogDescription>이벤트 정보를 수정합니다.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div>
              <label htmlFor="title" className="text-sm font-medium block mb-1">제목</label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="이벤트 제목"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="type" className="text-sm font-medium block mb-1">유형</label>
                <Select value={type} onValueChange={(value) => setType(value as EventType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="유형 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="낙상">낙상</SelectItem>
                    <SelectItem value="약물투여">약물투여</SelectItem>
                    <SelectItem value="환경알림">환경알림</SelectItem>
                    <SelectItem value="치료">치료</SelectItem>
                    <SelectItem value="검진">검진</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label htmlFor="status" className="text-sm font-medium block mb-1">상태</label>
                <Select value={status} onValueChange={(value) => setStatus(value as EventStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="상태 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="완료">완료</SelectItem>
                    <SelectItem value="진행중">진행중</SelectItem>
                    <SelectItem value="예정">예정</SelectItem>
                    <SelectItem value="취소">취소</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <label htmlFor="datetime" className="text-sm font-medium block mb-1">날짜 및 시간</label>
              <Input
                id="datetime"
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="roomNumber" className="text-sm font-medium block mb-1">병실 번호</label>
                <Input
                  id="roomNumber"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="예: 301"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="patientName" className="text-sm font-medium block mb-1">환자 이름</label>
                <Input
                  id="patientName"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="(선택사항)"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="description" className="text-sm font-medium block mb-1">설명</label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="이벤트에 대한 상세 설명"
                className="resize-none"
                rows={3}
              />
            </div>
            
            <div className="text-sm text-gray-500">
              <p>작성자: {event.createdBy || '알 수 없음'}</p>
              <p>생성일: {event.createdAt || '알 수 없음'}</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
            <Button type="submit">저장</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// 이벤트 삭제 확인 다이얼로그
const DeleteEventDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  event: Event | null;
}> = ({ open, onOpenChange, onConfirm, event }) => {
  if (!event) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>이벤트 삭제</DialogTitle>
          <DialogDescription>이 이벤트를 정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="font-medium">{event.title}</p>
            <p className="text-sm text-gray-600">{event.datetime} | {event.type} | {event.roomNumber}호실</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
          <Button variant="destructive" onClick={onConfirm}>삭제</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EventsPage;