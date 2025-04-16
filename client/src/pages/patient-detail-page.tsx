import { useParams } from "wouter";
import { 
  ArrowLeft, HeartPulse, User, CalendarClock, Users, BedDouble,
  MapPin, FileText, Phone, Shield, Clipboard, AlertTriangle,
  Edit, Check, X, MessageCircle, Bell, RefreshCw, AlertCircle,
  Settings, Trash2, Plus
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

// 타입 정의를 추가하여 인덱스 시그니처 처리
interface PatientDetails {
  id: number;
  name: string;
  age: number;
  gender: string;
  birthDate: string;
  roomNumber: string;
  bedNumber: number;
  diagnosis: string;
  admissionDate: string;
  expectedDischargeDate: string;
  guardian: {
    name: string;
    relation: string;
    contact: string;
  };
  address: string;
  contact: string;
  condition: string;
  assignedNurseId: number;
  fallRisk: string;
  fallRiskScore: number;
  fallHistory: Array<{
    date: string;
    time: string;
    location: string;
    severity: string;
    description: string;
  }>;
  vitalSigns: Array<{
    date: string;
    bloodPressure: string;
    heartRate: number;
    temperature: number;
    respiratoryRate: number;
  }>;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    timing: string;
  }>;
  notes: Array<{
    date: string;
    author: string;
    content: string;
  }>;
}

// 인덱스 시그니처로 숫자 키 허용
interface PatientDataMap {
  [key: number]: PatientDetails;
}

