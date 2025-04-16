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
  },
  6: {
    id: 6,
    name: "강환자",
    age: 75,
    gender: "남",
    birthDate: "1950-10-05",
    roomNumber: "103",
    bedNumber: 1,
    diagnosis: "심부전",
    admissionDate: "2025-03-25",
    expectedDischargeDate: "2025-04-20",
    guardian: {
      name: "강보호자",
      relation: "배우자",
      contact: "010-6789-0123"
    },
    address: "서울시 용산구 이태원동 567-89",
    contact: "010-4321-0987",
    condition: "주의",
    assignedNurseId: 8,
    fallRisk: "중간",
    fallRiskScore: 50,
    fallHistory: [],
    vitalSigns: [
      {
        date: "2025-04-15 15:00",
        bloodPressure: "150/90",
        heartRate: 80,
        temperature: 36.8,
        respiratoryRate: 20
      },
      {
        date: "2025-04-14 15:30",
        bloodPressure: "155/92",
        heartRate: 82,
        temperature: 36.9,
        respiratoryRate: 21
      }
    ],
    medications: [
      {
        name: "이뇨제",
        dosage: "40mg",
        frequency: "1일 1회",
        timing: "아침 식전"
      },
      {
        name: "베타차단제",
        dosage: "25mg",
        frequency: "1일 2회",
        timing: "아침, 저녁 식후"
      },
      {
        name: "ACE억제제",
        dosage: "10mg",
        frequency: "1일 1회",
        timing: "저녁 식후"
      }
    ],
    notes: [
      {
        date: "2025-04-13",
        author: "정간호사",
        content: "호흡곤란 호소 감소. 부종 약간 감소."
      },
      {
        date: "2025-04-09",
        author: "최의사",
        content: "심초음파 검사 결과 심기능 약간 호전. 약물 용량 조정함."
      }
    ]
  },
  7: {
    id: 7,
    name: "윤환자",
    age: 69,
    gender: "여",
    birthDate: "1956-08-20",
    roomNumber: "103",
    bedNumber: 2,
    diagnosis: "만성폐쇄성폐질환",
    admissionDate: "2025-04-05",
    expectedDischargeDate: "2025-04-25",
    guardian: {
      name: "윤보호자",
      relation: "자녀",
      contact: "010-7890-1234"
    },
    address: "서울시 중구 신당동 678-90",
    contact: "010-3210-9876",
    condition: "주의",
    assignedNurseId: 8,
    fallRisk: "높음",
    fallRiskScore: 70,
    fallHistory: [
      {
        date: "2025-04-08",
        time: "11:20",
        location: "병실",
        severity: "경미",
        description: "산소 튜브에 걸려 넘어질 뻔함"
      }
    ],
    vitalSigns: [
      {
        date: "2025-04-15 16:00",
        bloodPressure: "135/82",
        heartRate: 85,
        temperature: 37.1,
        respiratoryRate: 22
      },
      {
        date: "2025-04-14 16:30",
        bloodPressure: "140/85",
        heartRate: 88,
        temperature: 37.2,
        respiratoryRate: 24
      }
    ],
    medications: [
      {
        name: "기관지확장제",
        dosage: "18mcg",
        frequency: "1일 2회",
        timing: "아침, 저녁"
      },
      {
        name: "코르티코스테로이드 흡입기",
        dosage: "250mcg",
        frequency: "1일 2회",
        timing: "아침, 저녁"
      },
      {
        name: "항생제",
        dosage: "500mg",
        frequency: "1일 2회",
        timing: "아침, 저녁 식후"
      }
    ],
    notes: [
      {
        date: "2025-04-14",
        author: "김간호사",
        content: "호흡곤란 지속. 산소포화도 모니터링 중."
      },
      {
        date: "2025-04-10",
        author: "박의사",
        content: "흉부 X-ray 촬영 결과 폐렴 증상 감소. 항생제 유지."
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
        {/* 첫 번째 행: 환자 정보, 낙상 위험도 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 환자 정보 */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>환자 정보</CardTitle>
                  <CardDescription>환자의 기본 정보</CardDescription>
                </div>
                {canEdit && (
                  <Button 
                    onClick={() => setEditDialogOpen(true)}
                    variant="outline" 
                    size="sm"
                    className="h-8"
                  >
                    <Edit className="h-4 w-4 mr-1.5" />
                    수정
                  </Button>
                )}
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
              </CardContent>
            </Card>
          </div>
          
          {/* 낙상 위험도 */}
          <div className="md:col-span-1">
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
          
          {/* 탭 컨테이너 */}
          <div className="md:col-span-1">
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
                          <p className="text-sm text-gray-500">온도, 습도 등 환경 모니터링을 설정합니다.</p>
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
                          <p className="text-sm text-gray-500">보호자 알림 방식을 설정합니다.</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${monitoringSettings.guardianNotify ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                            {monitoringSettings.guardianNotify ? "활성화" : "비활성화"}
                          </span>
                          <Button size="sm" onClick={() => setGuardianNotifyDialogOpen(true)}>설정</Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 rounded-md border">
                        <div>
                          <h3 className="font-medium">보호자에게 메시지 보내기</h3>
                          <p className="text-sm text-gray-500">보호자에게 직접 메시지를 보냅니다.</p>
                        </div>
                        <Button size="sm" onClick={() => setMessageDialogOpen(true)}>
                          <MessageCircle className="h-4 w-4 mr-1" /> 메시지 작성
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
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
                  onChange={(e) => setFormData({...formData, age: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="gender" className="text-sm font-medium block mb-1">성별</label>
                <Select value={formData.gender} onValueChange={(value) => setFormData({...formData, gender: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="성별 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="남">남</SelectItem>
                    <SelectItem value="여">여</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="birthDate" className="text-sm font-medium block mb-1">생년월일</label>
                <Input 
                  id="birthDate" 
                  value={formData.birthDate} 
                  onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="roomNumber" className="text-sm font-medium block mb-1">병실</label>
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
                  onChange={(e) => setFormData({...formData, bedNumber: parseInt(e.target.value) || 0})}
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
              <label htmlFor="address" className="text-sm font-medium block mb-1">주소</label>
              <Input 
                id="address" 
                value={formData.address} 
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>
            
            <div>
              <label htmlFor="contact" className="text-sm font-medium block mb-1">연락처</label>
              <Input 
                id="contact" 
                value={formData.contact} 
                onChange={(e) => setFormData({...formData, contact: e.target.value})}
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
            <div>
              <label htmlFor="guardianName" className="text-sm font-medium block mb-1">보호자 성명</label>
              <Input 
                id="guardianName" 
                value={guardianData.name} 
                onChange={(e) => setGuardianData({...guardianData, name: e.target.value})}
              />
            </div>
            
            <div>
              <label htmlFor="relation" className="text-sm font-medium block mb-1">관계</label>
              <Select value={guardianData.relation} onValueChange={(value) => setGuardianData({...guardianData, relation: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="관계 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="배우자">배우자</SelectItem>
                  <SelectItem value="자녀">자녀</SelectItem>
                  <SelectItem value="부모">부모</SelectItem>
                  <SelectItem value="형제/자매">형제/자매</SelectItem>
                  <SelectItem value="친척">친척</SelectItem>
                  <SelectItem value="기타">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label htmlFor="guardianContact" className="text-sm font-medium block mb-1">보호자 연락처</label>
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
            <DialogDescription>낙상 감지 알림 기능을 설정합니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={fallDetectionSettings.enabled}
                  onCheckedChange={(checked) => setFallDetectionSettings({...fallDetectionSettings, enabled: checked})}
                />
                <label className="text-sm font-medium">낙상 감지 활성화</label>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium block mb-1">감지 민감도</label>
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
                  <SelectItem value="medium">중간 (대부분의 낙상 감지)</SelectItem>
                  <SelectItem value="high">높음 (의심스러운 동작도 감지)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium block mb-1">알림 지연 시간 (초)</label>
              <div className="flex items-center gap-2">
                <Input 
                  type="number" 
                  min="0"
                  value={fallDetectionSettings.delaySeconds} 
                  onChange={(e) => setFallDetectionSettings({...fallDetectionSettings, delaySeconds: parseInt(e.target.value) || 0})}
                  disabled={!fallDetectionSettings.enabled}
                />
                <span className="text-sm text-gray-500">초</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">낙상 감지 후 알림을 보내기까지의 대기 시간입니다. 감지 오류를 줄이기 위해 사용됩니다.</p>
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
            <DialogDescription>침대 이탈 감지 알림 기능을 설정합니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={bedExitSettings.enabled}
                  onCheckedChange={(checked) => setBedExitSettings({...bedExitSettings, enabled: checked})}
                />
                <label className="text-sm font-medium">침대 이탈 감지 활성화</label>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium block mb-1">감지 민감도</label>
              <Select 
                value={bedExitSettings.sensitivity} 
                onValueChange={(value) => setBedExitSettings({...bedExitSettings, sensitivity: value})}
                disabled={!bedExitSettings.enabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="민감도 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">낮음 (완전히 침대를 벗어났을 때만)</SelectItem>
                  <SelectItem value="medium">중간 (일부 침대를 벗어났을 때)</SelectItem>
                  <SelectItem value="high">높음 (침대 가장자리에 있을 때도)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium block mb-1">알림 지연 시간 (분)</label>
              <div className="flex items-center gap-2">
                <Input 
                  type="number" 
                  min="0"
                  value={bedExitSettings.delayMinutes} 
                  onChange={(e) => setBedExitSettings({...bedExitSettings, delayMinutes: parseInt(e.target.value) || 0})}
                  disabled={!bedExitSettings.enabled}
                />
                <span className="text-sm text-gray-500">분</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">침대 이탈 후 설정한 시간 동안 돌아오지 않으면 알림이 발생합니다.</p>
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
            <DialogDescription>온도, 습도 등 환경 모니터링 기능을 설정합니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={environmentalSettings.enabled}
                  onCheckedChange={(checked) => setEnvironmentalSettings({...environmentalSettings, enabled: checked})}
                />
                <label className="text-sm font-medium">환경 모니터링 활성화</label>
              </div>
            </div>
            
            <div className="border rounded-md p-3">
              <label className="text-sm font-medium block mb-2">온도 범위 (°C)</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">최저 온도</label>
                  <Input 
                    type="number" 
                    value={environmentalSettings.tempMin} 
                    onChange={(e) => setEnvironmentalSettings({...environmentalSettings, tempMin: parseInt(e.target.value) || 0})}
                    disabled={!environmentalSettings.enabled}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">최고 온도</label>
                  <Input 
                    type="number" 
                    value={environmentalSettings.tempMax} 
                    onChange={(e) => setEnvironmentalSettings({...environmentalSettings, tempMax: parseInt(e.target.value) || 0})}
                    disabled={!environmentalSettings.enabled}
                  />
                </div>
              </div>
            </div>
            
            <div className="border rounded-md p-3">
              <label className="text-sm font-medium block mb-2">습도 범위 (%)</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">최저 습도</label>
                  <Input 
                    type="number" 
                    value={environmentalSettings.humidityMin} 
                    onChange={(e) => setEnvironmentalSettings({...environmentalSettings, humidityMin: parseInt(e.target.value) || 0})}
                    disabled={!environmentalSettings.enabled}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">최고 습도</label>
                  <Input 
                    type="number" 
                    value={environmentalSettings.humidityMax} 
                    onChange={(e) => setEnvironmentalSettings({...environmentalSettings, humidityMax: parseInt(e.target.value) || 0})}
                    disabled={!environmentalSettings.enabled}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox 
                  checked={environmentalSettings.notifyChanges}
                  onCheckedChange={(checked) => setEnvironmentalSettings({...environmentalSettings, notifyChanges: !!checked})}
                  disabled={!environmentalSettings.enabled}
                />
                <label className="text-sm">큰 변화가 있을 때 알림 받기</label>
              </div>
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
            <DialogDescription>보호자에게 보내는 알림을 설정합니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={guardianNotifySettings.enabled}
                  onCheckedChange={(checked) => setGuardianNotifySettings({...guardianNotifySettings, enabled: checked})}
                />
                <label className="text-sm font-medium">보호자 알림 활성화</label>
              </div>
            </div>
            
            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm">낙상 감지 시 알림</label>
                <Switch 
                  checked={guardianNotifySettings.notifyFall}
                  onCheckedChange={(checked) => setGuardianNotifySettings({...guardianNotifySettings, notifyFall: checked})}
                  disabled={!guardianNotifySettings.enabled}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm">침대 이탈 시 알림</label>
                <Switch 
                  checked={guardianNotifySettings.notifyBedExit}
                  onCheckedChange={(checked) => setGuardianNotifySettings({...guardianNotifySettings, notifyBedExit: checked})}
                  disabled={!guardianNotifySettings.enabled}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm">환경 이상 시 알림</label>
                <Switch 
                  checked={guardianNotifySettings.notifyEnvironmental}
                  onCheckedChange={(checked) => setGuardianNotifySettings({...guardianNotifySettings, notifyEnvironmental: checked})}
                  disabled={!guardianNotifySettings.enabled}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm">약물 투여 알림</label>
                <Switch 
                  checked={guardianNotifySettings.notifyMedication}
                  onCheckedChange={(checked) => setGuardianNotifySettings({...guardianNotifySettings, notifyMedication: checked})}
                  disabled={!guardianNotifySettings.enabled}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGuardianNotifyDialogOpen(false)}>취소</Button>
            <Button onClick={() => handleSaveMonitoringSettings('guardianNotify')}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 메시지 다이얼로그 */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>보호자에게 메시지 전송</DialogTitle>
            <DialogDescription>보호자({patient.guardian.name})에게 메시지를 전송합니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
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
      
      {/* 약물 정보 수정 다이얼로그 */}
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