import { useParams } from "wouter";
import { 
  ArrowLeft, HeartPulse, User, CalendarClock, Users, BedDouble,
  MapPin, FileText, Phone, Shield, Clipboard, AlertTriangle,
  Edit, Check, X, MessageCircle, Bell, RefreshCw, AlertCircle,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@shared/schema";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
    assignedNurseId: 5,
    fallRisk: "높음",
    fallRiskScore: 78,
    fallHistory: [
      {
        date: "2025-03-15",
        time: "14:23",
        location: "병실",
        severity: "경미",
        description: "침대에서 내려오다 균형을 잃음"
      },
      {
        date: "2025-03-22",
        time: "09:45",
        location: "화장실",
        severity: "중간",
        description: "화장실에서 미끄러짐"
      }
    ],
    vitalSigns: [
      {
        date: "2025-04-15 09:00",
        bloodPressure: "130/85",
        heartRate: 72,
        temperature: 36.5,
        respiratoryRate: 16
      },
      {
        date: "2025-04-14 17:30",
        bloodPressure: "135/82",
        heartRate: 75,
        temperature: 36.7,
        respiratoryRate: 18
      },
      {
        date: "2025-04-14 09:00",
        bloodPressure: "128/80",
        heartRate: 70,
        temperature: 36.4,
        respiratoryRate: 15
      }
    ],
    medications: [
      {
        name: "아스피린",
        dosage: "100mg",
        frequency: "1일 1회",
        timing: "아침 식후"
      },
      {
        name: "칼슘제",
        dosage: "500mg",
        frequency: "1일 2회",
        timing: "아침, 저녁 식후"
      },
      {
        name: "진통제",
        dosage: "50mg",
        frequency: "필요시",
        timing: "통증 시"
      }
    ],
    notes: [
      {
        date: "2025-04-14",
        author: "김간호사",
        content: "환자 보행 능력 향상 중. 물리치료 후 침대에서 화장실까지 자력으로 이동 가능함."
      },
      {
        date: "2025-04-12",
        author: "박의사",
        content: "X-ray 검사 결과 골유합 양호. 재활 프로그램 계속 진행."
      },
      {
        date: "2025-04-10",
        author: "이치료사",
        content: "재활 치료 시작. 기본적인 관절 움직임 연습 진행."
      }
    ]
  },
  2: {
    id: 2,
    name: "박환자",
    age: 72,
    gender: "여",
    birthDate: "1953-08-22",
    roomNumber: "102",
    bedNumber: 3,
    diagnosis: "뇌졸중",
    admissionDate: "2025-03-05",
    expectedDischargeDate: "2025-05-10",
    guardian: {
      name: "박보호자",
      relation: "배우자",
      contact: "010-2345-6789"
    },
    address: "서울시 서초구 반포동 456-78",
    contact: "010-8765-4321",
    condition: "회복 중",
    assignedNurseId: 6,
    fallRisk: "중간",
    fallRiskScore: 62,
    fallHistory: [
      {
        date: "2025-03-10",
        time: "22:15",
        location: "병실",
        severity: "경미",
        description: "화장실 가려다 어지러움 호소"
      }
    ],
    vitalSigns: [
      {
        date: "2025-04-15 09:30",
        bloodPressure: "142/88",
        heartRate: 78,
        temperature: 36.8,
        respiratoryRate: 17
      },
      {
        date: "2025-04-14 18:00",
        bloodPressure: "145/90",
        heartRate: 80,
        temperature: 36.9,
        respiratoryRate: 18
      }
    ],
    medications: [
      {
        name: "항혈전제",
        dosage: "75mg",
        frequency: "1일 1회",
        timing: "아침 식후"
      },
      {
        name: "혈압약",
        dosage: "5mg",
        frequency: "1일 2회",
        timing: "아침, 저녁 식후"
      }
    ],
    notes: [
      {
        date: "2025-04-14",
        author: "이간호사",
        content: "언어 치료 진행 중. 간단한 단어 발음 가능."
      },
      {
        date: "2025-04-11",
        author: "김의사",
        content: "MRI 결과 뇌 손상 부위 회복 중. 재활 치료 강화 필요."
      }
    ]
  }
};

