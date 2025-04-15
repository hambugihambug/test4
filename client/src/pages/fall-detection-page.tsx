import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  Camera, 
  CheckCircle2, 
  Clock, 
  Info, 
  Settings, 
  UserRound,
  Video, 
  AlertCircle, 
  ChevronDown, 
  PlusCircle,
  RefreshCw,
  ListFilter,
  PanelLeft,
  History,
  Radio
} from 'lucide-react';
import FallAlert from '@/components/ui/fall-alert';

// 임시 지원 컴포넌트 - 실제 구현은 백엔드에서 담당할 예정
const PoseDetectorMock: React.FC<{
  onFallDetected?: (timestamp: Date) => void;
  width?: number;
  height?: number;
}> = ({ onFallDetected, width = 640, height = 480 }) => {
  return (
    <div className="relative rounded-lg overflow-hidden" style={{ width, height }}>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
          <Camera className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-medium mb-2">카메라 피드</h3>
        <p className="text-sm text-gray-400 text-center max-w-md mb-4">
          이곳에 실시간 카메라 영상이 표시됩니다.
          <br />백엔드 AI 시스템에서 자세 감지 및 낙상 감지를 처리합니다.
        </p>
        
        <Button 
          variant="outline" 
          onClick={() => onFallDetected && onFallDetected(new Date())}
          className="bg-primary/20 border-primary/50"
        >
          테스트: 낙상 감지 시뮬레이션
        </Button>
      </div>
    </div>
  );
};

