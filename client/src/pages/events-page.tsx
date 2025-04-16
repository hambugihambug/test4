import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Clock, Search, Filter, AlertCircle, Pill, Thermometer, Stethoscope, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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
}

// 이벤트 데이터
const events: Event[] = [
  {
    id: '1',
    title: '낙상 감지 알림',
    type: '낙상',
    datetime: '2025-04-10 14:30',
    status: '완료',
    roomNumber: '304',
    patientName: '김환자',
    description: '침대에서 내려오다 미끄러짐'
  },
  {
    id: '2',
    title: '약물 투여',
    type: '약물투여',
    datetime: '2025-04-15 09:00',
    status: '예정',
    roomNumber: '302',
    patientName: '이환자',
    description: '혈압약 투여'
  },
  {
    id: '3',
    title: '실내 온도 이상 알림',
    type: '환경알림',
    datetime: '2025-04-12 16:45',
    status: '완료',
    roomNumber: '305',
    description: '실내 온도 과열 (30°C 초과)'
  },
  {
    id: '4',
    title: '정기 건강 검진',
    type: '검진',
    datetime: '2025-04-18 10:30',
    status: '예정',
    roomNumber: '301',
    patientName: '박환자'
  },
  {
    id: '5',
    title: '물리 치료',
    type: '치료',
    datetime: '2025-04-14 13:00',
    status: '완료',
    roomNumber: '304',
    patientName: '김환자',
    description: '어깨 물리치료'
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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [activeTab, setActiveTab] = useState("recent");
  
  // 필터링된 이벤트 목록
  const filteredEvents = events.filter(event => {
    // 검색어 필터링
    const matchesSearch = searchTerm ? 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (event.patientName && event.patientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      event.roomNumber.includes(searchTerm) : true;
    
    // 유형 필터링
    const matchesType = selectedType ? event.type === selectedType : true;
    
    // 상태 필터링
    const matchesStatus = selectedStatus ? event.status === selectedStatus : true;
    
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
            <CardHeader className="pb-3">
              <CardTitle>이벤트 타임라인</CardTitle>
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
                    <SelectItem value="">모든 유형</SelectItem>
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
                    <SelectItem value="">모든 상태</SelectItem>
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
    </div>
  );
};

export default EventsPage;