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
  const { toast } = useToast();
  const { user } = useAuth();
  
  // 임시 데이터에서 환자 정보 가져오기
  const currentPatient = PATIENT_DATA[patientId as keyof typeof PATIENT_DATA];
  
  // 팝업 관련 상태
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editMedicationDialogOpen, setEditMedicationDialogOpen] = useState(false);
  const [editGuardianDialogOpen, setEditGuardianDialogOpen] = useState(false);
  
  // 환자 상태 관리 
  const [patient, setPatient] = useState<any>(null);
  
  // 수정 폼을 위한 상태
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    birthDate: '',
    roomNumber: '',
    bedNumber: '',
    diagnosis: '',
    admissionDate: '',
    expectedDischargeDate: '',
    address: '',
    contact: '',
    condition: ''
  });
  
  // 약물 및 보호자 정보를 위한 폼 상태
  const [medicationFormData, setMedicationFormData] = useState({
    name: '',
    dosage: '',
    frequency: '',
    timing: ''
  });
  
  const [guardianFormData, setGuardianFormData] = useState({
    name: '',
    relation: '',
    contact: ''
  });
  
  // 모니터링 설정을 위한 상태
  const [monitoringSettings, setMonitoringSettings] = useState({
    fallDetection: false,
    bedExit: false,
    environmental: false,
    guardianNotify: false
  });
  
  // 낙상 감지 설정 상태
  const [fallDetectionSettings, setFallDetectionSettings] = useState({
    enabled: false,
    sensitivity: "medium",
    alertDelay: 5,
    notifyRecipient: "all"
  });
  
  // 침대 이탈 감지 설정 상태
  const [bedExitSettings, setBedExitSettings] = useState({
    enabled: false,
    sensitivity: "medium",
    delayMinutes: 1
  });
  
  // 환경 모니터링 설정 상태
  const [environmentalSettings, setEnvironmentalSettings] = useState({
    enabled: false,
    tempMin: 20,
    tempMax: 26,
    humidityMin: 40,
    humidityMax: 60
  });
  
  // 보호자 알림 설정 상태
  const [guardianNotifySettings, setGuardianNotifySettings] = useState({
    enabled: false,
    notifyFallDetection: true,
    notifyBedExit: true,
    notifyEnvironmental: false,
    notifyMedication: false
  });
  
  // 모니터링 설정 다이얼로그 상태
  const [fallDetectionDialogOpen, setFallDetectionDialogOpen] = useState(false);
  const [bedExitDialogOpen, setBedExitDialogOpen] = useState(false);
  const [environmentalDialogOpen, setEnvironmentalDialogOpen] = useState(false);
  const [guardianNotifyDialogOpen, setGuardianNotifyDialogOpen] = useState(false);
  
  // 메시지 다이얼로그 상태
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  
  // 메시지 수신자 상태
  const [messageRecipient, setMessageRecipient] = useState("nurse"); // 기본값: 담당 간호사
  
  // 수정 권한 확인 (병원장 또는 담당 간호사만 수정 가능)
  // 병원장과 간호사만 환자 정보를 수정할 수 있음
  // 수정 권한 확인 (병원장 또는 담당 간호사만 수정 가능)
  // 병원장과 간호사만 환자 정보를 수정할 수 있음
  const canEdit = user && (
    user.role === UserRole.DIRECTOR || 
    user.role === UserRole.NURSE
    // 현재 데이터에 담당 간호사 필드가 없어 모든 간호사가 수정 가능
    // 추후 API 구현 시 담당 간호사 확인 로직 추가 필요
  );
  
  // 초기 데이터 로드
  useEffect(() => {
    if (currentPatient) {
      setPatient(currentPatient);
      
      setFormData({
        name: currentPatient.name,
        age: currentPatient.age.toString(),
        gender: currentPatient.gender,
        birthDate: currentPatient.birthDate,
        roomNumber: currentPatient.roomNumber,
        bedNumber: currentPatient.bedNumber.toString(),
        diagnosis: currentPatient.diagnosis,
        admissionDate: currentPatient.admissionDate,
        expectedDischargeDate: currentPatient.expectedDischargeDate,
        address: currentPatient.address,
        contact: currentPatient.contact,
        condition: currentPatient.condition
      });
      
      setGuardianFormData({
        name: currentPatient.guardian.name,
        relation: currentPatient.guardian.relation,
        contact: currentPatient.guardian.contact
      });
      
      if (currentPatient.medications && currentPatient.medications.length > 0) {
        setMedicationFormData({
          name: currentPatient.medications[0].name,
          dosage: currentPatient.medications[0].dosage,
          frequency: currentPatient.medications[0].frequency,
          timing: currentPatient.medications[0].timing
        });
      }
    }
  }, [currentPatient]);
  
  // 환자 기본 정보 수정 처리
  const handleEditPatient = async () => {
    try {
      // 입력값 검증
      if (!formData.name || !formData.age || !formData.roomNumber || !formData.bedNumber) {
        toast({
          title: "필수 정보 누락",
          description: "이름, 나이, 병실, 침대 번호는 필수 항목입니다.",
          variant: "destructive"
        });
        return;
      }
      
      // 업데이트할 환자 데이터 생성
      const updatedPatient = {
        ...patient,
        name: formData.name,
        age: parseInt(formData.age),
        gender: formData.gender,
        birthDate: formData.birthDate,
        roomNumber: formData.roomNumber,
        bedNumber: parseInt(formData.bedNumber),
        diagnosis: formData.diagnosis,
        admissionDate: formData.admissionDate,
        expectedDischargeDate: formData.expectedDischargeDate,
        address: formData.address,
        contact: formData.contact,
        condition: formData.condition
      };
      
      // 실제 API 호출 (구현 시 주석 해제)
      try {
        // API 호출이 구현될 때까지 임시로 시뮬레이션
        // const response = await apiRequest("PUT", `/api/patients/${patientId}`, updatedPatient);
        // const updatedData = await response.json();
        
        // 상태 업데이트
        setPatient(updatedPatient);
        
        // 성공 메시지 표시
        toast({
          title: "정보 수정 완료",
          description: "환자 정보가 성공적으로 업데이트되었습니다.",
        });
        
        // API가 구현되면 아래 주석 해제
        // queryClient.invalidateQueries({ queryKey: ['/api/patients', patientId] });
        
        // 다이얼로그 닫기
        setEditDialogOpen(false);
      } catch (apiError) {
        console.error("API 오류:", apiError);
        toast({
          title: "서버 오류",
          description: "서버와 통신 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("일반 오류:", error);
      toast({
        title: "오류 발생",
        description: "환자 정보 업데이트 중 문제가 발생했습니다.",
        variant: "destructive"
      });
    }
  };
  
  // 투약 정보 수정 처리
  const handleEditMedication = () => {
    try {
      // 실제 API 호출 대신 상태 업데이트로 시뮬레이션
      setTimeout(() => {
        toast({
          title: "투약 정보 수정 완료",
          description: "환자의 투약 정보가 성공적으로 업데이트되었습니다.",
        });
        setEditMedicationDialogOpen(false);
      }, 500);
    } catch (error) {
      toast({
        title: "오류 발생",
        description: "투약 정보 업데이트 중 문제가 발생했습니다.",
        variant: "destructive"
      });
    }
  };
  
  // 보호자 정보 수정 처리
  const handleEditGuardian = () => {
    try {
      // 실제 API 호출 대신 상태 업데이트로 시뮬레이션
      setTimeout(() => {
        toast({
          title: "보호자 정보 수정 완료",
          description: "보호자 정보가 성공적으로 업데이트되었습니다.",
        });
        setEditGuardianDialogOpen(false);
      }, 500);
    } catch (error) {
      toast({
        title: "오류 발생",
        description: "보호자 정보 업데이트 중 문제가 발생했습니다.",
        variant: "destructive"
      });
    }
  };
  
  // 메시지 전송 처리
  const handleSendMessage = () => {
    try {
      if (messageContent.trim() === '') {
        toast({
          title: "경고",
          description: "메시지 내용을 입력해주세요.",
          variant: "destructive"
        });
        return;
      }
      
      // 실제 API 호출 대신 상태 업데이트로 시뮬레이션
      setTimeout(() => {
        toast({
          title: "메시지 전송 완료",
          description: "메시지가 성공적으로 전송되었습니다.",
        });
        setMessageDialogOpen(false);
        setMessageContent('');
      }, 500);
    } catch (error) {
      toast({
        title: "오류 발생",
        description: "메시지 전송 중 문제가 발생했습니다.",
        variant: "destructive"
      });
    }
  };
  
  // 모니터링 설정 저장 처리
  const handleSaveMonitoringSettings = (type: 'fall' | 'bedExit' | 'environmental' | 'guardian') => {
    try {
      const settingName = 
        type === 'fall' ? '낙상 감지' : 
        type === 'bedExit' ? '침대 이탈 감지' : 
        type === 'environmental' ? '환경 모니터링' : '보호자 알림';

      // 설정 데이터 준비
      let patientId = patient.id;
      let settingsData: any = {};

      if (type === 'fall') {
        settingsData = {
          type: 'fallDetection',
          enabled: fallDetectionSettings.enabled,
          settings: {
            sensitivity: fallDetectionSettings.sensitivity,
            alertDelay: fallDetectionSettings.alertDelay,
            notifyRecipient: fallDetectionSettings.notifyRecipient
          }
        };
      } else if (type === 'bedExit') {
        settingsData = {
          type: 'bedExit',
          enabled: bedExitSettings.enabled,
          settings: {
            sensitivity: bedExitSettings.sensitivity,
            delayMinutes: bedExitSettings.delayMinutes
          }
        };
      } else if (type === 'environmental') {
        settingsData = {
          type: 'environmental',
          enabled: environmentalSettings.enabled,
          settings: {
            tempMin: environmentalSettings.tempMin,
            tempMax: environmentalSettings.tempMax,
            humidityMin: environmentalSettings.humidityMin,
            humidityMax: environmentalSettings.humidityMax
          }
        };
      } else {
        settingsData = {
          type: 'guardianNotify',
          enabled: guardianNotifySettings.enabled,
          settings: {
            notifyFallDetection: guardianNotifySettings.notifyFallDetection,
            notifyBedExit: guardianNotifySettings.notifyBedExit,
            notifyEnvironmental: guardianNotifySettings.notifyEnvironmental,
            notifyMedication: guardianNotifySettings.notifyMedication
          }
        };
      }
      
      // 실제 API 호출 (이 부분은 실제 API가 구현되면 수정)
      setTimeout(() => {
        // console.log(`${type} 설정 저장 API 호출:`, settingsData);
        
        // 상태 업데이트
        setMonitoringSettings(prev => ({
          ...prev,
          [type === 'fall' ? 'fallDetection' : 
           type === 'bedExit' ? 'bedExit' : 
           type === 'environmental' ? 'environmental' : 'guardianNotify']: 
           type === 'fall' ? fallDetectionSettings.enabled : 
           type === 'bedExit' ? bedExitSettings.enabled : 
           type === 'environmental' ? environmentalSettings.enabled : 
           guardianNotifySettings.enabled
        }));
        
        toast({
          title: "설정 저장 완료",
          description: `${settingName} 설정이 성공적으로 저장되었습니다.`,
        });
        
        // 다이얼로그 닫기
        if (type === 'fall') setFallDetectionDialogOpen(false);
        else if (type === 'bedExit') setBedExitDialogOpen(false);
        else if (type === 'environmental') setEnvironmentalDialogOpen(false);
        else setGuardianNotifyDialogOpen(false);
      }, 500);
    } catch (error) {
      toast({
        title: "오류 발생",
        description: "설정 저장 중 문제가 발생했습니다.",
        variant: "destructive"
      });
    }
  };
  
  if (!patient) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">존재하지 않는 환자입니다</h1>
        <p className="text-gray-600 mb-6">요청하신 환자 정보를 찾을 수 없습니다.</p>
        <a href="/" className="text-primary hover:underline">홈으로 돌아가기</a>
      </div>
    );
  }
  
  // 환자 정보 수정 폼 핸들러
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 보호자 정보 수정 폼 핸들러
  const handleGuardianFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGuardianFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 투약 정보 수정 폼 핸들러
  const handleMedicationFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMedicationFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="p-6">
      {/* 환자 정보 수정 다이얼로그 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>환자 기본 정보 수정</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right text-sm">이름</label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="age" className="text-right text-sm">나이</label>
              <Input
                id="age"
                name="age"
                value={formData.age}
                onChange={handleFormChange}
                className="col-span-3"
                type="number"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="gender" className="text-right text-sm">성별</label>
              <Input
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="diagnosis" className="text-right text-sm">진단명</label>
              <Input
                id="diagnosis"
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="address" className="text-right text-sm">주소</label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="contact" className="text-right text-sm">연락처</label>
              <Input
                id="contact"
                name="contact"
                value={formData.contact}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>취소</Button>
            <Button onClick={handleEditPatient}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 보호자 정보 수정 다이얼로그 */}
      <Dialog open={editGuardianDialogOpen} onOpenChange={setEditGuardianDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>보호자 정보 수정</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="guardian_name" className="text-right text-sm">이름</label>
              <Input
                id="guardian_name"
                name="name"
                value={guardianFormData.name}
                onChange={handleGuardianFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="guardian_relation" className="text-right text-sm">관계</label>
              <Input
                id="guardian_relation"
                name="relation"
                value={guardianFormData.relation}
                onChange={handleGuardianFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="guardian_contact" className="text-right text-sm">연락처</label>
              <Input
                id="guardian_contact"
                name="contact"
                value={guardianFormData.contact}
                onChange={handleGuardianFormChange}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditGuardianDialogOpen(false)}>취소</Button>
            <Button onClick={handleEditGuardian}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 투약 정보 수정 다이얼로그 */}
      <Dialog open={editMedicationDialogOpen} onOpenChange={setEditMedicationDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>투약 정보 수정</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="med_name" className="text-right text-sm">약품명</label>
              <Input
                id="med_name"
                name="name"
                value={medicationFormData.name}
                onChange={handleMedicationFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="med_dosage" className="text-right text-sm">용량</label>
              <Input
                id="med_dosage"
                name="dosage"
                value={medicationFormData.dosage}
                onChange={handleMedicationFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="med_frequency" className="text-right text-sm">빈도</label>
              <Input
                id="med_frequency"
                name="frequency"
                value={medicationFormData.frequency}
                onChange={handleMedicationFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="med_timing" className="text-right text-sm">투약 시간</label>
              <Input
                id="med_timing"
                name="timing"
                value={medicationFormData.timing}
                onChange={handleMedicationFormChange}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMedicationDialogOpen(false)}>취소</Button>
            <Button onClick={handleEditMedication}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 메시지 전송 다이얼로그 */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>메시지 전송</DialogTitle>
            <DialogDescription>보호자 및 의료진과 메시지를 주고받습니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4 mb-2">
              <label htmlFor="recipient" className="text-sm font-medium">수신자 선택</label>
              <div className="col-span-3">
                <Select 
                  value={messageRecipient}
                  onValueChange={(value) => setMessageRecipient(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="수신자 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nurse">담당 간호사</SelectItem>
                    <SelectItem value="doctor">담당 의사</SelectItem>
                    <SelectItem value="guardian">보호자</SelectItem>
                    <SelectItem value="administrator">병원 관리자</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 items-center gap-2">
              <label htmlFor="message" className="text-sm font-medium">메시지 내용</label>
              <Textarea
                id="message"
                placeholder="메시지 내용을 입력하세요"
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                className="resize-none"
                rows={4}
              />
            </div>
            
            <div className="bg-gray-50 p-3 rounded-md border mt-2">
              <div className="flex items-center">
                <div className="flex-grow">
                  <span className="text-sm font-medium">수신자: </span>
                  <span className="text-sm">
                    {messageRecipient === 'nurse' ? '담당 간호사 (이간호사)' : 
                     messageRecipient === 'doctor' ? '담당 의사 (박의사)' : 
                     messageRecipient === 'guardian' ? '보호자 (김보호자)' : 
                     '병원 관리자'}
                  </span>
                </div>
              </div>
            </div>
            
            <Alert className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>메시지 사용 안내</AlertTitle>
              <AlertDescription>
                긴급한 사항은 병원 대표번호로 전화하시기 바랍니다. 메시지는 근무 시간 내 확인됩니다.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageDialogOpen(false)}>취소</Button>
            <Button onClick={handleSendMessage}>전송</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 낙상 감지 설정 다이얼로그 */}
      <Dialog open={fallDetectionDialogOpen} onOpenChange={setFallDetectionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>낙상 감지 설정</DialogTitle>
            <DialogDescription>낙상 감지 알림 설정을 구성합니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-medium">낙상 감지 알림 활성화</h3>
                <p className="text-sm text-gray-500">낙상 감지 시 알림을 받습니다.</p>
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
                    <p className="text-sm text-gray-500">감지 민감도를 설정합니다.</p>
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
              
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="font-medium">알림 지연 시간(초)</h3>
                    <p className="text-sm text-gray-500">감지 후 알림 전송까지의 지연 시간입니다.</p>
                  </div>
                  <Select 
                    defaultValue={fallDetectionSettings.alertDelay.toString()}
                    onValueChange={(value) => 
                      setFallDetectionSettings(prev => ({...prev, alertDelay: Number(value)}))
                    }
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="시간 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">즉시</SelectItem>
                      <SelectItem value="5">5초</SelectItem>
                      <SelectItem value="10">10초</SelectItem>
                      <SelectItem value="15">15초</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="font-medium">알림 수신자 설정</h3>
                    <p className="text-sm text-gray-500">알림을 받을 사람을 선택합니다.</p>
                  </div>
                  <Select 
                    defaultValue={fallDetectionSettings.notifyRecipient}
                    onValueChange={(value) => 
                      setFallDetectionSettings(prev => ({...prev, notifyRecipient: value}))
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="수신자 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">모든 의료진</SelectItem>
                      <SelectItem value="nurse">담당 간호사</SelectItem>
                      <SelectItem value="guardian">보호자</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFallDetectionDialogOpen(false)}>취소</Button>
            <Button onClick={() => handleSaveMonitoringSettings('fall')}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 침대 이탈 감지 설정 다이얼로그 */}
      <Dialog open={bedExitDialogOpen} onOpenChange={setBedExitDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>침대 이탈 감지 설정</DialogTitle>
            <DialogDescription>침대 이탈 감지 알림 설정을 구성합니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-medium">침대 이탈 감지 알림 활성화</h3>
                <p className="text-sm text-gray-500">침대 이탈 시 알림을 받습니다.</p>
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
                    <p className="text-sm text-gray-500">감지 민감도를 설정합니다.</p>
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
                    <h3 className="font-medium">현재 온습도 확인</h3>
                    <p className="text-sm text-gray-500">최근 측정된 병실 온습도</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-1" />
                    새로고침
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 border p-3 rounded-md bg-gray-50">
                  <div className="flex flex-col items-center">
                    <div className="text-xs text-gray-500 mb-1">현재 온도</div>
                    <div className="text-lg font-medium">23.5°C</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="text-xs text-gray-500 mb-1">현재 습도</div>
                    <div className="text-lg font-medium">45%</div>
                  </div>
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
            <DialogDescription>보호자에게 전송되는 알림을 설정합니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-medium">보호자 알림 활성화</h3>
                <p className="text-sm text-gray-500">선택한 이벤트 발생 시 보호자에게 알림을 보냅니다.</p>
              </div>
              <Switch 
                checked={guardianNotifySettings.enabled}
                onCheckedChange={(checked) => 
                  setGuardianNotifySettings(prev => ({...prev, enabled: checked}))
                }
              />
            </div>
            
            {guardianNotifySettings.enabled && (
              <div className="space-y-3 pt-2">
                <div className="border-b pb-3">
                  <h3 className="font-medium mb-3">알림 이벤트 선택</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label htmlFor="notify-fall" className="text-sm flex items-center">
                        <Bell className="h-4 w-4 mr-2 text-gray-500" />
                        낙상 감지 알림
                      </label>
                      <Switch 
                        id="notify-fall"
                        checked={guardianNotifySettings.notifyFallDetection}
                        onCheckedChange={(checked) => 
                          setGuardianNotifySettings(prev => ({...prev, notifyFallDetection: checked}))
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label htmlFor="notify-bed" className="text-sm flex items-center">
                        <Bell className="h-4 w-4 mr-2 text-gray-500" />
                        침대 이탈 알림
                      </label>
                      <Switch 
                        id="notify-bed"
                        checked={guardianNotifySettings.notifyBedExit}
                        onCheckedChange={(checked) => 
                          setGuardianNotifySettings(prev => ({...prev, notifyBedExit: checked}))
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label htmlFor="notify-env" className="text-sm flex items-center">
                        <Bell className="h-4 w-4 mr-2 text-gray-500" />
                        환경 조건 이상 알림
                      </label>
                      <Switch 
                        id="notify-env"
                        checked={guardianNotifySettings.notifyEnvironmental}
                        onCheckedChange={(checked) => 
                          setGuardianNotifySettings(prev => ({...prev, notifyEnvironmental: checked}))
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label htmlFor="notify-medication" className="text-sm flex items-center">
                        <Bell className="h-4 w-4 mr-2 text-gray-500" />
                        투약 알림
                      </label>
                      <Switch 
                        id="notify-medication"
                        checked={guardianNotifySettings.notifyMedication}
                        onCheckedChange={(checked) => 
                          setGuardianNotifySettings(prev => ({...prev, notifyMedication: checked}))
                        }
                      />
                    </div>
                  </div>
                </div>
                
                <div className="pt-2">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>알림 전송 설정</AlertTitle>
                    <AlertDescription>
                      보호자에게 문자 메시지와 앱 알림으로 설정한 이벤트 발생 시 알림이 전송됩니다.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGuardianNotifyDialogOpen(false)}>취소</Button>
            <Button onClick={() => handleSaveMonitoringSettings('guardian')}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
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
        <div className="ml-auto flex gap-2">
          {canEdit && (
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => setEditDialogOpen(true)}
              className="mr-2"
            >
              <Edit className="h-4 w-4 mr-1" />
              환자 정보 수정
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setMessageDialogOpen(true)}>
            <MessageCircle className="h-4 w-4 mr-1" /> 메시지
          </Button>
        </div>
      </div>
      
      {canEdit && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>환자 정보 수정 가능</AlertTitle>
          <AlertDescription>
            병원장 또는 담당 간호사로 로그인하여 환자 정보를 수정할 수 있습니다. 상단의 '환자 정보 수정' 버튼을 클릭하여 환자 기본 정보를 수정하세요.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle>기본 정보</CardTitle>
              {canEdit && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setEditDialogOpen(true)}
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
              
              {canEdit && (
                <div className="flex justify-end mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setEditDialogOpen(true)}
                    className="h-8"
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
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>활력 징후</CardTitle>
                    <CardDescription>최근 활력 징후 기록</CardDescription>
                  </div>
                  {canEdit && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => toast({
                        title: "안내",
                        description: "활력 징후 기록 수정 기능은 곧 추가될 예정입니다.",
                      })}
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
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>진료 기록</CardTitle>
                    <CardDescription>의료진 노트 및 관찰 사항</CardDescription>
                  </div>
                  {canEdit && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => toast({
                        title: "안내",
                        description: "진료 기록 수정 기능은 곧 추가될 예정입니다.",
                      })}
                      className="h-8"
                    >
                      <Edit className="h-4 w-4 mr-1" /> 수정
                    </Button>
                  )}
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
    </div>
  );
}