export default function PatientDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // 권한 확인 (의사, 간호사, 병원장만 수정 가능)
  const canEdit = user?.role === UserRole.NURSE || user?.role === UserRole.DIRECTOR;
  
  // 환자 데이터 (실제 구현에서는 API에서 가져옴)
  const patient = PATIENT_DATA[parseInt(id || "1")];
  
  // 다이얼로그 상태
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editGuardianDialogOpen, setEditGuardianDialogOpen] = useState(false);
  const [editMedicationDialogOpen, setEditMedicationDialogOpen] = useState(false);
  const [editVitalSignsDialogOpen, setEditVitalSignsDialogOpen] = useState(false);
  const [editNotesDialogOpen, setEditNotesDialogOpen] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [fallDetectionDialogOpen, setFallDetectionDialogOpen] = useState(false);
  const [bedExitDialogOpen, setBedExitDialogOpen] = useState(false);
  const [environmentalDialogOpen, setEnvironmentalDialogOpen] = useState(false);
  const [guardianNotifyDialogOpen, setGuardianNotifyDialogOpen] = useState(false);
  
  // 폼 상태
  const [formData, setFormData] = useState({ ...patient });
  const [guardianData, setGuardianData] = useState({ ...patient.guardian });
  const [vitalSignsData, setVitalSignsData] = useState({ ...patient.vitalSigns[0] });
  const [notesData, setNotesData] = useState(patient.notes.length > 0 ? { ...patient.notes[0] } : { date: '', author: '', content: '' });
  const [messageText, setMessageText] = useState("");
  
  // 모니터링 설정 상태
  const [monitoringSettings, setMonitoringSettings] = useState({
    fallDetection: true,
    bedExit: true,
    environmental: true,
    guardianNotify: true
  });
  
  // 낙상 감지 설정
  const [fallDetectionSettings, setFallDetectionSettings] = useState({
    enabled: true,
    sensitivity: "medium", // low, medium, high
    delaySeconds: 3 // 알림까지 대기 시간
  });
  
  // 침대 이탈 설정
  const [bedExitSettings, setBedExitSettings] = useState({
    enabled: true,
    sensitivity: "medium", // low, medium, high
    delayMinutes: 5 // 몇 분 이상 침대를 벗어났을 때 알림
  });
  
  // 환경 모니터링 설정
  const [environmentalSettings, setEnvironmentalSettings] = useState({
    enabled: true,
    tempMin: 22, // 최소 온도 (섭씨)
    tempMax: 26, // 최대 온도 (섭씨)
    humidityMin: 40, // 최소 습도 (%)
    humidityMax: 60, // 최대 습도 (%)
    notifyChanges: true // 큰 변화가 있을 때 알림
  });
  
  // 보호자 알림 설정
  const [guardianNotifySettings, setGuardianNotifySettings] = useState({
    enabled: true,
    notifyFall: true, // 낙상 알림
    notifyBedExit: false, // 침대 이탈 알림
    notifyEnvironmental: false, // 환경 이상 알림
    notifyMedication: true // 약물 투여 알림
  });

  // 환자 정보 업데이트 처리
  const handleUpdatePatient = () => {
    // 실제 구현에서는 API 호출
    toast({
      title: "환자 정보 업데이트",
      description: "환자 정보가 성공적으로 업데이트되었습니다.",
    });
    setEditDialogOpen(false);
  };
  
  // 보호자 정보 업데이트 처리
  const handleUpdateGuardian = () => {
    // 실제 구현에서는 API 호출
    toast({
      title: "보호자 정보 업데이트",
      description: "보호자 정보가 성공적으로 업데이트되었습니다.",
    });
    setEditGuardianDialogOpen(false);
  };
  
  // 활력 징후 업데이트 처리
  const handleUpdateVitalSigns = () => {
    // 실제 구현에서는 API 호출
    toast({
      title: "활력 징후 업데이트",
      description: "활력 징후 정보가 성공적으로 업데이트되었습니다.",
    });
    setEditVitalSignsDialogOpen(false);
  };
  
  // 진료 기록 업데이트 처리
  const handleUpdateNotes = () => {
    // 실제 구현에서는 API 호출
    toast({
      title: "진료 기록 업데이트",
      description: "진료 기록이 성공적으로 업데이트되었습니다.",
    });
    setEditNotesDialogOpen(false);
  };
  
  // 메시지 전송 처리
  const handleSendMessage = () => {
    if (messageText.trim() === "") {
      toast({
        title: "오류",
        description: "메시지 내용을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    
    // 실제 구현에서는 API 호출
    toast({
      title: "메시지 전송 완료",
      description: "메시지가 성공적으로 전송되었습니다.",
    });
    setMessageText("");
    setMessageDialogOpen(false);
  };
  
  // 모니터링 설정 저장
  const handleSaveMonitoringSettings = (type: string) => {
    // 실제 구현에서는 API 호출하여 각 설정 저장
    let message = "";
    
    switch (type) {
      case 'fallDetection':
        setMonitoringSettings(prev => ({ ...prev, fallDetection: fallDetectionSettings.enabled }));
        message = "낙상 감지 설정이 저장되었습니다.";
        setFallDetectionDialogOpen(false);
        break;
      case 'bedExit':
        setMonitoringSettings(prev => ({ ...prev, bedExit: bedExitSettings.enabled }));
        message = "침대 이탈 감지 설정이 저장되었습니다.";
        setBedExitDialogOpen(false);
        break;
      case 'environmental':
        setMonitoringSettings(prev => ({ ...prev, environmental: environmentalSettings.enabled }));
        message = "환경 모니터링 설정이 저장되었습니다.";
        setEnvironmentalDialogOpen(false);
        break;
      case 'guardianNotify':
        setMonitoringSettings(prev => ({ ...prev, guardianNotify: guardianNotifySettings.enabled }));
        message = "보호자 알림 설정이 저장되었습니다.";
        setGuardianNotifyDialogOpen(false);
        break;
    }
    
    toast({
      title: "설정 저장 완료",
      description: message,
    });
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-1" 
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          돌아가기
        </Button>
      </div>
      
      <div className="flex flex-col space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>환자 정보</CardTitle>
                <CardDescription>환자의 기본 정보</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pb-12 relative">
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm font-medium mr-2">보호자:</span>
                    <span className="text-sm">{patient.guardian.name} ({patient.guardian.relation})</span>
                  </div>
                  {canEdit && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setEditGuardianDialogOpen(true)}
                      className="h-6 px-2"
                    >
                      <Edit className="h-3 w-3 mr-1" /> 수정
                    </Button>
                  )}
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm font-medium mr-2">보호자 연락처:</span>
                  <span className="text-sm">{patient.guardian.contact}</span>
                </div>
              </div>
              
              {canEdit && (
                <div className="absolute bottom-3 right-4">
                  <Button 
                    onClick={() => setEditDialogOpen(true)}
                    variant="outline" 
                    size="sm"
                    className="shadow-sm"
                  >
                    <Edit className="h-4 w-4 mr-1.5" />
                    환자 정보 수정
                  </Button>
                </div>
              )}
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
                      {patient.fallHistory.map((fall: any, index: number) => (
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
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>활력 징후</CardTitle>
                    <CardDescription>최근 활력 징후 기록</CardDescription>
                  </div>
                  {canEdit && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setEditVitalSignsDialogOpen(true)}
                      className="h-8"
                    >
                      <Edit className="h-4 w-4 mr-1" /> 수정
                    </Button>
                  )}
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
                        {patient.vitalSigns.map((vital: any, index: number) => (
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
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>투약 정보</CardTitle>
                    <CardDescription>현재 처방된 약물 정보</CardDescription>
                  </div>
                  {canEdit && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setEditMedicationDialogOpen(true)}
                      className="h-8"
                    >
                      <Edit className="h-4 w-4 mr-1" /> 수정
                    </Button>
                  )}
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
                        {patient.medications.map((med: any, index: number) => (
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
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>진료 기록</CardTitle>
                    <CardDescription>의료진 노트 및 관찰 사항</CardDescription>
                  </div>
                  {canEdit && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setEditNotesDialogOpen(true)}
                      className="h-8"
                    >
                      <Edit className="h-4 w-4 mr-1" /> 수정
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {patient.notes.map((note: any, index: number) => (
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
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>모니터링 설정</CardTitle>
                    <CardDescription>낙상 감지 및 환경 모니터링 설정</CardDescription>
                  </div>
                  {canEdit && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => toast({
                        title: "안내",
                        description: "각 모니터링 설정의 개별 '설정' 버튼을 눌러 수정하세요.",
                      })}
                      className="h-8"
                    >
                      <Settings className="h-4 w-4 mr-1" /> 설정 도움말
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-md border">
                      <div>
                        <h3 className="font-medium">낙상 감지 알림</h3>
                        <p className="text-sm text-gray-500">낙상 감지 시 알림을 설정합니다.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${monitoringSettings.fallDetection ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                          {monitoringSettings.fallDetection ? "활성화" : "비활성화"}
                        </span>
                        <Button size="sm" onClick={() => setFallDetectionDialogOpen(true)}>설정</Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-md border">
                      <div>
                        <h3 className="font-medium">침대 이탈 감지</h3>
                        <p className="text-sm text-gray-500">침대 이탈 시 알림을 설정합니다.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${monitoringSettings.bedExit ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                          {monitoringSettings.bedExit ? "활성화" : "비활성화"}
                        </span>
                        <Button size="sm" onClick={() => setBedExitDialogOpen(true)}>설정</Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-md border">
                      <div>
                        <h3 className="font-medium">환경 모니터링</h3>
                        <p className="text-sm text-gray-500">온도, 습도 등 환경 조건 알림을 설정합니다.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${monitoringSettings.environmental ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                          {monitoringSettings.environmental ? "활성화" : "비활성화"}
                        </span>
                        <Button size="sm" onClick={() => setEnvironmentalDialogOpen(true)}>설정</Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-md border">
                      <div>
                        <h3 className="font-medium">보호자 알림 설정</h3>
                        <p className="text-sm text-gray-500">보호자에게 특정 상황 발생 시 알림을 설정합니다.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${monitoringSettings.guardianNotify ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                          {monitoringSettings.guardianNotify ? "활성화" : "비활성화"}
                        </span>
                        <Button size="sm" onClick={() => setGuardianNotifyDialogOpen(true)}>설정</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* 환자 정보 수정 다이얼로그 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>환자 정보 수정</DialogTitle>
            <DialogDescription>환자 정보를 수정합니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="name" className="text-sm font-medium block mb-1">이름</label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label htmlFor="age" className="text-sm font-medium block mb-1">나이</label>
                <Input 
                  id="age" 
                  type="number" 
                  value={formData.age} 
                  onChange={(e) => setFormData({...formData, age: parseInt(e.target.value)})}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="diagnosis" className="text-sm font-medium block mb-1">진단명</label>
              <Input 
                id="diagnosis" 
                value={formData.diagnosis} 
                onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="roomNumber" className="text-sm font-medium block mb-1">병실 번호</label>
                <Input 
                  id="roomNumber" 
                  value={formData.roomNumber} 
                  onChange={(e) => setFormData({...formData, roomNumber: e.target.value})}
                />
              </div>
              <div>
                <label htmlFor="bedNumber" className="text-sm font-medium block mb-1">침대 번호</label>
                <Input 
                  id="bedNumber" 
                  type="number" 
                  value={formData.bedNumber} 
                  onChange={(e) => setFormData({...formData, bedNumber: parseInt(e.target.value)})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="admissionDate" className="text-sm font-medium block mb-1">입원일</label>
                <Input 
                  id="admissionDate" 
                  value={formData.admissionDate} 
                  onChange={(e) => setFormData({...formData, admissionDate: e.target.value})}
                />
              </div>
              <div>
                <label htmlFor="expectedDischargeDate" className="text-sm font-medium block mb-1">퇴원 예정일</label>
                <Input 
                  id="expectedDischargeDate" 
                  value={formData.expectedDischargeDate} 
                  onChange={(e) => setFormData({...formData, expectedDischargeDate: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="contact" className="text-sm font-medium block mb-1">연락처</label>
              <Input 
                id="contact" 
                value={formData.contact} 
                onChange={(e) => setFormData({...formData, contact: e.target.value})}
              />
            </div>
            
            <div>
              <label htmlFor="address" className="text-sm font-medium block mb-1">주소</label>
              <Input 
                id="address" 
                value={formData.address} 
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>취소</Button>
            <Button onClick={handleUpdatePatient}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 보호자 정보 수정 다이얼로그 */}
      <Dialog open={editGuardianDialogOpen} onOpenChange={setEditGuardianDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>보호자 정보 수정</DialogTitle>
            <DialogDescription>보호자 정보를 수정합니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="guardianName" className="text-sm font-medium block mb-1">이름</label>
                <Input 
                  id="guardianName" 
                  value={guardianData.name} 
                  onChange={(e) => setGuardianData({...guardianData, name: e.target.value})}
                />
              </div>
              <div>
                <label htmlFor="relation" className="text-sm font-medium block mb-1">관계</label>
                <Input 
                  id="relation" 
                  value={guardianData.relation} 
                  onChange={(e) => setGuardianData({...guardianData, relation: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="guardianContact" className="text-sm font-medium block mb-1">연락처</label>
              <Input 
                id="guardianContact" 
                value={guardianData.contact} 
                onChange={(e) => setGuardianData({...guardianData, contact: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditGuardianDialogOpen(false)}>취소</Button>
            <Button onClick={handleUpdateGuardian}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 낙상 감지 설정 다이얼로그 */}
      <Dialog open={fallDetectionDialogOpen} onOpenChange={setFallDetectionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>낙상 감지 설정</DialogTitle>
            <DialogDescription>낙상 감지 기능을 설정합니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-medium">낙상 감지 활성화</h3>
                <p className="text-sm text-gray-500">낙상이 감지되면 즉시 알림을 받습니다.</p>
              </div>
              <Switch 
                checked={fallDetectionSettings.enabled}
                onCheckedChange={(checked) => 
                  setFallDetectionSettings(prev => ({...prev, enabled: checked}))
                }
              />
            </div>
            
            {fallDetectionSettings.enabled && (
              <>
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="font-medium">감지 민감도</h3>
                    <p className="text-sm text-gray-500">민감도가 높을수록 가벼운 움직임도 감지합니다.</p>
                  </div>
                  <Select 
                    defaultValue={fallDetectionSettings.sensitivity}
                    onValueChange={(value) => 
                      setFallDetectionSettings(prev => ({...prev, sensitivity: value}))
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="민감도 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">낮음</SelectItem>
                      <SelectItem value="medium">중간</SelectItem>
                      <SelectItem value="high">높음</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">알림 지연 시간</h3>
                    <p className="text-sm text-gray-500">낙상 감지 후 알림을 보낼때까지의 지연 시간입니다.</p>
                  </div>
                  <Select 
                    defaultValue={fallDetectionSettings.delaySeconds.toString()}
                    onValueChange={(value) => 
                      setFallDetectionSettings(prev => ({...prev, delaySeconds: Number(value)}))
                    }
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="시간 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">즉시</SelectItem>
                      <SelectItem value="3">3초</SelectItem>
                      <SelectItem value="5">5초</SelectItem>
                      <SelectItem value="10">10초</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFallDetectionDialogOpen(false)}>취소</Button>
            <Button onClick={() => handleSaveMonitoringSettings('fallDetection')}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 침대 이탈 감지 설정 다이얼로그 */}
      <Dialog open={bedExitDialogOpen} onOpenChange={setBedExitDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>침대 이탈 감지 설정</DialogTitle>
            <DialogDescription>침대 이탈 감지 기능을 설정합니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-medium">침대 이탈 감지 활성화</h3>
                <p className="text-sm text-gray-500">환자가 일정 시간 이상 침대를 이탈하면 알림을 받습니다.</p>
              </div>
              <Switch 
                checked={bedExitSettings.enabled}
                onCheckedChange={(checked) => 
                  setBedExitSettings(prev => ({...prev, enabled: checked}))
                }
              />
            </div>
            
            {bedExitSettings.enabled && (
              <>
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="font-medium">감지 민감도</h3>
                    <p className="text-sm text-gray-500">민감도에 따라 감지 정확도가 달라집니다.</p>
                  </div>
                  <Select 
                    defaultValue={bedExitSettings.sensitivity}
                    onValueChange={(value) => 
                      setBedExitSettings(prev => ({...prev, sensitivity: value}))
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="민감도 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">낮음</SelectItem>
                      <SelectItem value="medium">중간</SelectItem>
                      <SelectItem value="high">높음</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="font-medium">감지 시간 설정</h3>
                    <p className="text-sm text-gray-500">몇 분 이상 이탈 시 알림을 보낼지 설정합니다.</p>
                  </div>
                  <Select 
                    defaultValue={bedExitSettings.delayMinutes.toString()}
                    onValueChange={(value) => 
                      setBedExitSettings(prev => ({...prev, delayMinutes: Number(value)}))
                    }
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="시간 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1분</SelectItem>
                      <SelectItem value="3">3분</SelectItem>
                      <SelectItem value="5">5분</SelectItem>
                      <SelectItem value="10">10분</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBedExitDialogOpen(false)}>취소</Button>
            <Button onClick={() => handleSaveMonitoringSettings('bedExit')}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 환경 모니터링 설정 다이얼로그 */}
      <Dialog open={environmentalDialogOpen} onOpenChange={setEnvironmentalDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>환경 모니터링 설정</DialogTitle>
            <DialogDescription>실내 환경 모니터링 설정을 구성합니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-medium">환경 모니터링 활성화</h3>
                <p className="text-sm text-gray-500">환경 조건이 설정값을 벗어날 경우 알림을 받습니다.</p>
              </div>
              <Switch 
                checked={environmentalSettings.enabled}
                onCheckedChange={(checked) => 
                  setEnvironmentalSettings(prev => ({...prev, enabled: checked}))
                }
              />
            </div>
            
            {environmentalSettings.enabled && (
              <div className="space-y-4">
                <div className="border-b pb-3">
                  <h3 className="font-medium mb-2">온도 범위 설정 (°C)</h3>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="grid grid-cols-2 gap-3 w-full">
                      <div>
                        <label htmlFor="tempMin" className="text-xs text-gray-500 mb-1 block">최소</label>
                        <Input
                          id="tempMin"
                          type="number"
                          value={environmentalSettings.tempMin}
                          onChange={(e) => 
                            setEnvironmentalSettings(prev => ({
                              ...prev, 
                              tempMin: Number(e.target.value)
                            }))
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label htmlFor="tempMax" className="text-xs text-gray-500 mb-1 block">최대</label>
                        <Input
                          id="tempMax"
                          type="number"
                          value={environmentalSettings.tempMax}
                          onChange={(e) => 
                            setEnvironmentalSettings(prev => ({
                              ...prev, 
                              tempMax: Number(e.target.value)
                            }))
                          }
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-b pb-3">
                  <h3 className="font-medium mb-2">습도 범위 설정 (%)</h3>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="grid grid-cols-2 gap-3 w-full">
                      <div>
                        <label htmlFor="humidityMin" className="text-xs text-gray-500 mb-1 block">최소</label>
                        <Input
                          id="humidityMin"
                          type="number"
                          value={environmentalSettings.humidityMin}
                          onChange={(e) => 
                            setEnvironmentalSettings(prev => ({
                              ...prev, 
                              humidityMin: Number(e.target.value)
                            }))
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label htmlFor="humidityMax" className="text-xs text-gray-500 mb-1 block">최대</label>
                        <Input
                          id="humidityMax"
                          type="number"
                          value={environmentalSettings.humidityMax}
                          onChange={(e) => 
                            setEnvironmentalSettings(prev => ({
                              ...prev, 
                              humidityMax: Number(e.target.value)
                            }))
                          }
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">급격한 변화 알림</h3>
                    <p className="text-sm text-gray-500">환경 조건이 급격히 변할 때 알림을 받습니다.</p>
                  </div>
                  <Switch 
                    checked={environmentalSettings.notifyChanges}
                    onCheckedChange={(checked) => 
                      setEnvironmentalSettings(prev => ({...prev, notifyChanges: checked}))
                    }
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEnvironmentalDialogOpen(false)}>취소</Button>
            <Button onClick={() => handleSaveMonitoringSettings('environmental')}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 보호자 알림 설정 다이얼로그 */}
      <Dialog open={guardianNotifyDialogOpen} onOpenChange={setGuardianNotifyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>보호자 알림 설정</DialogTitle>
            <DialogDescription>보호자에게 보낼 알림을 설정합니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-medium">보호자 알림 활성화</h3>
                <p className="text-sm text-gray-500">보호자에게 알림 전송 기능을 활성화합니다.</p>
              </div>
              <Switch 
                checked={guardianNotifySettings.enabled}
                onCheckedChange={(checked) => 
                  setGuardianNotifySettings(prev => ({...prev, enabled: checked}))
                }
              />
            </div>
            
            {guardianNotifySettings.enabled && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">낙상 알림</h3>
                    <p className="text-sm text-gray-500">낙상 감지 시 보호자에게 알림을 보냅니다.</p>
                  </div>
                  <Switch 
                    checked={guardianNotifySettings.notifyFall}
                    onCheckedChange={(checked) => 
                      setGuardianNotifySettings(prev => ({...prev, notifyFall: checked}))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">침대 이탈 알림</h3>
                    <p className="text-sm text-gray-500">침대 이탈 감지 시 보호자에게 알림을 보냅니다.</p>
                  </div>
                  <Switch 
                    checked={guardianNotifySettings.notifyBedExit}
                    onCheckedChange={(checked) => 
                      setGuardianNotifySettings(prev => ({...prev, notifyBedExit: checked}))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">환경 이상 알림</h3>
                    <p className="text-sm text-gray-500">병실 환경에 이상이 감지되면 보호자에게 알림을 보냅니다.</p>
                  </div>
                  <Switch 
                    checked={guardianNotifySettings.notifyEnvironmental}
                    onCheckedChange={(checked) => 
                      setGuardianNotifySettings(prev => ({...prev, notifyEnvironmental: checked}))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">약물 투여 알림</h3>
                    <p className="text-sm text-gray-500">약물 투여 시 보호자에게 알림을 보냅니다.</p>
                  </div>
                  <Switch 
                    checked={guardianNotifySettings.notifyMedication}
                    onCheckedChange={(checked) => 
                      setGuardianNotifySettings(prev => ({...prev, notifyMedication: checked}))
                    }
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGuardianNotifyDialogOpen(false)}>취소</Button>
            <Button onClick={() => handleSaveMonitoringSettings('guardianNotify')}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 메시지 보내기 다이얼로그 */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>메시지 보내기</DialogTitle>
            <DialogDescription>담당 의료진 또는 보호자에게 메시지를 보냅니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <label htmlFor="recipient" className="text-sm font-medium block mb-1">수신자</label>
              <Select defaultValue="nurse">
                <SelectTrigger>
                  <SelectValue placeholder="수신자 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nurse">담당 간호사</SelectItem>
                  <SelectItem value="guardian">보호자</SelectItem>
                  <SelectItem value="doctor">담당 의사</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label htmlFor="message" className="text-sm font-medium block mb-1">메시지 내용</label>
              <Textarea 
                id="message" 
                placeholder="메시지를 입력하세요..." 
                className="min-h-[120px]"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageDialogOpen(false)}>취소</Button>
            <Button onClick={handleSendMessage}>보내기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 약물 정보 수정 다이얼로그 - 여기에 약물 정보 편집 UI 추가 */}
      <Dialog open={editMedicationDialogOpen} onOpenChange={setEditMedicationDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>투약 정보 수정</DialogTitle>
            <DialogDescription>환자의 약물 투여 정보를 수정합니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">약품명</th>
                    <th className="text-left p-2">용량</th>
                    <th className="text-left p-2">빈도</th>
                    <th className="text-left p-2">시간</th>
                    <th className="text-left p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {patient.medications.map((med: any, index: number) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">
                        <Input 
                          value={med.name}
                          className="w-full min-w-[120px]"
                        />
                      </td>
                      <td className="p-2">
                        <Input 
                          value={med.dosage}
                          className="w-full min-w-[80px]"
                        />
                      </td>
                      <td className="p-2">
                        <Input 
                          value={med.frequency}
                          className="w-full min-w-[80px]"
                        />
                      </td>
                      <td className="p-2">
                        <Input 
                          value={med.timing}
                          className="w-full min-w-[80px]"
                        />
                      </td>
                      <td className="p-2">
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button variant="outline" size="sm" className="mt-2">
              <Plus className="h-4 w-4 mr-1" /> 약물 추가
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMedicationDialogOpen(false)}>취소</Button>
            <Button onClick={() => {
              toast({
                title: "투약 정보 업데이트",
                description: "투약 정보가 성공적으로 업데이트되었습니다.",
              });
              setEditMedicationDialogOpen(false);
            }}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 활력 징후 수정 다이얼로그 */}
      <Dialog open={editVitalSignsDialogOpen} onOpenChange={setEditVitalSignsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>활력 징후 수정</DialogTitle>
            <DialogDescription>환자의 활력 징후 기록을 수정합니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">날짜</th>
                    <th className="text-left p-2">혈압</th>
                    <th className="text-left p-2">심박수</th>
                    <th className="text-left p-2">체온</th>
                    <th className="text-left p-2">호흡수</th>
                    <th className="text-left p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {patient.vitalSigns.map((vital: any, index: number) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">
                        <Input 
                          value={vital.date}
                          className="w-full min-w-[80px]"
                        />
                      </td>
                      <td className="p-2">
                        <Input 
                          value={vital.bloodPressure}
                          className="w-full min-w-[80px]"
                        />
                      </td>
                      <td className="p-2">
                        <Input 
                          value={vital.heartRate}
                          type="number"
                          className="w-full min-w-[60px]"
                        />
                      </td>
                      <td className="p-2">
                        <Input 
                          value={vital.temperature}
                          type="number"
                          step="0.1"
                          className="w-full min-w-[60px]"
                        />
                      </td>
                      <td className="p-2">
                        <Input 
                          value={vital.respiratoryRate}
                          type="number"
                          className="w-full min-w-[60px]"
                        />
                      </td>
                      <td className="p-2">
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button variant="outline" size="sm" className="mt-2">
              <Plus className="h-4 w-4 mr-1" /> 기록 추가
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditVitalSignsDialogOpen(false)}>취소</Button>
            <Button onClick={handleUpdateVitalSigns}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 진료 기록 수정 다이얼로그 */}
      <Dialog open={editNotesDialogOpen} onOpenChange={setEditNotesDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>진료 기록 수정</DialogTitle>
            <DialogDescription>의료진 노트 및 관찰 사항을 수정합니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-4">
              {patient.notes.map((note: any, index: number) => (
                <div key={index} className="p-3 rounded-md border">
                  <div className="flex justify-between items-center mb-2">
                    <div className="grid grid-cols-2 gap-2 w-full">
                      <div>
                        <label className="text-xs text-gray-500">날짜</label>
                        <Input 
                          value={note.date}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">작성자</label>
                        <Input 
                          value={note.author}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="ml-2 mt-4">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-2">
                    <label className="text-xs text-gray-500">내용</label>
                    <Textarea 
                      value={note.content}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-2">
              <Plus className="h-4 w-4 mr-1" /> 기록 추가
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditNotesDialogOpen(false)}>취소</Button>
            <Button onClick={handleUpdateNotes}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}