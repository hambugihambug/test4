import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Thermometer, Droplets, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// 임시 데이터 (실제로는 API에서 가져와야 함)
const roomsData = [
  {
    id: 1,
    name: "101호",
    currentTemp: 24.5,
    currentHumidity: 55,
    status: "normal",
    historyTemperature: [
      { time: "00:00", value: 23.5 },
      { time: "02:00", value: 23.8 },
      { time: "04:00", value: 24.0 },
      { time: "06:00", value: 24.2 },
      { time: "08:00", value: 24.5 },
      { time: "10:00", value: 24.8 },
      { time: "12:00", value: 25.0 },
      { time: "14:00", value: 25.2 },
      { time: "16:00", value: 24.8 },
      { time: "18:00", value: 24.5 },
      { time: "20:00", value: 24.3 },
      { time: "22:00", value: 24.0 }
    ],
    historyHumidity: [
      { time: "00:00", value: 52 },
      { time: "02:00", value: 53 },
      { time: "04:00", value: 53 },
      { time: "06:00", value: 54 },
      { time: "08:00", value: 55 },
      { time: "10:00", value: 57 },
      { time: "12:00", value: 58 },
      { time: "14:00", value: 59 },
      { time: "16:00", value: 58 },
      { time: "18:00", value: 57 },
      { time: "20:00", value: 56 },
      { time: "22:00", value: 55 }
    ]
  },
  {
    id: 2,
    name: "102호",
    currentTemp: 25.8,
    currentHumidity: 62,
    status: "warning",
    historyTemperature: [
      { time: "00:00", value: 23.8 },
      { time: "02:00", value: 24.0 },
      { time: "04:00", value: 24.3 },
      { time: "06:00", value: 24.5 },
      { time: "08:00", value: 24.8 },
      { time: "10:00", value: 25.2 },
      { time: "12:00", value: 25.5 },
      { time: "14:00", value: 25.8 },
      { time: "16:00", value: 26.0 },
      { time: "18:00", value: 26.2 },
      { time: "20:00", value: 26.0 },
      { time: "22:00", value: 25.8 }
    ],
    historyHumidity: [
      { time: "00:00", value: 56 },
      { time: "02:00", value: 57 },
      { time: "04:00", value: 58 },
      { time: "06:00", value: 58 },
      { time: "08:00", value: 59 },
      { time: "10:00", value: 60 },
      { time: "12:00", value: 61 },
      { time: "14:00", value: 62 },
      { time: "16:00", value: 63 },
      { time: "18:00", value: 63 },
      { time: "20:00", value: 62 },
      { time: "22:00", value: 62 }
    ]
  },
  {
    id: 3,
    name: "103호",
    currentTemp: 26.5,
    currentHumidity: 58,
    status: "alert",
    historyTemperature: [
      { time: "00:00", value: 24.0 },
      { time: "02:00", value: 24.3 },
      { time: "04:00", value: 24.5 },
      { time: "06:00", value: 24.8 },
      { time: "08:00", value: 25.0 },
      { time: "10:00", value: 25.5 },
      { time: "12:00", value: 26.0 },
      { time: "14:00", value: 26.3 },
      { time: "16:00", value: 26.5 },
      { time: "18:00", value: 26.8 },
      { time: "20:00", value: 26.5 },
      { time: "22:00", value: 26.3 }
    ],
    historyHumidity: [
      { time: "00:00", value: 54 },
      { time: "02:00", value: 54 },
      { time: "04:00", value: 55 },
      { time: "06:00", value: 55 },
      { time: "08:00", value: 56 },
      { time: "10:00", value: 57 },
      { time: "12:00", value: 58 },
      { time: "14:00", value: 58 },
      { time: "16:00", value: 59 },
      { time: "18:00", value: 58 },
      { time: "20:00", value: 58 },
      { time: "22:00", value: 57 }
    ]
  }
];

