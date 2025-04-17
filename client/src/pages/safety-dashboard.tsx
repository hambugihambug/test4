import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnimatedProgress } from '@/components/ui/animated-progress';
import { SafetyScoreCard } from '@/components/ui/safety-score-card';
import { ActivityLevel } from '@/components/ui/activity-level';
import { AnimatedCharacter } from '@/components/ui/animated-character';
import { AnimatedWave } from '@/components/ui/animated-wave';
import { AnimatedStatus } from '@/components/ui/animated-status';
import { AnimatedDataCard } from '@/components/ui/animated-data-card';
import { UserRole } from '@shared/schema';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  ShieldCheck, 
  Thermometer, 
  Calendar, 
  Users, 
  Moon, 
  Bed,
  Activity,
  Heart,
  BarChart3,
  UserCheck,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

// 임시 데이터 타입 정의
interface DashboardData {
  safetyScore: number;
  patientCount: number;
  roomCount: number;
  incidentCount: number;
  todayVisits: number;
  avgTemperature: number;
  avgHumidity: number;
  fallPreventionRate: number;
  nightIncidentRate: number;
  statistics: {
    incidents: number[];
    temperatures: number[];
  };
  safestRooms: {
    roomNumber: string;
    score: number;
  }[];
  patients: {
    id: number;
    name: string;
    room: string;
    safetyScore: number;
    activityLevel: number;
    fallRisk: number;
  }[];
}

// 임시 대시보드 데이터
const mockDashboardData: DashboardData = {
  safetyScore: 78,
  patientCount: 42,
  roomCount: 15,
  incidentCount: 3,
  todayVisits: 8,
  avgTemperature: 24.5,
  avgHumidity: 45,
  fallPreventionRate: 85,
  nightIncidentRate: 35,
  statistics: {
    incidents: [3, 2, 4, 1, 3, 2, 3],
    temperatures: [23.5, 24, 24.5, 25, 24.8, 24.3, 24.5]
  },
  safestRooms: [
    { roomNumber: '301', score: 92 },
    { roomNumber: '302', score: 87 },
    { roomNumber: '305', score: 84 }
  ],
  patients: [
    { id: 1, name: '김환자', room: '301', safetyScore: 90, activityLevel: 2, fallRisk: 15 },
    { id: 2, name: '이환자', room: '302', safetyScore: 75, activityLevel: 3, fallRisk: 35 },
    { id: 3, name: '박환자', room: '303', safetyScore: 60, activityLevel: 4, fallRisk: 52 },
    { id: 4, name: '정환자', room: '304', safetyScore: 85, activityLevel: 1, fallRisk: 22 },
    { id: 5, name: '최환자', room: '305', safetyScore: 45, activityLevel: 5, fallRisk: 78 }
  ]
};

const SafetyDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // 대시보드 데이터 불러오기 (실제 구현에서는 API를 호출)
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 실제 API 호출 대신 목업 데이터 사용
        setTimeout(() => {
          setData(mockDashboardData);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('대시보드 데이터 로드 중 오류:', error);
        toast({
          title: '데이터 로드 오류',
          description: '대시보드 데이터를 불러오는 데 실패했습니다.',
          variant: 'destructive',
        });
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // 사용자 역할 기반 접근 제어
  const isAdminOrNurse = user && (user.role === UserRole.DIRECTOR || user.role === UserRole.NURSE);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500">대시보드 데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">환자 안전 대시보드</h1>
        <p className="text-red-500">데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold mb-2">환자 안전 대시보드</h1>
        <p className="text-gray-600">병원 내 환자 안전과 낙상 예방 모니터링 시스템입니다.</p>
      </header>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">전체 개요</TabsTrigger>
          <TabsTrigger value="patients">환자별 현황</TabsTrigger>
          <TabsTrigger value="rooms">병실 현황</TabsTrigger>
          {isAdminOrNurse && (
            <TabsTrigger value="statistics">통계 분석</TabsTrigger>
          )}
        </TabsList>

        {/* 전체 개요 탭 */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <SafetyScoreCard 
                  score={data.safetyScore} 
                  title="병원 전체 안전 점수" 
                  description="전체 환자의 평균 안전 지수입니다"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <AnimatedStatus
                  status={data.incidentCount > 3 ? 'error' : data.incidentCount > 0 ? 'warning' : 'success'}
                  title="오늘의 낙상 사고"
                  description={data.incidentCount > 0 
                    ? `금일 낙상 사고 ${data.incidentCount}건이 발생했습니다` 
                    : "오늘은 낙상 사고가 발생하지 않았습니다"}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <AnimatedDataCard
                  title="온도 및 습도"
                  value={`${data.avgTemperature}°C`}
                  icon={<Thermometer className="h-5 w-5" />}
                  trend={{
                    direction: 'up',
                    value: '+0.5°C'
                  }}
                  color="info"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <AnimatedDataCard
                  title="입원 환자 현황"
                  value={data.patientCount}
                  icon={<Users className="h-5 w-5" />}
                  trend={{
                    direction: 'up',
                    value: '+2명'
                  }}
                  color="primary"
                />
              </motion.div>
            </AnimatePresence>
          </div>
          
          {/* 캐릭터 애니메이션 행 추가 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="col-span-1"
            >
              <AnimatedCharacter
                character={data.safetyScore >= 80 ? "😀" : 
                          data.safetyScore >= 60 ? "🙂" : 
                          data.safetyScore >= 40 ? "😐" : 
                          data.safetyScore >= 20 ? "🙁" : "😰"}
                state={data.safetyScore >= 70 ? "happy" : 
                       data.safetyScore >= 40 ? "idle" : 
                       data.safetyScore >= 20 ? "sad" : "alert"}
                title="병원 안전 상태"
                description={data.safetyScore >= 80 ? "매우 안전한 상태입니다" : 
                            data.safetyScore >= 60 ? "안전한 상태입니다" : 
                            data.safetyScore >= 40 ? "주의가 필요합니다" : 
                            data.safetyScore >= 20 ? "위험 상태입니다" : "매우 위험한 상태입니다"}
                size="lg"
              />
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="col-span-3"
            >
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <CardTitle>실시간 데이터 흐름</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col justify-end h-full">
                  <AnimatedWave color="#4C9AFF" height={30} width={110} speed={0.8} />
                  <AnimatedWave color="#60C6A8" height={20} width={120} speed={1.2} className="-mt-6" />
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>낙상 예방 현황</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col space-y-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <AnimatedProgress
                        value={data.fallPreventionRate}
                        maxValue={100}
                        title="낙상 예방 조치율"
                        icon={<ShieldCheck className="h-5 w-5" />}
                        color="success"
                        type="bar"
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="flex-1">
                      <AnimatedProgress
                        value={data.nightIncidentRate}
                        maxValue={100}
                        title="야간 사고 발생률"
                        icon={<Moon className="h-5 w-5" />}
                        color="warning"
                        type="bar"
                      />
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-blue-50 rounded-md">
                    <h4 className="font-medium text-blue-700 mb-2">낙상 예방 조언</h4>
                    <ul className="text-sm text-blue-600 space-y-1">
                      <li>• 환자의 개인 물품을 손이 닿는 곳에 배치하세요</li>
                      <li>• 침대 높이를 낮게 유지하세요</li>
                      <li>• 야간 조명을 적절히 유지하세요</li>
                      <li>• 휠체어 이동 시 브레이크 확인을 철저히 하세요</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>가장 안전한 병실</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {data.safestRooms.map((room, index) => (
                      <div key={room.roomNumber} className="flex items-center">
                        <div className="p-2 bg-gray-100 rounded-full mr-3">
                          <Bed className="h-5 w-5 text-gray-700" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">{room.roomNumber}호실</span>
                            <span className="text-green-600 font-medium">{room.score}점</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <motion.div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${room.score}%` }}
                              initial={{ width: 0 }}
                              animate={{ width: `${room.score}%` }}
                              transition={{ duration: 1, delay: 0.6 + index * 0.2 }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-green-50 rounded-md">
                    <h4 className="font-medium text-green-700 mb-2">안전 병실 특징</h4>
                    <ul className="text-sm text-green-600 space-y-1">
                      <li>• 미끄럼 방지 바닥 처리 완료</li>
                      <li>• 침대 주변 안전바 설치</li>
                      <li>• 응급호출 버튼 설치 및 작동 양호</li>
                      <li>• 복도 및 화장실 조명 상태 양호</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        {/* 환자별 현황 탭 */}
        <TabsContent value="patients">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-center"
          >
            <AnimatedCharacter
              character="👨‍⚕️"
              state="happy"
              size="sm"
              className="mr-4"
            />
            <div>
              <h3 className="text-lg font-medium text-blue-800">환자 안전 모니터링</h3>
              <p className="text-sm text-blue-700">각 환자의 안전 상태와 낙상 위험도를 실시간으로 확인하세요.</p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.patients.map((patient, index) => (
              <motion.div
                key={patient.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
                }}
                className="rounded-lg overflow-hidden"
              >
                <Card className="h-full border-2 hover:border-primary transition-colors duration-300">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <AnimatedCharacter
                          character={patient.safetyScore >= 80 ? "😀" : 
                                    patient.safetyScore >= 60 ? "🙂" : 
                                    patient.safetyScore >= 40 ? "😐" : 
                                    patient.safetyScore >= 20 ? "🙁" : "😰"}
                          state={patient.safetyScore >= 70 ? "happy" : 
                                patient.safetyScore >= 40 ? "idle" : 
                                patient.safetyScore >= 20 ? "sad" : "alert"}
                          size="sm"
                          className="mr-2"
                        />
                        <CardTitle className="text-lg">{patient.name}</CardTitle>
                      </div>
                      
                      <motion.div 
                        className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs"
                        whileHover={{ scale: 1.05 }}
                      >
                        {patient.room}호
                      </motion.div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-5">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium flex items-center">
                            <ShieldCheck className="h-4 w-4 mr-1 text-green-500" />
                            안전 점수
                          </span>
                          <span className={`text-sm font-medium ${
                            patient.safetyScore >= 70 ? 'text-green-600' : 
                            patient.safetyScore >= 40 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {patient.safetyScore}점
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <motion.div
                            className={`h-2.5 rounded-full ${
                              patient.safetyScore >= 70 ? 'bg-green-500' : 
                              patient.safetyScore >= 40 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${patient.safetyScore}%` }}
                            initial={{ width: 0 }}
                            animate={{ width: `${patient.safetyScore}%` }}
                            transition={{ duration: 0.8 }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-1 text-amber-500" />
                            낙상 위험도
                          </span>
                          <span className={`text-sm font-medium ${
                            patient.fallRisk <= 30 ? 'text-green-600' : 
                            patient.fallRisk <= 60 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {patient.fallRisk}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <motion.div
                            className={`h-2.5 rounded-full ${
                              patient.fallRisk <= 30 ? 'bg-green-500' : 
                              patient.fallRisk <= 60 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${patient.fallRisk}%` }}
                            initial={{ width: 0 }}
                            animate={{ width: `${patient.fallRisk}%` }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                          />
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-2 flex items-center">
                          <Activity className="h-4 w-4 mr-1 text-blue-500" />
                          활동 수준
                        </p>
                        <ActivityLevel level={patient.activityLevel} animated={true} />
                      </div>

                      <motion.div 
                        className="pt-3 mt-3 border-t border-gray-200"
                        whileHover={{ x: 5 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <a 
                          href={`/patients/${patient.id}`}
                          className="text-sm text-primary font-medium hover:underline flex items-center"
                        >
                          상세 정보 보기
                          <motion.span 
                            initial={{ x: 0 }}
                            animate={{ x: [0, 5, 0] }}
                            transition={{ 
                              repeat: Infinity, 
                              repeatType: "loop", 
                              duration: 1.5,
                              repeatDelay: 0.5
                            }}
                          >
                            →
                          </motion.span>
                        </a>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* 병실 현황 탭 */}
        <TabsContent value="rooms">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 bg-green-50 rounded-lg border border-green-100 flex items-center"
          >
            <AnimatedCharacter
              character="🏥"
              state="idle"
              size="sm"
              className="mr-4"
            />
            <div>
              <h3 className="text-lg font-medium text-green-800">병실 안전 모니터링</h3>
              <p className="text-sm text-green-700">각 병실의 안전 상태와 환경 조건을 실시간으로 확인하세요.</p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[301, 302, 303, 304, 305, 306].map((room, index) => {
              // 각 방마다 다른 점수 값 할당 (실제로는 서버에서 가져올 값)
              const safetyScore = Math.floor(60 + Math.random() * 30);
              const temperature = (22 + Math.random() * 5).toFixed(1);
              const humidity = Math.floor(40 + Math.random() * 15);
              const patientCount = Math.floor(1 + Math.random() * 3);
              const hasRecentIncident = Math.random() > 0.7;
              const recentIncidentDays = Math.floor(1 + Math.random() * 5);
              
              return (
                <motion.div
                  key={room}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ 
                    scale: 1.02,
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
                  }}
                  className="rounded-lg overflow-hidden"
                >
                  <Card className="h-full border-2 hover:border-primary transition-colors duration-300">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <motion.div 
                            className="p-2 bg-blue-100 rounded-full mr-2"
                            whileHover={{ rotate: 10 }}
                          >
                            <Bed className="h-4 w-4 text-blue-600" />
                          </motion.div>
                          <CardTitle className="text-lg">{room}호실</CardTitle>
                        </div>
                        
                        <AnimatedStatus 
                          status={safetyScore >= 80 ? "success" : 
                                 safetyScore >= 60 ? "warning" : "error"}
                          title=""
                          icon={
                            safetyScore >= 80 ? <Check className="h-4 w-4" /> : 
                            safetyScore >= 60 ? <AlertTriangle className="h-4 w-4" /> : 
                            <AlertCircle className="h-4 w-4" />
                          }
                          className="bg-transparent border-0 p-0 m-0"
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <AnimatedProgress
                          value={safetyScore}
                          maxValue={100}
                          title="병실 안전 점수"
                          icon={<ShieldCheck className="h-4 w-4" />}
                          color={safetyScore >= 80 ? "success" : 
                                safetyScore >= 60 ? "warning" : "danger"}
                          type="circle"
                          size="sm"
                        />
                      </div>
                      
                      <div className="mt-4 space-y-3">
                        <motion.div 
                          className="flex justify-between items-center p-2 rounded-lg bg-blue-50"
                          whileHover={{ backgroundColor: "#EFF6FF" }}
                        >
                          <span className="text-sm font-medium flex items-center text-blue-700">
                            <Thermometer className="h-4 w-4 mr-1 text-blue-600" />
                            현재 온도
                          </span>
                          <motion.span 
                            className="text-sm font-medium text-blue-800"
                            whileHover={{ scale: 1.1 }}
                          >
                            {temperature}°C
                          </motion.span>
                        </motion.div>
                        
                        <motion.div 
                          className="flex justify-between items-center p-2 rounded-lg bg-indigo-50"
                          whileHover={{ backgroundColor: "#EEF2FF" }}
                        >
                          <span className="text-sm font-medium flex items-center text-indigo-700">
                            <svg className="h-4 w-4 mr-1 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.092 1.21-.138 2.43-.138 3.662 0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.68 48.68 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.092-1.21.138-2.43.138-3.662Z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.75 6.75 16 9m-4.25 4.25 2.25 2.25m-8.5-2.25 2.25 2.25m-4.25-8.5 2.25 2.25" />
                            </svg>
                            현재 습도
                          </span>
                          <motion.span 
                            className="text-sm font-medium text-indigo-800"
                            whileHover={{ scale: 1.1 }}
                          >
                            {humidity}%
                          </motion.span>
                        </motion.div>
                        
                        <motion.div 
                          className="flex justify-between items-center p-2 rounded-lg bg-purple-50"
                          whileHover={{ backgroundColor: "#F5F3FF" }}
                        >
                          <span className="text-sm font-medium flex items-center text-purple-700">
                            <Users className="h-4 w-4 mr-1 text-purple-600" />
                            수용 환자
                          </span>
                          <motion.span 
                            className="text-sm font-medium text-purple-800"
                            whileHover={{ scale: 1.1 }}
                          >
                            {patientCount}명
                          </motion.span>
                        </motion.div>
                        
                        <motion.div 
                          className={`flex justify-between items-center p-2 rounded-lg ${hasRecentIncident ? 'bg-amber-50' : 'bg-green-50'}`}
                          whileHover={{ backgroundColor: hasRecentIncident ? "#FFFBEB" : "#F0FDF4" }}
                        >
                          <span className={`text-sm font-medium flex items-center ${hasRecentIncident ? 'text-amber-700' : 'text-green-700'}`}>
                            <AlertTriangle className={`h-4 w-4 mr-1 ${hasRecentIncident ? 'text-amber-600' : 'text-green-600'}`} />
                            최근 사고
                          </span>
                          <motion.span 
                            className={`text-sm font-medium ${hasRecentIncident ? 'text-amber-800' : 'text-green-800'}`}
                            whileHover={{ scale: 1.1 }}
                          >
                            {hasRecentIncident ? `${recentIncidentDays}일 전` : '없음'}
                          </motion.span>
                        </motion.div>
                      </div>
                      
                      <motion.div 
                        className="pt-3 mt-3 border-t border-gray-200"
                        whileHover={{ x: 5 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <a 
                          href={`/rooms/${room}`}
                          className="text-sm text-primary font-medium hover:underline flex items-center"
                        >
                          상세 정보 보기
                          <motion.span 
                            initial={{ x: 0 }}
                            animate={{ x: [0, 5, 0] }}
                            transition={{ 
                              repeat: Infinity, 
                              repeatType: "loop", 
                              duration: 1.5,
                              repeatDelay: 0.5
                            }}
                          >
                            →
                          </motion.span>
                        </a>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        {/* 통계 분석 탭 (관리자용) */}
        {isAdminOrNurse && (
          <TabsContent value="statistics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>낙상 사고 추이</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80 flex items-end justify-around">
                    {['월', '화', '수', '목', '금', '토', '일'].map((day, index) => (
                      <div key={day} className="flex flex-col items-center">
                        <motion.div
                          className={`w-12 ${
                            data.statistics.incidents[index] > 3 ? 'bg-red-500' :
                            data.statistics.incidents[index] > 1 ? 'bg-amber-500' : 'bg-green-500'
                          } rounded-t`}
                          style={{ height: `${data.statistics.incidents[index] * 40}px` }}
                          initial={{ height: 0 }}
                          animate={{ height: `${data.statistics.incidents[index] * 40}px` }}
                          transition={{ duration: 0.8, delay: index * 0.1 }}
                        >
                          <div className="h-full w-full flex items-center justify-center text-white font-bold">
                            {data.statistics.incidents[index]}
                          </div>
                        </motion.div>
                        <div className="mt-2 text-sm text-gray-600">{day}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>평균 온도 추이</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80 flex items-end justify-around">
                    {['월', '화', '수', '목', '금', '토', '일'].map((day, index) => (
                      <div key={day} className="flex flex-col items-center">
                        <motion.div
                          className={`w-12 ${
                            data.statistics.temperatures[index] > 25 ? 'bg-red-500' :
                            data.statistics.temperatures[index] > 23 ? 'bg-amber-500' : 'bg-blue-500'
                          } rounded-t`}
                          style={{ height: `${(data.statistics.temperatures[index] - 20) * 40}px` }}
                          initial={{ height: 0 }}
                          animate={{ height: `${(data.statistics.temperatures[index] - 20) * 40}px` }}
                          transition={{ duration: 0.8, delay: index * 0.1 }}
                        >
                          <div className="h-full w-full flex items-center justify-center text-white font-bold text-sm">
                            {data.statistics.temperatures[index]}°
                          </div>
                        </motion.div>
                        <div className="mt-2 text-sm text-gray-600">{day}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default SafetyDashboardPage;