// 임시 환자 상세 데이터
const PATIENT_DATA: PatientDataMap = {
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
  },
  3: {
    id: 3,
    name: "이환자",
    age: 78,
    gender: "남",
    birthDate: "1947-06-12",
    roomNumber: "101",
    bedNumber: 2,
    diagnosis: "알츠하이머병",
    admissionDate: "2025-02-20",
    expectedDischargeDate: "2025-05-20",
    guardian: {
      name: "이보호자",
      relation: "자녀",
      contact: "010-3456-7890"
    },
    address: "서울시 마포구 합정동 789-12",
    contact: "010-7654-3210",
    condition: "주의",
    assignedNurseId: 5,
    fallRisk: "높음",
    fallRiskScore: 85,
    fallHistory: [
      {
        date: "2025-03-01",
        time: "03:15",
        location: "병실",
        severity: "중간",
        description: "야간에 일어나 방황하다 넘어짐"
      },
      {
        date: "2025-02-25",
        time: "14:20",
        location: "복도",
        severity: "경미",
        description: "복도 걷다가 균형 잃음"
      }
    ],
    vitalSigns: [
      {
        date: "2025-04-15 10:00",
        bloodPressure: "138/82",
        heartRate: 68,
        temperature: 36.6,
        respiratoryRate: 16
      },
      {
        date: "2025-04-14 10:30",
        bloodPressure: "140/85",
        heartRate: 70,
        temperature: 36.5,
        respiratoryRate: 15
      }
    ],
    medications: [
      {
        name: "도네페질",
        dosage: "10mg",
        frequency: "1일 1회",
        timing: "아침 식후"
      },
      {
        name: "수면제",
        dosage: "5mg",
        frequency: "1일 1회",
        timing: "취침 전"
      }
    ],
    notes: [
      {
        date: "2025-04-13",
        author: "박간호사",
        content: "야간 배회 증상 계속됨. 침대 센서 설치 제안함."
      },
      {
        date: "2025-04-05",
        author: "정의사",
        content: "인지기능 평가 실시. 약간의 호전 보임."
      }
    ]
  },
  4: {
    id: 4,
    name: "최환자",
    age: 68,
    gender: "남",
    birthDate: "1957-04-23",
    roomNumber: "102",
    bedNumber: 2,
    diagnosis: "파킨슨병",
    admissionDate: "2025-03-15",
    expectedDischargeDate: "2025-04-30",
    guardian: {
      name: "최보호자",
      relation: "배우자",
      contact: "010-4567-8901"
    },
    address: "서울시 강서구 등촌동 345-67",
    contact: "010-6543-2109",
    condition: "양호",
    assignedNurseId: 6,
    fallRisk: "중간",
    fallRiskScore: 60,
    fallHistory: [
      {
        date: "2025-03-18",
        time: "16:30",
        location: "병실",
        severity: "경미",
        description: "침대에서 내려오다 떨림 증상으로 균형 상실"
      }
    ],
    vitalSigns: [
      {
        date: "2025-04-15 11:00",
        bloodPressure: "125/78",
        heartRate: 72,
        temperature: 36.4,
        respiratoryRate: 16
      },
      {
        date: "2025-04-14 11:30",
        bloodPressure: "130/80",
        heartRate: 75,
        temperature: 36.5,
        respiratoryRate: 17
      }
    ],
    medications: [
      {
        name: "레보도파",
        dosage: "100mg",
        frequency: "1일 3회",
        timing: "식사와 함께"
      },
      {
        name: "아만타딘",
        dosage: "100mg",
        frequency: "1일 2회",
        timing: "아침, 저녁 식후"
      }
    ],
    notes: [
      {
        date: "2025-04-12",
        author: "김간호사",
        content: "떨림 증상 약간 감소. 보행훈련 진행 중."
      },
      {
        date: "2025-04-08",
        author: "이의사",
        content: "약물 효과 확인. 용량 유지 결정."
      }
    ]
  },
  5: {
    id: 5,
    name: "정환자",
    age: 81,
    gender: "여",
    birthDate: "1944-02-15",
    roomNumber: "102",
    bedNumber: 3,
    diagnosis: "척추압박골절",
    admissionDate: "2025-04-01",
    expectedDischargeDate: "2025-05-15",
    guardian: {
      name: "정보호자",
      relation: "자녀",
      contact: "010-5678-9012"
    },
    address: "서울시 송파구 잠실동 234-56",
    contact: "010-5432-1098",
    condition: "안정",
    assignedNurseId: 7,
    fallRisk: "높음",
    fallRiskScore: 75,
    fallHistory: [
      {
        date: "2025-04-05",
        time: "08:45",
        location: "화장실",
        severity: "심각",
        description: "화장실에서 미끄러져 넘어짐"
      }
    ],
    vitalSigns: [
      {
        date: "2025-04-15 14:00",
        bloodPressure: "145/85",
        heartRate: 68,
        temperature: 36.7,
        respiratoryRate: 18
      },
      {
        date: "2025-04-14 14:30",
        bloodPressure: "148/88",
        heartRate: 70,
        temperature: 36.6,
        respiratoryRate: 17
      }
    ],
    medications: [
      {
        name: "진통제",
        dosage: "50mg",
        frequency: "1일 3회",
        timing: "식후"
      },
      {
        name: "칼슘제",
        dosage: "500mg",
        frequency: "1일 2회",
        timing: "아침, 저녁 식후"
      },
      {
        name: "비타민D",
        dosage: "1000IU",
        frequency: "1일 1회",
        timing: "아침 식후"
      }
    ],
    notes: [
      {
        date: "2025-04-14",
        author: "최간호사",
        content: "통증 호소 감소. 보행기 사용하여 짧은 거리 이동 가능."
      },
      {
        date: "2025-04-10",
        author: "박의사",
        content: "X-ray 검사 결과 골절 부위 안정적. 물리치료 시작 권장."
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
  const patientId = parseInt(id || "1");
  
  // 데이터 존재 여부 체크 (없을 경우 기본 데이터 사용)
  const patientExists = Object.keys(PATIENT_DATA).includes(patientId.toString());
  const patient = patientExists ? PATIENT_DATA[patientId] : PATIENT_DATA[1];
  
  console.log("환자 상세 페이지 - 요청된 환자 ID:", patientId, "데이터 존재:", patientExists);
  
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
    
    toast({
      title: "설정 저장 완료",
      description: message,
    });
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      {/* 상단 헤더 섹션 */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center mb-4 md:mb-0">
          <Button 
            variant="outline" 
            size="sm" 
            className="mr-4" 
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            돌아가기
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{patient.name} 환자</h1>
            <p className="text-muted-foreground">
              {patient.age}세 · {patient.gender} · {patient.diagnosis} · {patient.roomNumber}호 {patient.bedNumber}번 침대
            </p>
          </div>
        </div>
        
        {/* 상단 액션 버튼 */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setMessageDialogOpen(true)}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            메시지 보내기
          </Button>
          {canEdit && (
            <Button 
              variant="default" 
              size="sm"
              onClick={() => setEditDialogOpen(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              환자 정보 수정
            </Button>
          )}
        </div>
      </div>
      
      {/* 주요 정보 요약 - 상태 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <Card className={`border-l-4 ${
          patient.condition === "안정" ? "border-l-green-500" : 
          patient.condition === "주의" ? "border-l-yellow-500" : 
          "border-l-red-500"
        }`}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">현재 상태</p>
              <p className="text-lg font-bold">{patient.condition}</p>
            </div>
            <div className={`p-2 rounded-full ${
              patient.condition === "안정" ? "bg-green-100" : 
              patient.condition === "주의" ? "bg-yellow-100" : 
              "bg-red-100"
            }`}>
              <HeartPulse className={`h-5 w-5 ${
                patient.condition === "안정" ? "text-green-600" : 
                patient.condition === "주의" ? "text-yellow-600" : 
                "text-red-600"
              }`} />
            </div>
          </CardContent>
        </Card>
        
        <Card className={`border-l-4 ${
          patient.fallRisk === "낮음" ? "border-l-green-500" : 
          patient.fallRisk === "중간" ? "border-l-yellow-500" : 
          "border-l-red-500"
        }`}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">낙상 위험도</p>
              <div className="flex items-center">
                <p className="text-lg font-bold mr-2">{patient.fallRisk}</p>
                <span className="text-sm text-muted-foreground">({patient.fallRiskScore}/100)</span>
              </div>
            </div>
            <div className={`p-2 rounded-full ${
              patient.fallRisk === "낮음" ? "bg-green-100" : 
              patient.fallRisk === "중간" ? "bg-yellow-100" : 
              "bg-red-100"
            }`}>
              <AlertTriangle className={`h-5 w-5 ${
                patient.fallRisk === "낮음" ? "text-green-600" : 
                patient.fallRisk === "중간" ? "text-yellow-600" : 
                "text-red-600"
              }`} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">입원 일수</p>
              <p className="text-lg font-bold">
                {Math.floor((new Date().getTime() - new Date(patient.admissionDate).getTime()) / (1000 * 60 * 60 * 24))}일
              </p>
            </div>
            <div className="p-2 rounded-full bg-blue-100">
              <CalendarClock className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">낙상 기록</p>
              <p className="text-lg font-bold">{patient.fallHistory.length}건</p>
            </div>
            <div className="p-2 rounded-full bg-purple-100">
              <AlertCircle className="h-5 w-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 메인 콘텐츠 영역 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 좌측 열 - 환자/보호자 정보 */}
        <div className="md:col-span-1">
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>환자 정보</CardTitle>
                {canEdit && (
                  <Button 
                    onClick={() => setEditDialogOpen(true)}
                    variant="ghost" 
                    size="sm"
                    className="h-8"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-muted-foreground">생년월일</dt>
                  <dd className="text-sm font-medium">{patient.birthDate}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-muted-foreground">연락처</dt>
                  <dd className="text-sm font-medium">{patient.contact}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-muted-foreground">주소</dt>
                  <dd className="text-sm font-medium text-right">{patient.address}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-muted-foreground">입원일</dt>
                  <dd className="text-sm font-medium">{patient.admissionDate}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-muted-foreground">퇴원 예정일</dt>
                  <dd className="text-sm font-medium">{patient.expectedDischargeDate}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>보호자 정보</CardTitle>
                {canEdit && (
                  <Button 
                    onClick={() => setEditGuardianDialogOpen(true)}
                    variant="ghost" 
                    size="sm"
                    className="h-8"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-muted-foreground">이름</dt>
                  <dd className="text-sm font-medium">{patient.guardian.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-muted-foreground">관계</dt>
                  <dd className="text-sm font-medium">{patient.guardian.relation}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-muted-foreground">연락처</dt>
                  <dd className="text-sm font-medium">{patient.guardian.contact}</dd>
                </div>
              </dl>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-4"
                onClick={() => setMessageDialogOpen(true)}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                보호자에게 연락하기
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* 우측 영역 - 탭 포함 */}
        <div className="md:col-span-2">
          <Tabs defaultValue="vital" className="w-full">
            <TabsList className="grid grid-cols-5 mb-6">
              <TabsTrigger value="vital">
                <HeartPulse className="h-4 w-4 mr-2" />
                <span>활력 징후</span>
              </TabsTrigger>
              <TabsTrigger value="medication">
                <Clipboard className="h-4 w-4 mr-2" />
                <span>투약 정보</span>
              </TabsTrigger>
              <TabsTrigger value="fall">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <span>낙상 기록</span>
              </TabsTrigger>
              <TabsTrigger value="notes">
                <FileText className="h-4 w-4 mr-2" />
                <span>진료 기록</span>
              </TabsTrigger>
              <TabsTrigger value="monitoring">
                <Settings className="h-4 w-4 mr-2" />
                <span>모니터링</span>
              </TabsTrigger>
            </TabsList>
            
            {/* 활력 징후 탭 */}
            <TabsContent value="vital">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle>활력 징후</CardTitle>
                    <CardDescription>최근 측정된 활력 징후 기록</CardDescription>
                  </div>
                  {canEdit && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setEditVitalSignsDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      추가
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {patient.vitalSigns.length > 0 ? (
                    <div className="rounded-md border overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">측정일시</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">혈압</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">심박수</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">체온</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">호흡수</th>
                          </tr>
                        </thead>
                        <tbody>
                          {patient.vitalSigns.map((vital: any, index: number) => (
                            <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-muted/20"}>
                              <td className="p-3 text-sm">{vital.date}</td>
                              <td className="p-3 text-sm font-medium">{vital.bloodPressure}</td>
                              <td className="p-3 text-sm">{vital.heartRate} BPM</td>
                              <td className="p-3 text-sm">{vital.temperature}°C</td>
                              <td className="p-3 text-sm">{vital.respiratoryRate}/분</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      기록된 활력 징후가 없습니다.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* 투약 정보 탭 */}
            <TabsContent value="medication">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle>투약 정보</CardTitle>
                    <CardDescription>현재 투약 중인 약물 목록</CardDescription>
                  </div>
                  {canEdit && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setEditMedicationDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      추가
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {patient.medications.map((medication: any, index: number) => (
                      <Card key={index} className="overflow-hidden">
                        <div className="flex p-4">
                          <div className="mr-4 bg-primary/10 rounded-full p-2 self-start">
                            <Clipboard className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{medication.name} ({medication.dosage})</h4>
                            <p className="text-sm text-muted-foreground">{medication.frequency} · {medication.timing}</p>
                          </div>
                          {canEdit && (
                            <Button variant="ghost" size="sm" className="self-start">
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* 낙상 기록 탭 */}
            <TabsContent value="fall">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>낙상 기록</CardTitle>
                      <CardDescription>환자의 낙상 위험도 및 과거 기록</CardDescription>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      patient.fallRisk === "높음" ? "bg-red-100 text-red-800" : 
                      patient.fallRisk === "중간" ? "bg-yellow-100 text-yellow-800" : 
                      "bg-green-100 text-green-800"
                    }`}>
                      위험도: {patient.fallRisk}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">위험도 점수: {patient.fallRiskScore}/100</span>
                    </div>
                    <Progress value={patient.fallRiskScore} className="h-3 rounded-full" />
                  </div>
                  
                  <h4 className="text-sm font-semibold mb-3 mt-6">낙상 기록</h4>
                  <div className="space-y-4">
                    {patient.fallHistory.length > 0 ? (
                      patient.fallHistory.map((fall: any, index: number) => (
                        <Card key={index} className="overflow-hidden">
                          <div className="bg-muted/20 px-4 py-2 flex justify-between items-center">
                            <div className="flex items-center">
                              <CalendarClock className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span className="text-sm font-medium">{fall.date} {fall.time}</span>
                            </div>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              fall.severity === "중간" ? "bg-yellow-100 text-yellow-800" : 
                              fall.severity === "심각" ? "bg-red-100 text-red-800" :
                              "bg-blue-100 text-blue-800"
                            }`}>
                              {fall.severity}
                            </span>
                          </div>
                          <div className="p-4">
                            <div className="flex items-center mb-1">
                              <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                              <span className="text-sm font-medium">{fall.location}</span>
                            </div>
                            <p className="text-sm">{fall.description}</p>
                          </div>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        낙상 기록이 없습니다.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* 진료 기록 탭 */}
            <TabsContent value="notes">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle>진료 기록</CardTitle>
                    <CardDescription>의료진 기록 및 메모</CardDescription>
                  </div>
                  {canEdit && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setEditNotesDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      추가
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {patient.notes.map((note: any, index: number) => (
                      <Card key={index} className="overflow-hidden border-l-4 border-l-primary">
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-semibold">{note.date}</div>
                            <div className="text-sm px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                              {note.author}
                            </div>
                          </div>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{note.content}</p>
                        </div>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* 모니터링 설정 탭 */}
            <TabsContent value="monitoring">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>모니터링 설정</CardTitle>
                  <CardDescription>환자 모니터링 및 알림 설정</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="p-4 border-l-4 border-l-red-500">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center">
                            <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
                            <h4 className="font-semibold">낙상 감지</h4>
                          </div>
                          <Switch 
                            checked={monitoringSettings.fallDetection} 
                            onCheckedChange={() => {}} 
                          />
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          AI 비전을 통한 실시간 낙상 감지 및 즉시 알림 기능
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full" 
                          onClick={() => setFallDetectionDialogOpen(true)}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          설정
                        </Button>
                      </Card>
                      
                      <Card className="p-4 border-l-4 border-l-amber-500">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center">
                            <BedDouble className="h-5 w-5 mr-2 text-amber-500" />
                            <h4 className="font-semibold">침대 이탈 감지</h4>
                          </div>
                          <Switch 
                            checked={monitoringSettings.bedExit} 
                            onCheckedChange={() => {}} 
                          />
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          침대 센서를 통한 장시간 침대 이탈 감지 및 알림
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => setBedExitDialogOpen(true)}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          설정
                        </Button>
                      </Card>
                      
                      <Card className="p-4 border-l-4 border-l-blue-500">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center">
                            <RefreshCw className="h-5 w-5 mr-2 text-blue-500" />
                            <h4 className="font-semibold">환경 모니터링</h4>
                          </div>
                          <Switch 
                            checked={monitoringSettings.environmental} 
                            onCheckedChange={() => {}} 
                          />
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          병실 온도, 습도 등 환경 모니터링 및 적정 범위 이탈 시 알림
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => setEnvironmentalDialogOpen(true)}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          설정
                        </Button>
                      </Card>
                      
                      <Card className="p-4 border-l-4 border-l-green-500">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center">
                            <Bell className="h-5 w-5 mr-2 text-green-500" />
                            <h4 className="font-semibold">보호자 알림</h4>
                          </div>
                          <Switch 
                            checked={monitoringSettings.guardianNotify} 
                            onCheckedChange={() => {}} 
                          />
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          이상 상황 발생 시 보호자에게 문자/앱 알림 전송
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => setGuardianNotifyDialogOpen(true)}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          설정
                        </Button>
                      </Card>
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
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right text-sm">이름</label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="age" className="text-right text-sm">나이</label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({...formData, age: parseInt(e.target.value)})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="gender" className="text-right text-sm">성별</label>
              <Select 
                value={formData.gender} 
                onValueChange={(value) => setFormData({...formData, gender: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="성별 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="남">남</SelectItem>
                  <SelectItem value="여">여</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="birthDate" className="text-right text-sm">생년월일</label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="diagnosis" className="text-right text-sm">진단명</label>
              <Input
                id="diagnosis"
                value={formData.diagnosis}
                onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="contact" className="text-right text-sm">연락처</label>
              <Input
                id="contact"
                value={formData.contact}
                onChange={(e) => setFormData({...formData, contact: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="address" className="text-right text-sm">주소</label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="col-span-3"
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
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="guardianName" className="text-right text-sm">이름</label>
              <Input
                id="guardianName"
                value={guardianData.name}
                onChange={(e) => setGuardianData({...guardianData, name: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="relation" className="text-right text-sm">관계</label>
              <Select 
                value={guardianData.relation} 
                onValueChange={(value) => setGuardianData({...guardianData, relation: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="관계 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="배우자">배우자</SelectItem>
                  <SelectItem value="자녀">자녀</SelectItem>
                  <SelectItem value="부모">부모</SelectItem>
                  <SelectItem value="형제/자매">형제/자매</SelectItem>
                  <SelectItem value="기타">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="guardianContact" className="text-right text-sm">연락처</label>
              <Input
                id="guardianContact"
                value={guardianData.contact}
                onChange={(e) => setGuardianData({...guardianData, contact: e.target.value})}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditGuardianDialogOpen(false)}>취소</Button>
            <Button onClick={handleUpdateGuardian}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 활력 징후 추가 다이얼로그 */}
      <Dialog open={editVitalSignsDialogOpen} onOpenChange={setEditVitalSignsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>활력 징후 추가</DialogTitle>
            <DialogDescription>새로운 활력 징후를 기록합니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="bloodPressure" className="text-right text-sm">혈압</label>
              <Input
                id="bloodPressure"
                value={vitalSignsData.bloodPressure}
                onChange={(e) => setVitalSignsData({...vitalSignsData, bloodPressure: e.target.value})}
                className="col-span-3"
                placeholder="수축기/이완기 (예: 120/80)"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="heartRate" className="text-right text-sm">심박수</label>
              <Input
                id="heartRate"
                type="number"
                value={vitalSignsData.heartRate}
                onChange={(e) => setVitalSignsData({...vitalSignsData, heartRate: parseInt(e.target.value)})}
                className="col-span-3"
                placeholder="BPM"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="temperature" className="text-right text-sm">체온</label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                value={vitalSignsData.temperature}
                onChange={(e) => setVitalSignsData({...vitalSignsData, temperature: parseFloat(e.target.value)})}
                className="col-span-3"
                placeholder="°C"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="respiratoryRate" className="text-right text-sm">호흡수</label>
              <Input
                id="respiratoryRate"
                type="number"
                value={vitalSignsData.respiratoryRate}
                onChange={(e) => setVitalSignsData({...vitalSignsData, respiratoryRate: parseInt(e.target.value)})}
                className="col-span-3"
                placeholder="분당 호흡수"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditVitalSignsDialogOpen(false)}>취소</Button>
            <Button onClick={handleUpdateVitalSigns}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 진료 기록 추가 다이얼로그 */}
      <Dialog open={editNotesDialogOpen} onOpenChange={setEditNotesDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>진료 기록 추가</DialogTitle>
            <DialogDescription>새로운 진료 기록을 추가합니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="noteDate" className="text-right text-sm">날짜</label>
              <Input
                id="noteDate"
                type="date"
                value={notesData.date}
                onChange={(e) => setNotesData({...notesData, date: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="author" className="text-right text-sm">작성자</label>
              <Input
                id="author"
                value={notesData.author}
                onChange={(e) => setNotesData({...notesData, author: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="content" className="text-right text-sm">내용</label>
              <Textarea
                id="content"
                value={notesData.content}
                onChange={(e) => setNotesData({...notesData, content: e.target.value})}
                className="col-span-3"
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditNotesDialogOpen(false)}>취소</Button>
            <Button onClick={handleUpdateNotes}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 메시지 전송 다이얼로그 */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>메시지 전송</DialogTitle>
            <DialogDescription>보호자에게 메시지를 전송합니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg p-3 bg-muted">
              <p className="text-sm font-medium">수신자: {patient.guardian.name} ({patient.guardian.relation})</p>
              <p className="text-sm text-muted-foreground">{patient.guardian.contact}</p>
            </div>
            <Textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="메시지 내용을 입력하세요."
              rows={5}
            />
            <div className="flex items-center space-x-2">
              <Checkbox id="urgent" />
              <label
                htmlFor="urgent"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                긴급 메시지로 전송
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageDialogOpen(false)}>취소</Button>
            <Button onClick={handleSendMessage}>보내기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 낙상 감지 설정 다이얼로그 */}
      <Dialog open={fallDetectionDialogOpen} onOpenChange={setFallDetectionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>낙상 감지 설정</DialogTitle>
            <DialogDescription>낙상 감지 기능의 설정을 변경합니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">낙상 감지 활성화</span>
              <Switch 
                checked={fallDetectionSettings.enabled}
                onCheckedChange={(checked) => setFallDetectionSettings({...fallDetectionSettings, enabled: checked})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">감지 민감도</label>
              <Select 
                value={fallDetectionSettings.sensitivity} 
                onValueChange={(value) => setFallDetectionSettings({...fallDetectionSettings, sensitivity: value})}
                disabled={!fallDetectionSettings.enabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="민감도 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">낮음 (확실한 낙상만 감지)</SelectItem>
                  <SelectItem value="medium">중간 (권장)</SelectItem>
                  <SelectItem value="high">높음 (작은 움직임도 감지)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">알림 대기 시간 (초)</label>
              <Input 
                type="number" 
                value={fallDetectionSettings.delaySeconds}
                onChange={(e) => setFallDetectionSettings({...fallDetectionSettings, delaySeconds: parseInt(e.target.value)})}
                disabled={!fallDetectionSettings.enabled}
              />
              <p className="text-xs text-muted-foreground">낙상 감지 후 알림을 보내기까지의 대기 시간입니다. 오탐지를 줄이기 위해 사용됩니다.</p>
            </div>
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
            <DialogDescription>침대 이탈 감지 기능의 설정을 변경합니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">침대 이탈 감지 활성화</span>
              <Switch 
                checked={bedExitSettings.enabled}
                onCheckedChange={(checked) => setBedExitSettings({...bedExitSettings, enabled: checked})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">감지 민감도</label>
              <Select 
                value={bedExitSettings.sensitivity} 
                onValueChange={(value) => setBedExitSettings({...bedExitSettings, sensitivity: value})}
                disabled={!bedExitSettings.enabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="민감도 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">낮음 (확실한 이탈만 감지)</SelectItem>
                  <SelectItem value="medium">중간 (권장)</SelectItem>
                  <SelectItem value="high">높음 (작은 움직임도 감지)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">알림 대기 시간 (분)</label>
              <Input 
                type="number" 
                value={bedExitSettings.delayMinutes}
                onChange={(e) => setBedExitSettings({...bedExitSettings, delayMinutes: parseInt(e.target.value)})}
                disabled={!bedExitSettings.enabled}
              />
              <p className="text-xs text-muted-foreground">침대 이탈 후 몇 분이 지나면 알림을 보낼지 설정합니다. 짧은 이탈은 무시됩니다.</p>
            </div>
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
            <DialogDescription>환경 모니터링 기능의 설정을 변경합니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">환경 모니터링 활성화</span>
              <Switch 
                checked={environmentalSettings.enabled}
                onCheckedChange={(checked) => setEnvironmentalSettings({...environmentalSettings, enabled: checked})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">최소 온도 (°C)</label>
                <Input 
                  type="number" 
                  value={environmentalSettings.tempMin}
                  onChange={(e) => setEnvironmentalSettings({...environmentalSettings, tempMin: parseInt(e.target.value)})}
                  disabled={!environmentalSettings.enabled}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">최대 온도 (°C)</label>
                <Input 
                  type="number" 
                  value={environmentalSettings.tempMax}
                  onChange={(e) => setEnvironmentalSettings({...environmentalSettings, tempMax: parseInt(e.target.value)})}
                  disabled={!environmentalSettings.enabled}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">최소 습도 (%)</label>
                <Input 
                  type="number" 
                  value={environmentalSettings.humidityMin}
                  onChange={(e) => setEnvironmentalSettings({...environmentalSettings, humidityMin: parseInt(e.target.value)})}
                  disabled={!environmentalSettings.enabled}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">최대 습도 (%)</label>
                <Input 
                  type="number" 
                  value={environmentalSettings.humidityMax}
                  onChange={(e) => setEnvironmentalSettings({...environmentalSettings, humidityMax: parseInt(e.target.value)})}
                  disabled={!environmentalSettings.enabled}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="notifyChanges" 
                checked={environmentalSettings.notifyChanges}
                onCheckedChange={(checked) => setEnvironmentalSettings({...environmentalSettings, notifyChanges: checked === true})}
                disabled={!environmentalSettings.enabled}
              />
              <label
                htmlFor="notifyChanges"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                급격한 환경 변화 시 알림 활성화
              </label>
            </div>
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
            <DialogDescription>보호자 알림 설정을 변경합니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">보호자 알림 활성화</span>
              <Switch 
                checked={guardianNotifySettings.enabled}
                onCheckedChange={(checked) => setGuardianNotifySettings({...guardianNotifySettings, enabled: checked})}
              />
            </div>
            <p className="text-sm">
              알림을 받을 이벤트를 선택하세요:
            </p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="notifyFall" 
                  checked={guardianNotifySettings.notifyFall}
                  onCheckedChange={(checked) => setGuardianNotifySettings({...guardianNotifySettings, notifyFall: checked === true})}
                  disabled={!guardianNotifySettings.enabled}
                />
                <label
                  htmlFor="notifyFall"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  낙상 발생 시
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="notifyBedExit" 
                  checked={guardianNotifySettings.notifyBedExit}
                  onCheckedChange={(checked) => setGuardianNotifySettings({...guardianNotifySettings, notifyBedExit: checked === true})}
                  disabled={!guardianNotifySettings.enabled}
                />
                <label
                  htmlFor="notifyBedExit"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  침대 이탈 시
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="notifyEnvironmental" 
                  checked={guardianNotifySettings.notifyEnvironmental}
                  onCheckedChange={(checked) => setGuardianNotifySettings({...guardianNotifySettings, notifyEnvironmental: checked === true})}
                  disabled={!guardianNotifySettings.enabled}
                />
                <label
                  htmlFor="notifyEnvironmental"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  환경 이상 발생 시
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="notifyMedication" 
                  checked={guardianNotifySettings.notifyMedication}
                  onCheckedChange={(checked) => setGuardianNotifySettings({...guardianNotifySettings, notifyMedication: checked === true})}
                  disabled={!guardianNotifySettings.enabled}
                />
                <label
                  htmlFor="notifyMedication"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  약물 투여 시
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGuardianNotifyDialogOpen(false)}>취소</Button>
            <Button onClick={() => handleSaveMonitoringSettings('guardianNotify')}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}