export default function EnvironmentPage() {
  const { user } = useAuth();
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("temperature");
  
  // 임시 데이터 사용
  const roomsEnvironmentData = roomsData;
  
  // 초기 선택된 방
  useEffect(() => {
    if (!selectedRoomId && roomsEnvironmentData.length > 0) {
      setSelectedRoomId(roomsEnvironmentData[0].id);
    }
  }, [roomsEnvironmentData, selectedRoomId]);
  
  // 선택된 방 데이터
  const selectedRoom = roomsEnvironmentData.find(room => room.id === selectedRoomId);
  
  // 상태에 따른 컴포넌트
  const getStatusComponent = (status: string) => {
    switch (status) {
      case 'warning':
        return (
          <Alert className="mt-4 bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertTitle className="text-yellow-700">주의 알림</AlertTitle>
            <AlertDescription className="text-yellow-600">
              온도가 설정 기준을 초과했습니다. 에어컨 조정이 필요할 수 있습니다.
            </AlertDescription>
          </Alert>
        );
      case 'alert':
        return (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>경고 알림</AlertTitle>
            <AlertDescription>
              온도가 위험 수준에 도달했습니다. 즉시 에어컨 조정이 필요합니다.
            </AlertDescription>
          </Alert>
        );
      default:
        return (
          <Alert variant="default" className="mt-4 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-700">정상 상태</AlertTitle>
            <AlertDescription className="text-green-600">
              모든 환경 지표가 정상 범위 내에 있습니다.
            </AlertDescription>
          </Alert>
        );
    }
  };
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1">환경 모니터링</h1>
      <p className="text-gray-500 mb-6">병실 환경 상태를 모니터링하고 관리합니다.</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 병실 목록 */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">모니터링 병실</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {roomsEnvironmentData.map((room) => (
                <div 
                  key={room.id}
                  className={`p-3 cursor-pointer transition-colors ${selectedRoomId === room.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                  onClick={() => setSelectedRoomId(room.id)}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">{room.name}</h3>
                    <div className={`w-2 h-2 rounded-full ${
                      room.status === 'normal' ? 'bg-green-400' : 
                      room.status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
                    }`}></div>
                  </div>
                  <div className="flex justify-between items-center mt-2 text-sm">
                    <div className="flex items-center">
                      <Thermometer className="h-4 w-4 text-yellow-500 mr-1" />
                      <span>{room.currentTemp.toFixed(1)}°C</span>
                    </div>
                    <div className="flex items-center">
                      <Droplets className="h-4 w-4 text-blue-500 mr-1" />
                      <span>{room.currentHumidity}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* 병실 상세 정보 */}
        {selectedRoom ? (
          <Card className="lg:col-span-3">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">{selectedRoom.name} 환경 상태</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-2 mb-6">
                  <TabsTrigger value="temperature">온도</TabsTrigger>
                  <TabsTrigger value="humidity">습도</TabsTrigger>
                </TabsList>
                
                <TabsContent value="temperature" className="space-y-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div className="mb-4 md:mb-0">
                      <h3 className="text-sm text-gray-500 mb-1">현재 온도</h3>
                      <div className="flex items-center">
                        <Thermometer className="h-6 w-6 text-yellow-500 mr-2" />
                        <span className="text-3xl font-bold mr-2">{selectedRoom.currentTemp.toFixed(1)}</span>
                        <span className="text-xl">°C</span>
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        <span>적정 온도: 22.0°C ~ 26.0°C</span>
                      </div>
                    </div>
                    
                    <div className="w-full md:w-1/2">
                      <h3 className="text-sm text-gray-500 mb-2">온도 수준</h3>
                      <div className="relative">
                        <Progress 
                          value={(selectedRoom.currentTemp - 18) / (32 - 18) * 100} 
                          className="h-3"
                        />
                        <div className="flex justify-between text-xs mt-1">
                          <span>18°C</span>
                          <span>25°C</span>
                          <span>32°C</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {getStatusComponent(selectedRoom.status)}
                  
                  <div className="mt-6">
                    <div className="flex items-center mb-3">
                      <Clock className="h-4 w-4 text-gray-400 mr-2" />
                      <h3 className="text-sm font-medium">24시간 온도 변화</h3>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={selectedRoom.historyTemperature}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis domain={[18, 32]} />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            name="온도 (°C)" 
                            stroke="#f59e0b" 
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="humidity" className="space-y-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div className="mb-4 md:mb-0">
                      <h3 className="text-sm text-gray-500 mb-1">현재 습도</h3>
                      <div className="flex items-center">
                        <Droplets className="h-6 w-6 text-blue-500 mr-2" />
                        <span className="text-3xl font-bold mr-2">{selectedRoom.currentHumidity}</span>
                        <span className="text-xl">%</span>
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        <span>적정 습도: 40% ~ 60%</span>
                      </div>
                    </div>
                    
                    <div className="w-full md:w-1/2">
                      <h3 className="text-sm text-gray-500 mb-2">습도 수준</h3>
                      <div className="relative">
                        <Progress 
                          value={(selectedRoom.currentHumidity - 20) / (80 - 20) * 100} 
                          className="h-3"
                        />
                        <div className="flex justify-between text-xs mt-1">
                          <span>20%</span>
                          <span>50%</span>
                          <span>80%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <div className="flex items-center mb-3">
                      <Clock className="h-4 w-4 text-gray-400 mr-2" />
                      <h3 className="text-sm font-medium">24시간 습도 변화</h3>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={selectedRoom.historyHumidity}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis domain={[20, 80]} />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            name="습도 (%)" 
                            stroke="#3b82f6" 
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <Card className="lg:col-span-3">
            <CardContent className="flex justify-center items-center h-64 text-gray-500">
              병실을 선택하여 환경 정보를 확인하세요
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}