const FallDetectionPage: React.FC = () => {
  const [isDetectorEnabled, setIsDetectorEnabled] = useState(true);
  const [fallAlert, setFallAlert] = useState<{ patientName: string, roomName: string, time: Date } | null>(null);
  const [events, setEvents] = useState<{ time: Date, message: string, type?: string }[]>([]);
  const [selectedCamera, setSelectedCamera] = useState('camera1');
  const [selectedRoom, setSelectedRoom] = useState('102');
  const [detectionMode, setDetectionMode] = useState('highSensitivity');
  
  const handleFallDetected = (timestamp: Date) => {
    // 낙상 감지 시 알림 표시
    setFallAlert({
      patientName: "홍길동",
      roomName: selectedRoom + "호",
      time: timestamp
    });
    
    // 이벤트 기록 추가
    setEvents(prev => [
      { time: timestamp, message: "낙상 감지됨 - " + selectedRoom + "호", type: "alert" },
      ...prev
    ].slice(0, 20)); // 최근 20개 이벤트만 유지
  };
  
  const handleCameraToggle = (checked: boolean) => {
    setIsDetectorEnabled(checked);
    
    if (checked) {
      setEvents(prev => [
        { time: new Date(), message: "카메라 활성화됨", type: "info" },
        ...prev
      ].slice(0, 20));
    } else {
      setEvents(prev => [
        { time: new Date(), message: "카메라 비활성화됨", type: "warning" },
        ...prev
      ].slice(0, 20));
    }
  };
  
  const handleCloseAlert = () => {
    setFallAlert(null);
    setEvents(prev => [
      { time: new Date(), message: "알림 무시됨", type: "info" },
      ...prev
    ].slice(0, 20));
  };
  
  const handleAlertAction = () => {
    // 알림에 대한 조치 (예: 기록, 직원 알림 등)
    setFallAlert(null);
    setEvents(prev => [
      { time: new Date(), message: "낙상 대응 조치 완료", type: "success" },
      ...prev
    ].slice(0, 20));
  };
  
  // 시간을 'HH:MM:SS' 형식으로 포맷팅하는 함수
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false
    });
  };
  
  // 이벤트 타입에 따른 스타일
  const getEventStyle = (type?: string) => {
    switch (type) {
      case 'alert':
        return 'text-red-500 border-red-200 bg-red-50';
      case 'warning':
        return 'text-amber-500 border-amber-200 bg-amber-50';
      case 'success':
        return 'text-green-500 border-green-200 bg-green-50';
      case 'info':
      default:
        return 'text-blue-500 border-blue-200 bg-blue-50';
    }
  };
  
  // 이벤트 타입에 따른 아이콘
  const getEventIcon = (type?: string) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="h-4 w-4 flex-shrink-0" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 flex-shrink-0" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 flex-shrink-0" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 flex-shrink-0" />;
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col lg:flex-row justify-between items-start mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">낙상 감지 모니터링</h1>
          <p className="text-gray-500">AI 기반 실시간 낙상 감지 시스템</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-md shadow-sm border">
            <UserRound className="text-gray-500 h-4 w-4" />
            <Select value={selectedRoom} onValueChange={setSelectedRoom}>
              <SelectTrigger className="border-0 p-0 h-auto focus:ring-0 shadow-none">
                <SelectValue placeholder="병실 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="101">101호</SelectItem>
                <SelectItem value="102">102호</SelectItem>
                <SelectItem value="103">103호</SelectItem>
                <SelectItem value="104">104호</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-md shadow-sm border">
            <Video className="text-gray-500 h-4 w-4" />
            <Select value={selectedCamera} onValueChange={setSelectedCamera}>
              <SelectTrigger className="border-0 p-0 h-auto focus:ring-0 shadow-none">
                <SelectValue placeholder="카메라 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="camera1">카메라 #1 (메인)</SelectItem>
                <SelectItem value="camera2">카메라 #2 (보조)</SelectItem>
                <SelectItem value="camera3">카메라 #3 (침대)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            설정
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 카메라 피드 및 AI 감지 영역 */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {selectedRoom}호 모니터링
                    <Badge variant={isDetectorEnabled ? "default" : "outline"}>
                      {isDetectorEnabled ? '활성화' : '비활성화'}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    카메라 {selectedCamera.replace('camera', '#')} - 실시간 포즈 감지
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="camera-toggle" 
                    checked={isDetectorEnabled}
                    onCheckedChange={handleCameraToggle}
                  />
                  <Label htmlFor="camera-toggle">카메라 {isDetectorEnabled ? '켜짐' : '꺼짐'}</Label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isDetectorEnabled ? (
                <PoseDetectorMock
                  onFallDetected={handleFallDetected}
                  width={640}
                  height={480}
                />
              ) : (
                <div className="flex items-center justify-center bg-gray-100 rounded-lg" style={{ width: 640, height: 480 }}>
                  <div className="text-center p-6">
                    <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium mb-2">카메라가 비활성화되었습니다</p>
                    <p className="text-sm text-gray-400">카메라를 활성화하여 실시간 모니터링을 시작하세요</p>
                  </div>
                </div>
              )}
              
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-700 mb-1">개인정보 보호 안내</h4>
                    <ul className="text-sm text-blue-600 space-y-1 list-disc pl-4">
                      <li>비디오는 서버로 전송되지 않고 브라우저에서 로컬로 처리됩니다.</li>
                      <li>낙상 감지 시 자동으로 알림이 표시되고 담당자에게 통보됩니다.</li>
                      <li>모든 영상 데이터는 최소한으로 저장되며 병원 정책에 따라 관리됩니다.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 flex justify-between">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1">
                  <RefreshCw className="h-4 w-4" />
                  새로고침
                </Button>
                <Button variant="outline" size="sm" className="gap-1">
                  <PanelLeft className="h-4 w-4" />
                  화면 분할
                </Button>
              </div>
              <div className="flex gap-2">
                <Select value={detectionMode} onValueChange={setDetectionMode}>
                  <SelectTrigger className="h-9 w-[180px]">
                    <SelectValue placeholder="감지 모드" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lowSensitivity">저감도 감지</SelectItem>
                    <SelectItem value="standard">표준 감지</SelectItem>
                    <SelectItem value="highSensitivity">고감도 감지</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>낙상 감지 통계</CardTitle>
              <CardDescription>병실별 낙상 감지 통계를 확인합니다</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="daily" className="w-full">
                <div className="flex justify-between items-center mb-4">
                  <TabsList>
                    <TabsTrigger value="daily">일간</TabsTrigger>
                    <TabsTrigger value="weekly">주간</TabsTrigger>
                    <TabsTrigger value="monthly">월간</TabsTrigger>
                  </TabsList>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-1">
                      <History className="h-4 w-4" />
                      이력
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1">
                      <ListFilter className="h-4 w-4" />
                      필터
                    </Button>
                  </div>
                </div>
                
                <TabsContent value="daily" className="m-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-700">병실별 낙상 감지</h3>
                        <Badge>오늘</Badge>
                      </div>
                      
                      <div className="space-y-3 mt-4">
                        <div>
                          <div className="flex justify-between mb-1 text-sm">
                            <span>101호 (0건)</span>
                            <span>0%</span>
                          </div>
                          <Progress value={0} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1 text-sm">
                            <span className="font-medium text-primary">102호 (2건)</span>
                            <span className="font-medium text-primary">67%</span>
                          </div>
                          <Progress value={67} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1 text-sm">
                            <span>103호 (1건)</span>
                            <span>33%</span>
                          </div>
                          <Progress value={33} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1 text-sm">
                            <span>104호 (0건)</span>
                            <span>0%</span>
                          </div>
                          <Progress value={0} className="h-2" />
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">총 낙상 감지</span>
                          <span className="font-medium">3건</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-700">시간대별 감지 현황</h3>
                        <Badge variant="outline">최근 24시간</Badge>
                      </div>
                      
                      <div className="h-[180px] flex items-end justify-between mt-4 pl-6 pr-3 pb-1">
                        {Array.from({ length: 8 }).map((_, i) => (
                          <div 
                            key={i} 
                            className="w-[8%] bg-primary/80 rounded-t" 
                            style={{ 
                              height: `${[10, 30, 20, 50, 70, 40, 30, 20][i]}%` 
                            }}
                          />
                        ))}
                      </div>
                      
                      <div className="flex justify-between mt-1 px-1 text-xs text-gray-500">
                        <span>00:00</span>
                        <span>03:00</span>
                        <span>06:00</span>
                        <span>09:00</span>
                        <span>12:00</span>
                        <span>15:00</span>
                        <span>18:00</span>
                        <span>21:00</span>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">최대 발생 시간대</span>
                          <span className="font-medium">12:00 - 15:00</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                          <AlertTriangle className="h-6 w-6 text-red-500" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">오늘 낙상 감지</p>
                          <h3 className="text-2xl font-bold">3건</h3>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-3">어제보다 <span className="text-red-500">+1건</span></p>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                          <Clock className="h-6 w-6 text-green-500" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">평균 대응 시간</p>
                          <h3 className="text-2xl font-bold">2분 34초</h3>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-3">목표보다 <span className="text-green-500">28% 빠름</span></p>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <Radio className="h-6 w-6 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">감지 정확도</p>
                          <h3 className="text-2xl font-bold">94.5%</h3>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-3">전주 대비 <span className="text-green-500">+2.3%</span></p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="weekly" className="m-0">
                  <div className="flex items-center justify-center h-[300px] bg-gray-50 p-6 rounded-lg border">
                    <div className="text-center">
                      <Info className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 mb-2">주간 차트 데이터가 준비 중입니다</p>
                      <p className="text-sm text-gray-400">백엔드 API 설정이 필요합니다</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="monthly" className="m-0">
                  <div className="flex items-center justify-center h-[300px] bg-gray-50 p-6 rounded-lg border">
                    <div className="text-center">
                      <Info className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 mb-2">월간 차트 데이터가 준비 중입니다</p>
                      <p className="text-sm text-gray-400">백엔드 API 설정이 필요합니다</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        {/* 오른쪽 컬럼 - 정보 및 로그 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>시스템 상태</span>
                <Badge variant="outline" className="font-normal">실시간</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-green-500 mr-3 relative">
                    <span className="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  </div>
                  <span className="font-medium text-green-700">AI 시스템 작동 중</span>
                </div>
                <span className="text-xs text-green-600">정상</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 border rounded-md">
                  <p className="text-sm text-gray-500 mb-1">모델</p>
                  <p className="font-medium">TensorFlow YOLO + MoveNet</p>
                </div>
                
                <div className="p-3 border rounded-md">
                  <p className="text-sm text-gray-500 mb-1">처리 딜레이</p>
                  <p className="font-medium">235ms</p>
                </div>
                
                <div className="p-3 border rounded-md">
                  <p className="text-sm text-gray-500 mb-1">탐지 모드</p>
                  <p className="font-medium">
                    {detectionMode === 'highSensitivity' ? '고감도 감지' : 
                     detectionMode === 'standard' ? '표준 감지' : '저감도 감지'}
                  </p>
                </div>
                
                <div className="p-3 border rounded-md">
                  <p className="text-sm text-gray-500 mb-1">임계값</p>
                  <p className="font-medium">0.65</p>
                </div>
              </div>
              
              <div className="pt-2">
                <h4 className="text-sm font-medium mb-2">정확도 개선 팁</h4>
                <ul className="text-sm text-gray-500 space-y-1 list-disc pl-5">
                  <li>카메라가 충분한 조명 환경에 있는지 확인하세요.</li>
                  <li>카메라 앵글이 침대나 생활 공간을 잘 포함하는지 확인하세요.</li>
                  <li>정확도를 높이기 위해 여러 카메라를 설치하는 것이 좋습니다.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>이벤트 로그</span>
                <Button variant="ghost" size="sm" className="h-8 gap-1">
                  <PlusCircle className="h-4 w-4" />
                  필터
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                {events.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Info className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-gray-500">기록된 이벤트가 없습니다</p>
                    <p className="text-sm text-gray-400 mt-1">카메라를 활성화하여 모니터링을 시작하세요</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {events.map((event, index) => (
                      <div 
                        key={index} 
                        className={`flex px-3 py-2 rounded-md border text-sm ${getEventStyle(event.type)}`}
                      >
                        <div className="mr-3 mt-0.5">
                          {getEventIcon(event.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <p className="font-medium">{event.message}</p>
                            <span className="text-xs opacity-70">{formatTime(event.time)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button variant="outline" className="w-full" size="sm">
                모든 로그 보기
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>담당자 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <UserRound className="h-6 w-6 text-gray-500" />
                  </div>
                  <div>
                    <h4 className="font-medium">김간호</h4>
                    <p className="text-sm text-gray-500">102호 담당 간호사</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500">근무 시간</p>
                    <p className="font-medium">09:00 - 18:00</p>
                  </div>
                  <div>
                    <p className="text-gray-500">연락처</p>
                    <p className="font-medium">내선 #1234</p>
                  </div>
                </div>
                
                <div className="flex space-x-2 mt-2">
                  <Button className="flex-1" size="sm">
                    전화 연결
                  </Button>
                  <Button variant="outline" className="flex-1" size="sm">
                    메시지 전송
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* 낙상 알림 표시 */}
      {fallAlert && (
        <FallAlert
          patientName={fallAlert.patientName}
          roomName={fallAlert.roomName}
          time={fallAlert.time}
          onClose={handleCloseAlert}
          onAction={handleAlertAction}
        />
      )}
    </div>
  );
};

export default FallDetectionPage;