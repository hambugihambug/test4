import { useParams } from "wouter";
import { ArrowLeft, HeartPulse, User, CalendarClock, Users, BedDouble, MapPin, FileText, Phone, Shield, Clipboard, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

// 임시 환자 상세 데이터
const PATIENT_DATA = {
  1: {
    id: 1,
    name: "김환자",
    age: 65,
    gender: "남",
    birthDate: "1960-05-15",
    roomNumber: "101",
    bedNumber: 1,
    diagnosis: "고관절 골절",
    admissionDate: "2025-03-10",
    expectedDischargeDate: "2025-04-25",
    guardian: {
      name: "김보호자",
      relation: "자녀",
      contact: "010-1234-5678"
    },
    address: "서울시 강남구 역삼동 123-45",
    contact: "010-9876-5432",
    condition: "안정",
    nurseInCharge: "이간호사",
    fallRisk: "높음",
    fallRiskScore: 75,
    fallHistory: [
      { date: "2025-04-01", time: "14:32", severity: "경미", location: "병실 화장실", description: "화장실에서 미끄러져 넘어짐" },
      { date: "2025-03-20", time: "09:15", severity: "중간", location: "병실", description: "침대에서 내려오다 균형을 잃고 낙상" }
    ],
    medications: [
      { name: "아스피린", dosage: "100mg", frequency: "1일 1회", timing: "아침 식후" },
      { name: "칼슘제", dosage: "500mg", frequency: "1일 2회", timing: "아침, 저녁 식후" }
    ],
    notes: [
      { date: "2025-04-10", author: "이간호사", content: "보행 시 지속적인 도움이 필요함. 휠체어 사용 권장." },
      { date: "2025-04-05", author: "박의사", content: "골절 부위 호전 중. 재활 운동 시작 가능." }
    ],
    vitalSigns: [
      { date: "2025-04-14", bloodPressure: "130/85", heartRate: 72, temperature: 36.5, respiratoryRate: 16 },
      { date: "2025-04-13", bloodPressure: "135/88", heartRate: 75, temperature: 36.7, respiratoryRate: 18 },
      { date: "2025-04-12", bloodPressure: "128/82", heartRate: 70, temperature: 36.4, respiratoryRate: 17 }
    ]
  },
  2: {
    id: 2,
    name: "이환자",
    age: 78,
    gender: "여",
    birthDate: "1947-11-20",
    roomNumber: "101",
    bedNumber: 2,
    diagnosis: "뇌졸중",
    admissionDate: "2025-02-15",
    expectedDischargeDate: "2025-05-10",
    guardian: {
      name: "이보호자",
      relation: "배우자",
      contact: "010-2345-6789"
    },
    address: "서울시 서초구 반포동 456-78",
    contact: "010-8765-4321",
    condition: "양호",
    nurseInCharge: "김간호사",
    fallRisk: "중간",
    fallRiskScore: 45,
    fallHistory: [
      { date: "2025-03-05", time: "18:45", severity: "경미", location: "복도", description: "복도 이동 중 균형 상실" }
    ],
    medications: [
      { name: "와파린", dosage: "5mg", frequency: "1일 1회", timing: "저녁 식후" },
      { name: "혈압약", dosage: "10mg", frequency: "1일 2회", timing: "아침, 저녁 식전" }
    ],
    notes: [
      { date: "2025-04-08", author: "김간호사", content: "재활 운동 진행 중. 손 움직임 호전 보임." },
      { date: "2025-03-25", author: "최의사", content: "MRI 재검사 결과 양호. 언어 치료 시작 권장." }
    ],
    vitalSigns: [
      { date: "2025-04-14", bloodPressure: "140/90", heartRate: 68, temperature: 36.3, respiratoryRate: 17 },
      { date: "2025-04-13", bloodPressure: "145/92", heartRate: 72, temperature: 36.5, respiratoryRate: 18 }
    ]
  }
};

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const patientId = parseInt(id);
  
  // 임시 데이터에서 환자 정보 가져오기
  const patient = PATIENT_DATA[patientId as keyof typeof PATIENT_DATA];
  
  if (!patient) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">존재하지 않는 환자입니다</h1>
        <p className="text-gray-600 mb-6">요청하신 환자 정보를 찾을 수 없습니다.</p>
        <a href="/" className="text-primary hover:underline">홈으로 돌아가기</a>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <a href="/" className="mr-4">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            뒤로가기
          </Button>
        </a>
        <h1 className="text-2xl font-bold">{patient.name} 환자 정보</h1>
        <span className={`ml-4 px-2 py-1 text-xs rounded-full ${
          patient.condition === "안정" ? "bg-green-100 text-green-800" : 
          patient.condition === "주의" ? "bg-yellow-100 text-yellow-800" : 
          "bg-red-100 text-red-800"
        }`}>
          {patient.condition}
        </span>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>기본 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm font-medium mr-2">이름:</span>
                  <span className="text-sm">{patient.name}</span>
                </div>
                <div className="flex items-center">
                  <CalendarClock className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm font-medium mr-2">나이:</span>
                  <span className="text-sm">{patient.age}세 ({patient.gender})</span>
                </div>
                <div className="flex items-center">
                  <CalendarClock className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm font-medium mr-2">생년월일:</span>
                  <span className="text-sm">{patient.birthDate}</span>
                </div>
                <div className="flex items-center">
                  <BedDouble className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm font-medium mr-2">병실/침대:</span>
                  <span className="text-sm">{patient.roomNumber}호 {patient.bedNumber}번 침대</span>
                </div>
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm font-medium mr-2">진단명:</span>
                  <span className="text-sm">{patient.diagnosis}</span>
                </div>
                <div className="flex items-center">
                  <CalendarClock className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm font-medium mr-2">입원일:</span>
                  <span className="text-sm">{patient.admissionDate}</span>
                </div>
                <div className="flex items-center">
                  <CalendarClock className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm font-medium mr-2">퇴원 예정일:</span>
                  <span className="text-sm">{patient.expectedDischargeDate}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm font-medium mr-2">주소:</span>
                  <span className="text-sm">{patient.address}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm font-medium mr-2">연락처:</span>
                  <span className="text-sm">{patient.contact}</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm font-medium mr-2">보호자:</span>
                  <span className="text-sm">{patient.guardian.name} ({patient.guardian.relation})</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm font-medium mr-2">보호자 연락처:</span>
                  <span className="text-sm">{patient.guardian.contact}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>낙상 위험도</CardTitle>
              <CardDescription>환자의 낙상 위험도 평가 결과</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">위험도:</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    patient.fallRisk === "높음" ? "bg-red-100 text-red-800" : 
                    patient.fallRisk === "중간" ? "bg-yellow-100 text-yellow-800" : 
                    "bg-green-100 text-green-800"
                  }`}>
                    {patient.fallRisk}
                  </span>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">위험도 점수: {patient.fallRiskScore}/100</span>
                  </div>
                  <Progress value={patient.fallRiskScore} className="h-2" />
                </div>
                
                <div className="pt-2 border-t">
                  <h4 className="text-sm font-medium mb-2">이전 낙상 기록</h4>
                  {patient.fallHistory.length > 0 ? (
                    <div className="space-y-2">
                      {patient.fallHistory.map((fall, index) => (
                        <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium">{fall.date} {fall.time}</span>
                            <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                              fall.severity === "중간" ? "bg-yellow-100 text-yellow-800" : 
                              fall.severity === "심각" ? "bg-red-100 text-red-800" :
                              "bg-blue-100 text-blue-800"
                            }`}>
                              {fall.severity}
                            </span>
                          </div>
                          <div className="mt-1">{fall.location}: {fall.description}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm">낙상 기록이 없습니다.</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <Tabs defaultValue="vital">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="vital">
                <HeartPulse className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">활력 징후</span>
              </TabsTrigger>
              <TabsTrigger value="medication">
                <Clipboard className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">투약 정보</span>
              </TabsTrigger>
              <TabsTrigger value="notes">
                <FileText className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">진료 기록</span>
              </TabsTrigger>
              <TabsTrigger value="monitoring">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">모니터링</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="vital">
              <Card>
                <CardHeader>
                  <CardTitle>활력 징후</CardTitle>
                  <CardDescription>최근 활력 징후 기록</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">날짜</th>
                          <th className="text-left p-2">혈압</th>
                          <th className="text-left p-2">심박수</th>
                          <th className="text-left p-2">체온</th>
                          <th className="text-left p-2">호흡수</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patient.vitalSigns.map((vital, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2">{vital.date}</td>
                            <td className="p-2">{vital.bloodPressure}</td>
                            <td className="p-2">{vital.heartRate} BPM</td>
                            <td className="p-2">{vital.temperature}°C</td>
                            <td className="p-2">{vital.respiratoryRate}/분</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="medication">
              <Card>
                <CardHeader>
                  <CardTitle>투약 정보</CardTitle>
                  <CardDescription>현재 처방된 약물 정보</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">약품명</th>
                          <th className="text-left p-2">용량</th>
                          <th className="text-left p-2">빈도</th>
                          <th className="text-left p-2">투약 시간</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patient.medications.map((med, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2">{med.name}</td>
                            <td className="p-2">{med.dosage}</td>
                            <td className="p-2">{med.frequency}</td>
                            <td className="p-2">{med.timing}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="notes">
              <Card>
                <CardHeader>
                  <CardTitle>진료 기록</CardTitle>
                  <CardDescription>의료진 노트 및 관찰 사항</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {patient.notes.map((note, index) => (
                      <div key={index} className="p-3 rounded-md border">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{note.date}</span>
                          <span className="text-sm text-gray-500">{note.author}</span>
                        </div>
                        <p className="text-sm">{note.content}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="monitoring">
              <Card>
                <CardHeader>
                  <CardTitle>모니터링 설정</CardTitle>
                  <CardDescription>낙상 감지 및 환경 모니터링 설정</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-md border">
                      <div>
                        <h3 className="font-medium">낙상 감지 알림</h3>
                        <p className="text-sm text-gray-500">낙상 감지 시 알림을 설정합니다.</p>
                      </div>
                      <Button size="sm">설정</Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-md border">
                      <div>
                        <h3 className="font-medium">침대 이탈 감지</h3>
                        <p className="text-sm text-gray-500">침대 이탈 시 알림을 설정합니다.</p>
                      </div>
                      <Button size="sm">설정</Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-md border">
                      <div>
                        <h3 className="font-medium">환경 모니터링</h3>
                        <p className="text-sm text-gray-500">온도, 습도 등 환경 조건 알림을 설정합니다.</p>
                      </div>
                      <Button size="sm">설정</Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-md border">
                      <div>
                        <h3 className="font-medium">보호자 알림 설정</h3>
                        <p className="text-sm text-gray-500">보호자에게 특정 상황 발생 시 알림을 설정합니다.</p>
                      </div>
                      <Button size="sm">설정</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}