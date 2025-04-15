import React from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  AlertCircle, 
  Bell, 
  Calendar, 
  Clock, 
  Droplets, 
  FileClock, 
  Home, 
  LayoutDashboard, 
  MapPin, 
  MessageSquare, 
  MonitorSmartphone, 
  Thermometer, 
  UserRound, 
  Users 
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const DashboardPage: React.FC = () => {
  return (
    <div className="p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">스마트 케어 대시보드</h1>
        <p className="text-gray-500">실시간 병원 모니터링 현황 및 정보를 확인하세요</p>
      </header>

      {/* 알림 배너 */}
      <Alert className="mb-6 border-red-500 bg-red-50 dark:bg-red-950/20">
        <AlertCircle className="h-5 w-5 text-red-500" />
        <AlertTitle className="text-red-500 dark:text-red-400">응급 상황 발생</AlertTitle>
        <AlertDescription>
          102호실 3번 병상에서 낙상 사고가 감지되었습니다. <Button size="sm" variant="link" className="p-0 h-auto text-red-500">즉시 확인</Button>
        </AlertDescription>
      </Alert>
      
      {/* 통계 카드 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">전체 환자</p>
                <h3 className="text-2xl font-bold">127명</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="mt-4">
              <Progress value={85} className="h-1" />
              <p className="text-xs text-gray-500 mt-1">병상 점유율 85%</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">오늘 낙상 감지</p>
                <h3 className="text-2xl font-bold">3건</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500">
                <span>전일 대비</span>
                <span className="text-red-500">+1건</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">평균 대응 시간</p>
                <h3 className="text-2xl font-bold">2분 34초</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500">
                <span>목표 시간</span>
                <span className="text-green-500">-28%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">환경 알림</p>
                <h3 className="text-2xl font-bold">2건</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Thermometer className="h-6 w-6 text-amber-500" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500">
                <span>온도 초과</span>
                <span>습도 초과</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 메인 컨텐츠 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 왼쪽 컬럼 - 병실 모니터링 */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>실시간 병실 모니터링</CardTitle>
              <CardDescription>현재 활성화된 모든 병실의 상태를 확인합니다</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 정상 상태 병실 */}
                <div className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center">
                      <div className="mr-3 p-2 rounded-full bg-green-100">
                        <Home className="h-5 w-5 text-green-500" />
                      </div>
                      <h3 className="font-medium">101호</h3>
                    </div>
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-600">정상</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <div>
                      <p>환자: 3명</p>
                      <p>담당: 김간호</p>
                    </div>
                    <div className="text-right">
                      <p><Thermometer className="inline h-4 w-4 mb-1 mr-1" /> 24.5°C</p>
                      <p><Droplets className="inline h-4 w-4 mb-1 mr-1" /> 45%</p>
                    </div>
                  </div>
                </div>
                
                {/* 알림 상태 병실 */}
                <div className="border rounded-lg p-4 bg-red-50 hover:bg-red-100 cursor-pointer transition-colors">
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center">
                      <div className="mr-3 p-2 rounded-full bg-red-100">
                        <Home className="h-5 w-5 text-red-500" />
                      </div>
                      <h3 className="font-medium">102호</h3>
                    </div>
                    <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-600">알림</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <div>
                      <p>환자: 4명</p>
                      <p>담당: 박간호</p>
                    </div>
                    <div className="text-right">
                      <p><Thermometer className="inline h-4 w-4 mb-1 mr-1" /> 22.0°C</p>
                      <p><Droplets className="inline h-4 w-4 mb-1 mr-1" /> 50%</p>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-red-200">
                    <p className="text-xs flex items-center text-red-500">
                      <AlertCircle className="h-3 w-3 mr-1" /> 3번 병상 낙상 감지 (2분 전)
                    </p>
                  </div>
                </div>
                
                {/* 정상 상태 병실 */}
                <div className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center">
                      <div className="mr-3 p-2 rounded-full bg-green-100">
                        <Home className="h-5 w-5 text-green-500" />
                      </div>
                      <h3 className="font-medium">103호</h3>
                    </div>
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-600">정상</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <div>
                      <p>환자: 4명</p>
                      <p>담당: 이간호</p>
                    </div>
                    <div className="text-right">
                      <p><Thermometer className="inline h-4 w-4 mb-1 mr-1" /> 23.0°C</p>
                      <p><Droplets className="inline h-4 w-4 mb-1 mr-1" /> 48%</p>
                    </div>
                  </div>
                </div>
                
                {/* 주의 상태 병실 */}
                <div className="border rounded-lg p-4 bg-amber-50 hover:bg-amber-100 cursor-pointer transition-colors">
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center">
                      <div className="mr-3 p-2 rounded-full bg-amber-100">
                        <Home className="h-5 w-5 text-amber-500" />
                      </div>
                      <h3 className="font-medium">104호</h3>
                    </div>
                    <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-600">주의</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <div>
                      <p>환자: 2명</p>
                      <p>담당: 최간호</p>
                    </div>
                    <div className="text-right">
                      <p><Thermometer className="inline h-4 w-4 mb-1 mr-1 text-amber-500" /> 27.5°C</p>
                      <p><Droplets className="inline h-4 w-4 mb-1 mr-1" /> 40%</p>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-amber-200">
                    <p className="text-xs flex items-center text-amber-500">
                      <Thermometer className="h-3 w-3 mr-1" /> 실내 온도 임계값 초과
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center mt-4">
                <Link href="/room-management">
                  <Button variant="outline">
                    전체 병실 보기
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>낙상 감지 통계</CardTitle>
              <CardDescription>주간 및 월간 낙상 감지 통계를 확인합니다</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="daily" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="daily">일간</TabsTrigger>
                  <TabsTrigger value="weekly">주간</TabsTrigger>
                  <TabsTrigger value="monthly">월간</TabsTrigger>
                </TabsList>
                
                <TabsContent value="daily">
                  <div className="relative h-[250px] border-b border-l p-4">
                    {/* 차트 영역 - 실제 차트 구현은 Chart.js나 recharts 등 필요 */}
                    <div className="flex items-end h-full">
                      <div className="w-1/7 px-2">
                        <div className="h-[20%] bg-primary/70 rounded-t-md w-full"></div>
                        <div className="text-xs text-center mt-2">월</div>
                      </div>
                      <div className="w-1/7 px-2">
                        <div className="h-[40%] bg-primary/70 rounded-t-md w-full"></div>
                        <div className="text-xs text-center mt-2">화</div>
                      </div>
                      <div className="w-1/7 px-2">
                        <div className="h-[10%] bg-primary/70 rounded-t-md w-full"></div>
                        <div className="text-xs text-center mt-2">수</div>
                      </div>
                      <div className="w-1/7 px-2">
                        <div className="h-[30%] bg-primary/70 rounded-t-md w-full"></div>
                        <div className="text-xs text-center mt-2">목</div>
                      </div>
                      <div className="w-1/7 px-2">
                        <div className="h-[50%] bg-primary/70 rounded-t-md w-full"></div>
                        <div className="text-xs text-center mt-2">금</div>
                      </div>
                      <div className="w-1/7 px-2">
                        <div className="h-[20%] bg-primary/70 rounded-t-md w-full"></div>
                        <div className="text-xs text-center mt-2">토</div>
                      </div>
                      <div className="w-1/7 px-2">
                        <div className="h-[60%] bg-primary/70 rounded-t-md w-full"></div>
                        <div className="text-xs text-center mt-2">일</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="bg-gray-50 p-4 rounded border">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">이번주 낙상 사고</h3>
                      <p className="text-2xl font-bold">12건</p>
                      <p className="text-xs text-gray-500 mt-1">전주 대비 <span className="text-red-500">+2건</span></p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded border">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">낙상 위험 환자</h3>
                      <p className="text-2xl font-bold">24명</p>
                      <p className="text-xs text-gray-500 mt-1">전체 환자의 <span className="text-amber-500">18.9%</span></p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded border">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">예방 조치 이행률</h3>
                      <p className="text-2xl font-bold">92.4%</p>
                      <p className="text-xs text-gray-500 mt-1">목표 대비 <span className="text-green-500">+7.4%</span></p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="weekly">
                  <div className="flex items-center justify-center h-[300px] bg-gray-50 p-4 rounded">
                    <p className="text-gray-500 text-center">주간 차트 데이터는 개발 중입니다.</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="monthly">
                  <div className="flex items-center justify-center h-[300px] bg-gray-50 p-4 rounded">
                    <p className="text-gray-500 text-center">월간 차트 데이터는 개발 중입니다.</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        {/* 오른쪽 컬럼 - 알림 및 이벤트 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>최근 이벤트</CardTitle>
              <CardDescription>지난 24시간 이내의 감지된 이벤트입니다</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-full bg-red-100 flex-shrink-0">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">낙상 감지</h4>
                      <span className="text-xs text-gray-500">24분 전</span>
                    </div>
                    <p className="text-sm text-gray-500">102호 3번 병상 (홍길동)</p>
                    <div className="flex items-center mt-1">
                      <Button size="sm" variant="outline" className="h-7 text-xs mr-1">조치 완료</Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs">상세 보기</Button>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-full bg-amber-100 flex-shrink-0">
                    <Thermometer className="h-4 w-4 text-amber-500" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">온도 경고</h4>
                      <span className="text-xs text-gray-500">2시간 전</span>
                    </div>
                    <p className="text-sm text-gray-500">104호 (27.5°C, 임계값: 26°C)</p>
                    <div className="flex items-center mt-1">
                      <Button size="sm" variant="ghost" className="h-7 text-xs">상세 보기</Button>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-full bg-red-100 flex-shrink-0">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">낙상 감지</h4>
                      <span className="text-xs text-gray-500">5시간 전</span>
                    </div>
                    <p className="text-sm text-gray-500">105호 2번 병상 (김철수)</p>
                    <div className="flex items-center mt-1">
                      <Button size="sm" variant="outline" className="h-7 text-xs mr-1">조치 완료</Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs">상세 보기</Button>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-full bg-blue-100 flex-shrink-0">
                    <Droplets className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">습도 경고</h4>
                      <span className="text-xs text-gray-500">8시간 전</span>
                    </div>
                    <p className="text-sm text-gray-500">106호 (32%, 임계값: 35%)</p>
                    <div className="flex items-center mt-1">
                      <Button size="sm" variant="ghost" className="h-7 text-xs">상세 보기</Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <Link href="/reports">
                  <Button variant="link" size="sm" className="w-full">
                    모든 이벤트 보기
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>오늘의 활동</CardTitle>
              <CardDescription>오늘의 일정과 작업 목록입니다</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-full bg-primary/10 flex-shrink-0">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">간호사 회의</h4>
                    <p className="text-xs text-gray-500">오전 9:00 - 10:00</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-full bg-primary/10 flex-shrink-0">
                    <FileClock className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">환자 상태 보고서 제출</h4>
                    <p className="text-xs text-gray-500">오후 3:00 마감</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-full bg-primary/10 flex-shrink-0">
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">낙상 위험 환자 점검</h4>
                    <p className="text-xs text-gray-500">오후 4:30 - 5:30</p>
                  </div>
                </div>
              </div>
              
              <div className="border-t mt-4 pt-4">
                <Link href="/calendar">
                  <Button variant="outline" size="sm" className="w-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    일정 관리
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>바로가기</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Link href="/fall-detection">
                <Button variant="outline" className="w-full flex flex-col h-auto py-4">
                  <MonitorSmartphone className="h-6 w-6 mb-2" />
                  <span>낙상 감지</span>
                </Button>
              </Link>
              
              <Link href="/cctv">
                <Button variant="outline" className="w-full flex flex-col h-auto py-4">
                  <MonitorSmartphone className="h-6 w-6 mb-2" />
                  <span>CCTV</span>
                </Button>
              </Link>
              
              <Link href="/user-management">
                <Button variant="outline" className="w-full flex flex-col h-auto py-4">
                  <UserRound className="h-6 w-6 mb-2" />
                  <span>사용자 관리</span>
                </Button>
              </Link>
              
              <Link href="/settings">
                <Button variant="outline" className="w-full flex flex-col h-auto py-4">
                  <LayoutDashboard className="h-6 w-6 mb-2" />
                  <span>설정</span>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;