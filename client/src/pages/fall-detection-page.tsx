import React, { useState } from 'react';
import PoseDetector from '@/components/ui/pose-detector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import FallAlert from '@/components/ui/fall-alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const FallDetectionPage: React.FC = () => {
  const [isDetectorEnabled, setIsDetectorEnabled] = useState(true);
  const [fallAlert, setFallAlert] = useState<{ patientName: string, roomName: string, time: Date } | null>(null);
  const [events, setEvents] = useState<{ time: Date, message: string }[]>([]);
  const [showHistoricalData, setShowHistoricalData] = useState(false);
  
  const handleFallDetected = (timestamp: Date) => {
    // 낙상 감지 시 알림 표시
    setFallAlert({
      patientName: "테스트 환자",
      roomName: "101호",
      time: timestamp
    });
    
    // 이벤트 기록 추가
    setEvents(prev => [
      { time: timestamp, message: "낙상 감지됨" },
      ...prev
    ].slice(0, 10)); // 최근 10개 이벤트만 유지
  };
  
  const handleCameraToggle = (checked: boolean) => {
    setIsDetectorEnabled(checked);
  };
  
  const handleCloseAlert = () => {
    setFallAlert(null);
  };
  
  const handleAlertAction = () => {
    // 알림에 대한 조치 (예: 기록, 직원 알림 등)
    setFallAlert(null);
    setEvents(prev => [
      { time: new Date(), message: "낙상 대응 조치 완료" },
      ...prev
    ].slice(0, 10));
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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">낙상 감지 모니터링</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 카메라 피드 및 AI 감지 영역 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>실시간 모니터링</CardTitle>
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
                <PoseDetector
                  onFallDetected={handleFallDetected}
                  width={640}
                  height={480}
                />
              ) : (
                <div className="flex items-center justify-center bg-gray-100 rounded-lg" style={{ width: 640, height: 480 }}>
                  <p className="text-gray-500">카메라가 비활성화되었습니다.</p>
                </div>
              )}
              
              <div className="mt-4">
                <p className="text-sm text-gray-500">
                  * 비디오는 서버로 전송되지 않고 브라우저에서 로컬로 처리됩니다.
                </p>
                <p className="text-sm text-gray-500">
                  * 낙상 감지 시 자동으로 알림이 표시됩니다.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* 정보 및 로그 영역 */}
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>낙상 감지 알고리즘 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                <span className="font-medium">모델:</span> TensorFlow.js MoveNet
              </p>
              <p>
                <span className="font-medium">신뢰도 임계값:</span> 0.3
              </p>
              <p className="text-sm text-gray-500">
                이 시스템은 사람의 자세를 실시간으로 분석하여 갑작스러운 자세 변화와 비정상적인 포즈를 감지합니다.
              </p>
              
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  className="w-full mt-2"
                  onClick={() => setShowHistoricalData(!showHistoricalData)}
                >
                  {showHistoricalData ? '상세 정보 숨기기' : '상세 정보 보기'}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>이벤트 로그</CardTitle>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <p className="text-gray-500 text-center py-4">기록된 이벤트가 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {events.map((event, index) => (
                    <div key={index} className="flex items-start space-x-2 text-sm pb-2 border-b border-gray-100 last:border-0">
                      <span className="font-mono text-gray-500">{formatTime(event.time)}</span>
                      <span>{event.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* 상세 정보 섹션 */}
      {showHistoricalData && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>낙상 감지 통계</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="daily">
                <TabsList className="mb-4">
                  <TabsTrigger value="daily">일간</TabsTrigger>
                  <TabsTrigger value="weekly">주간</TabsTrigger>
                  <TabsTrigger value="monthly">월간</TabsTrigger>
                </TabsList>
                
                <TabsContent value="daily">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded shadow">
                      <h3 className="font-medium mb-2">오늘 낙상 감지</h3>
                      <p className="text-2xl font-bold">3건</p>
                      <p className="text-sm text-gray-500 mt-1">어제보다 1건 증가</p>
                    </div>
                    
                    <div className="bg-white p-4 rounded shadow">
                      <h3 className="font-medium mb-2">평균 대응 시간</h3>
                      <p className="text-2xl font-bold">2분 34초</p>
                      <p className="text-sm text-green-500 mt-1">목표보다 28% 빠름</p>
                    </div>
                    
                    <div className="bg-white p-4 rounded shadow">
                      <h3 className="font-medium mb-2">감지 정확도</h3>
                      <p className="text-2xl font-bold">94.5%</p>
                      <p className="text-sm text-green-500 mt-1">지난주 대비 2.3% 향상</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="weekly">
                  <div className="text-center py-12 text-gray-500">
                    이 기능은 개발 중입니다. 데이터 구성이 필요합니다.
                  </div>
                </TabsContent>
                
                <TabsContent value="monthly">
                  <div className="text-center py-12 text-gray-500">
                    이 기능은 개발 중입니다. 데이터 구성이 필요합니다.
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
      
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