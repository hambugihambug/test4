import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
// I18n 관련 기능을 직접 구현하여 useI18n 의존성 제거
// import { useI18n } from "@/contexts/I18nContext";
import { translations } from "@/lib/translations";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import Draggable from 'react-draggable'; // 드래그 기능을 위한 라이브러리
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RoomLayout } from "@/components/ui/room-layout";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Room, RoomWithPatients, Patient, InsertRoom } from "@shared/schema";
import { Plus, Thermometer, Droplets, CheckCircle, AlertCircle, AlertTriangle, Pencil, HeartPulse, User, CalendarClock, Users, BedDouble, MapPin, FileText, Phone, Shield, Clipboard, ArrowLeft, Move } from "lucide-react";

// Schema for adding/editing a room
const roomSchema = z.object({
  name: z.string().min(1, "Room name is required"),
  tempThreshold: z.number().min(0, "Temperature threshold must be positive"),
  humidityThreshold: z.number().min(0, "Humidity threshold must be positive"),
});

export default function RoomManagementPage() {
  console.log("RoomManagementPage 컴포넌트가 렌더링됨");
  
  try {
    console.log("RoomManagementPage에서 try 블록 시작");
    console.log("디버깅: window 객체 존재 확인:", typeof window !== 'undefined');
    // 직접 간단한 번역 함수 구현
    const language = 'ko'; // 기본적으로 한국어 사용
    const t = (key: string): string => {
      try {
        const keys = key.split('.');
        let result: any = translations[language];
        
        for (const k of keys) {
          if (result && typeof result === 'object' && k in result) {
            result = result[k];
          } else {
            return key; // 번역이 없으면 키 자체를 반환
          }
        }
        
        return typeof result === 'string' ? result : key;
      } catch (err) {
        console.error("번역 오류:", err);
        return key;
      }
    };
    console.log("번역 함수 생성 완료");
    const { user } = useAuth();
    const { toast } = useToast();
    const [, navigate] = useLocation();
    
    console.log("RoomManagementPage 상태 초기화 중, 사용자:", user?.username);
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [isAddingFloor, setIsAddingFloor] = useState(false);
  
  // 디버깅: 페이지 로드 시 인증 정보 확인
  useEffect(() => {
    console.log("병실 관리 페이지 - 인증 상태:", !!user);
    if (user) {
      console.log("병실 관리 페이지 - 사용자 역할:", user.role);
    } else {
      console.log("병실 관리 페이지 - 사용자 인증 안 됨");
    }
  }, [user]);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [isViewingPatientDetails, setIsViewingPatientDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("details");
  const [isAddingBed, setIsAddingBed] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [floorInput, setFloorInput] = useState<string>("");
  const [floors, setFloors] = useState<number[]>([1, 2, 3]);
  const [isAssigningPatient, setIsAssigningPatient] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState<number | null>(null);
  
  // 환자 정보 수정을 위한 상태 추가
  const [isEditingBasicInfo, setIsEditingBasicInfo] = useState(false);
  const [isEditingGuardianInfo, setIsEditingGuardianInfo] = useState(false);
  const [isEditingFallRisk, setIsEditingFallRisk] = useState(false);
  const [isEditingVitalSigns, setIsEditingVitalSigns] = useState(false);
  const [isEditingMedication, setIsEditingMedication] = useState(false);
  const [editedPatientDetails, setEditedPatientDetails] = useState<any>(null);
  
  // 사용자 정보는 위에서 이미 가져옴
  console.log("RoomManagementPage - 현재 사용자:", user?.username, "역할:", user?.role);
  
  // 임시 환자 사용자 데이터 (API가 구현될 때까지 사용)
  const dummyPatients = [
    { id: 1, name: "박진환", age: 68, gender: "남" },
    { id: 2, name: "이미숙", age: 72, gender: "여" },
    { id: 3, name: "최건우", age: 56, gender: "남" },
    { id: 4, name: "장서연", age: 83, gender: "여" }
  ];
  
  // 임시 병실 데이터 (API가 구현될 때까지 사용)
  const initialRooms = [
    {
      id: 1,
      name: "101호",
      tempThreshold: 26.0,
      humidityThreshold: 60.0,
      currentTemp: 24.5,
      currentHumidity: 55,
      status: "normal",
      layout: JSON.stringify({
        beds: [
          { id: "1", x: 10, y: 10, width: 80, height: 180, rotation: 0, patientId: 1 },
          { id: "2", x: 110, y: 10, width: 80, height: 180, rotation: 0, patientId: 2 }
        ],
        objects: [
          { id: "1", type: "cabinet", x: 200, y: 10, width: 50, height: 80, rotation: 0 }
        ]
      }),
      patients: [
        { id: 1, name: "김환자", age: 65, roomId: 1, bedNumber: 1, fallRisk: "high", userId: null, height: null, weight: null, blood: null, assignedNurseId: null },
        { id: 2, name: "이환자", age: 78, roomId: 1, bedNumber: 2, fallRisk: "medium", userId: null, height: null, weight: null, blood: null, assignedNurseId: null }
      ]
    },
    {
      id: 2,
      name: "102호",
      tempThreshold: 26.0,
      humidityThreshold: 60.0,
      currentTemp: 25.8,
      currentHumidity: 62,
      status: "warning",
      layout: JSON.stringify({
        beds: [
          { id: "1", x: 10, y: 10, width: 80, height: 180, rotation: 0, patientId: 3 },
          { id: "2", x: 110, y: 10, width: 80, height: 180, rotation: 0, patientId: 4 },
          { id: "3", x: 210, y: 10, width: 80, height: 180, rotation: 0, patientId: 5 }
        ],
        objects: [
          { id: "1", type: "table", x: 150, y: 200, width: 100, height: 60, rotation: 0 }
        ]
      }),
      patients: [
        { id: 3, name: "박환자", age: 72, roomId: 2, bedNumber: 1, fallRisk: "high", userId: null, height: null, weight: null, blood: null, assignedNurseId: null },
        { id: 4, name: "최환자", age: 68, roomId: 2, bedNumber: 2, fallRisk: "low", userId: null, height: null, weight: null, blood: null, assignedNurseId: null },
        { id: 5, name: "정환자", age: 81, roomId: 2, bedNumber: 3, fallRisk: "medium", userId: null, height: null, weight: null, blood: null, assignedNurseId: null }
      ]
    },
    {
      id: 3,
      name: "103호",
      tempThreshold: 26.0,
      humidityThreshold: 60.0,
      currentTemp: 26.5,
      currentHumidity: 58,
      status: "alert",
      layout: JSON.stringify({
        beds: [
          { id: "1", x: 10, y: 10, width: 80, height: 180, rotation: 0, patientId: 6 },
          { id: "2", x: 110, y: 10, width: 80, height: 180, rotation: 0, patientId: 7 }
        ],
        objects: []
      }),
      patients: [
        { id: 6, name: "강환자", age: 75, roomId: 3, bedNumber: 1, fallRisk: "low", userId: null, height: null, weight: null, blood: null, assignedNurseId: null },
        { id: 7, name: "윤환자", age: 69, roomId: 3, bedNumber: 2, fallRisk: "high", userId: null, height: null, weight: null, blood: null, assignedNurseId: null }
      ]
    }
  ];
  
  // 상태로 관리하도록 변경
  const [dummyRooms, setDummyRooms] = useState<RoomWithPatients[]>(initialRooms);
  
  // UI에서 참조하는 데이터로 dummyRooms 상태를 직접 사용합니다.
  const roomsWithPatients = dummyRooms;
  const roomsLoading = false;
  const roomsError = null;
  
  // 임시 간호사 데이터
  const dummyNurses = [
    { id: 101, name: "김간호사", role: "nurse" },
    { id: 102, name: "이간호사", role: "nurse" },
    { id: 103, name: "박간호사", role: "nurse" },
    { id: 104, name: "최간호사", role: "nurse" },
  ];
  
  // 간호사 ID로 이름 조회하는 함수
  const getNurseName = (nurseId: number): string => {
    const nurse = dummyNurses.find(n => n.id === nurseId);
    return nurse ? nurse.name : `간호사 ID: ${nurseId}`;
  };
  
  // Get the selected room data
  const selectedRoom = roomsWithPatients?.find(room => room.id === selectedRoomId);
  
  console.log("RoomManagementPage - 선택된 병실:", selectedRoom?.name);
  
  // Initialize form for adding/editing a room
  const form = useForm<z.infer<typeof roomSchema>>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      name: "",
      tempThreshold: 26.0,
      humidityThreshold: 60.0,
    },
  });
  
  // Set initial selected room
  useEffect(() => {
    if (!selectedRoomId && roomsWithPatients && roomsWithPatients.length > 0) {
      console.log("처음 마운트 시 병실 선택:", roomsWithPatients[0]);
      setSelectedRoomId(roomsWithPatients[0].id);
    }
  }, [roomsWithPatients, selectedRoomId]);
  
  // 선택된 병실이 변경될 때마다 로그 출력 (디버깅용)
  useEffect(() => {
    if (selectedRoomId) {
      const currentRoom = roomsWithPatients?.find(room => room.id === selectedRoomId);
      console.log("선택된 병실 변경:", selectedRoomId, currentRoom);
      
      if (currentRoom?.layout) {
        try {
          const parsedLayout = JSON.parse(currentRoom.layout);
          console.log("병실 레이아웃 데이터:", parsedLayout);
        } catch (e) {
          console.error("레이아웃 파싱 오류:", e);
        }
      }
    }
  }, [selectedRoomId, roomsWithPatients]);
  
  // Update form values when editing a room
  useEffect(() => {
    if (editingRoom) {
      form.reset({
        name: editingRoom.name,
        tempThreshold: editingRoom.tempThreshold || 26.0,
        humidityThreshold: editingRoom.humidityThreshold || 60.0,
      });
    } else {
      form.reset({
        name: "",
        tempThreshold: 26.0,
        humidityThreshold: 60.0,
      });
    }
  }, [editingRoom, form]);
  
  // Handle form submission for adding/editing a room
  const onSubmitRoom = async (values: z.infer<typeof roomSchema>) => {
    try {
      // 변경사항 즉시 반영 (실제 API 호출 대신)
      console.log("Room 저장:", values);
      
      if (editingRoom) {
        // 기존 방 업데이트 (로컬)
        const updatedRooms = dummyRooms.map(room => 
          room.id === editingRoom.id 
            ? { ...room, ...values } 
            : room
        );
        setDummyRooms(updatedRooms);
      } else {
        // 새 방 추가 (로컬)
        const newRoom: RoomWithPatients = {
          id: Date.now(),
          name: values.name,
          tempThreshold: values.tempThreshold,
          humidityThreshold: values.humidityThreshold,
          currentTemp: 24.0,
          currentHumidity: 50,
          status: "normal",
          layout: JSON.stringify({
            beds: [],
            objects: []
          }),
          patients: []
        };
        setDummyRooms([...dummyRooms, newRoom]);
      }
      
      // Reset state
      setIsAddingRoom(false);
      setEditingRoom(null);
      form.reset();
    } catch (error) {
      console.error("Failed to save room:", error);
    }
  };
  
  // 병실에 환자 배정 함수 - UI에서 호출
  const assignPatientToRoom = (roomId: number, patientId: number) => {
    if (!roomId || !patientId) return;
    
    // 편집 모드 활성화
    setSelectedRoomId(roomId);
    setEditingPatientId(patientId);
    setIsAssigningPatient(true);
  };
  
  // Handle saving room layout
  const handleSaveLayout = async (layout: any) => {
    if (!selectedRoomId) {
      console.error("선택된 병실 ID가 없습니다.");
      return;
    }
    
    try {
      console.log("레이아웃 저장 요청:", selectedRoomId, layout);
      
      // 현재 선택된 방을 찾아 레이아웃 업데이트
      const updatedRooms = dummyRooms.map(room => {
        if (room.id === selectedRoomId) {
          console.log("이전 레이아웃:", room.layout);
          const updatedRoom = { 
            ...room, 
            layout: JSON.stringify(layout) 
          };
          console.log("업데이트된 레이아웃:", updatedRoom.layout);
          return updatedRoom;
        }
        return room;
      });
      
      // dummyRooms 배열 업데이트 (전체 배열 교체가 아닌 참조 업데이트)
      // React 상태 업데이트를 위해 복사본 생성
      setDummyRooms([...updatedRooms]);
      
      // 저장 성공 알림 표시
      toast({
        title: "저장되었습니다",
        description: "병실 레이아웃이 성공적으로 저장되었습니다.",
      });
      
      console.log("레이아웃 저장 완료:", selectedRoomId);
      console.log("업데이트된 병실 데이터:", dummyRooms.find(r => r.id === selectedRoomId));
      
      // 나중에 실제 API 구현시 주석 해제
      // await apiRequest("PUT", `/api/rooms/${selectedRoomId}/layout`, layout);
      // queryClient.invalidateQueries({ queryKey: ['/api/rooms/with-patients'] });
      // queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
    } catch (error) {
      console.error("레이아웃 저장 실패:", error);
      
      toast({
        title: "저장 실패",
        description: "레이아웃 저장 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };
  
  // 임시 환자 상세 데이터
  const PATIENT_DETAILS: any = {
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
      fallRisk: "high",
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
      fallRisk: "medium",
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
    },
    3: {
      id: 3,
      name: "박환자",
      age: 72,
      gender: "남",
      birthDate: "1953-08-25",
      roomNumber: "102",
      bedNumber: 1,
      diagnosis: "폐렴",
      admissionDate: "2025-03-15",
      expectedDischargeDate: "2025-03-30",
      guardian: {
        name: "박보호자",
        relation: "자녀",
        contact: "010-3456-7890"
      },
      address: "서울시 강서구 화곡동 789-12",
      contact: "010-7654-3210",
      condition: "주의",
      nurseInCharge: "최간호사",
      fallRisk: "high",
      fallRiskScore: 82,
      fallHistory: [
        { date: "2025-03-18", time: "07:30", severity: "심각", location: "병실", description: "기립성 현기증으로 인한 낙상" }
      ],
      medications: [
        { name: "항생제", dosage: "500mg", frequency: "1일 3회", timing: "아침, 점심, 저녁 식후" }
      ],
      notes: [
        { date: "2025-03-25", author: "최간호사", content: "열 감소. 기침 완화 중." }
      ],
      vitalSigns: [
        { date: "2025-03-25", bloodPressure: "135/85", heartRate: 85, temperature: 37.8, respiratoryRate: 20 }
      ]
    }
  };

  // Handle selecting a room
  const selectRoom = (roomId: number) => {
    setSelectedRoomId(roomId);
    setActiveTab("details");
    
    // 환자 세부정보 보기 상태 초기화
    setIsViewingPatientDetails(false);
    setSelectedPatientId(null);
  };
  
  // Get status badge for room
  const getRoomStatusBadge = (status: string) => {
    switch (status) {
      case 'alert':
        return (
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
            <span className="text-red-600">{t('common.fallDetected')}</span>
          </div>
        );
      case 'warning':
        return (
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-yellow-500 mr-1" />
            <span className="text-yellow-600">{t('common.temperatureHigh')}</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-600">{t('common.normal')}</span>
          </div>
        );
    }
  };
  
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">{t('rooms.title')}</h1>
          <p className="text-neutral-500">{t('rooms.subtitle')}</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => selectedRoomId && setIsAddingBed(true)} disabled={!selectedRoomId}>
            <BedDouble className="h-4 w-4 mr-1.5" />
            침대 추가
          </Button>
          <Button onClick={() => setIsAddingRoom(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            {t('rooms.addRoom')}
          </Button>
        </div>
      </div>
      
      {/* Room Management Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Floor & Room Management */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">{t('common.roomManagement')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {/* 층 선택 메뉴 */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium">층 선택</h3>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsAddingFloor(true)}
                    className="px-2 h-8"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    층 추가
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={floors.length <= 1}
                    onClick={() => {
                      if (floors.length > 1) {
                        const updatedFloors = floors.filter(f => f !== selectedFloor);
                        setFloors(updatedFloors);
                        setSelectedFloor(updatedFloors[0]);
                        toast({
                          title: "층 제거됨",
                          description: `${selectedFloor}층이 제거되었습니다.`,
                        });
                      }
                    }}
                    className="px-2 h-8 text-red-500 hover:bg-red-50 hover:text-red-600 border-red-200 hover:border-red-300"
                  >
                    층 제거
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {floors.map((floor) => (
                  <Button 
                    key={floor}
                    variant={selectedFloor === floor ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedFloor(floor)}
                    className="min-w-[40px]"
                  >
                    {floor}층
                  </Button>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-2">{selectedFloor}층 병실 목록</h3>
              
              {roomsLoading ? (
                <div className="flex justify-center items-center p-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <div className="divide-y border rounded">
                  {/* 여기서는 모든 방을 보여주지만, 실제로는 선택된 층에 해당하는 방만 필터링해서 보여줘야 함 */}
                  {/* 실제 구현 시 방 번호의 첫 자리가 층을 나타낸다고 가정 */}
                  {roomsWithPatients?.filter(room => {
                    // 방 이름에서 첫 번째 숫자가 층 번호를 나타낸다고 가정 (예: 101호, 102호는 1층)
                    const floorNumber = parseInt(room.name.charAt(0));
                    return floorNumber === selectedFloor;
                  }).map((room) => (
                    <div 
                      key={room.id}
                      className={`p-3 cursor-pointer transition-colors ${selectedRoomId === room.id ? 'bg-blue-50' : 'hover:bg-neutral-50'}`}
                      onClick={() => selectRoom(room.id)}
                    >
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">{room.name}</h3>
                        <div className="text-sm text-neutral-500">
                          {room.patients.length} {t('rooms.patients')}
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-2 text-sm">
                        <div className="flex items-center">
                          <Thermometer className="h-4 w-4 text-yellow-500 mr-1" />
                          <span>{room.currentTemp ? room.currentTemp.toFixed(1) : "N/A"}°C</span>
                        </div>
                        <div className="flex items-center">
                          <Droplets className="h-4 w-4 text-blue-500 mr-1" />
                          <span>{room.currentHumidity ? room.currentHumidity.toFixed(0) : "N/A"}%</span>
                        </div>
                        {room.status ? getRoomStatusBadge(room.status) : null}
                      </div>
                    </div>
                  ))}
                  
                  {roomsWithPatients?.filter(room => {
                    const floorNumber = parseInt(room.name.charAt(0));
                    return floorNumber === selectedFloor;
                  }).length === 0 && (
                    <div className="p-4 text-center text-gray-500">
                      이 층에 등록된 병실이 없습니다.
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Room Details */}
        {selectedRoom ? (
          <Card className="lg:col-span-3">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xl">{selectedRoom.name}</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setEditingRoom(selectedRoom)}>
                <Pencil className="h-4 w-4 mr-1.5" />
                {t('common.edit')}
              </Button>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-2 mb-6">
                  <TabsTrigger value="details">{t('common.details')}</TabsTrigger>
                  <TabsTrigger value="patients">{t('rooms.patients')}</TabsTrigger>
                </TabsList>
                
                {/* Room Details Tab */}
                <TabsContent value="details" className="mt-0 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500 mb-2">{t('rooms.temperature')}</h3>
                      <div className="flex items-center mb-2">
                        <Thermometer className="h-5 w-5 text-yellow-500 mr-2" />
                        <span className="text-2xl font-bold">{selectedRoom.currentTemp ? selectedRoom.currentTemp.toFixed(1) : "N/A"}°C</span>
                      </div>
                      <div className="text-sm text-neutral-500">
                        {t('rooms.tempThreshold')}: {selectedRoom.tempThreshold}°C
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500 mb-2">{t('rooms.humidity')}</h3>
                      <div className="flex items-center mb-2">
                        <Droplets className="h-5 w-5 text-blue-500 mr-2" />
                        <span className="text-2xl font-bold">{selectedRoom.currentHumidity ? selectedRoom.currentHumidity.toFixed(0) : "N/A"}%</span>
                      </div>
                      <div className="text-sm text-neutral-500">
                        {t('rooms.humidityThreshold')}: {selectedRoom.humidityThreshold}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-neutral-200 pt-4 mt-4">
                    <h3 className="text-sm font-medium text-neutral-500 mb-2">{t('common.status')}</h3>
                    <div className="p-3 rounded bg-neutral-50">
                      {selectedRoom.status ? getRoomStatusBadge(selectedRoom.status) : null}
                    </div>
                  </div>
                </TabsContent>
                

                
                {/* Patients Tab */}
                <TabsContent value="patients" className="mt-0">
                  {selectedRoom.patients.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('common.name')}</TableHead>
                          <TableHead>{t('dashboard.age')}</TableHead>
                          <TableHead>{t('dashboard.fallRisk')}</TableHead>
                          <TableHead>{t('rooms.beds')}</TableHead>
                          <TableHead>담당 간호사</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedRoom.patients.map((patient) => (
                          <TableRow 
                            key={patient.id} 
                            className="hover:bg-gray-50"
                          >
                            <TableCell className="font-medium">{patient.name}</TableCell>
                            <TableCell>
                              {/* 환자 ID가 있는 경우 PATIENT_DETAILS에서 나이 정보 가져오기 */}
                              {patient.userId && PATIENT_DETAILS[patient.userId] 
                                ? PATIENT_DETAILS[patient.userId].age 
                                : (patient.age || "-")}
                            </TableCell>
                            <TableCell>
                              {/* 환자 ID가 있는 경우 PATIENT_DETAILS에서 낙상위험도 정보 가져오기 */}
                              {patient.userId && PATIENT_DETAILS[patient.userId] ? (
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  PATIENT_DETAILS[patient.userId].fallRisk === 'high' ? 'bg-red-100 text-red-800' :
                                  PATIENT_DETAILS[patient.userId].fallRisk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {PATIENT_DETAILS[patient.userId].fallRisk === 'high' ? t('dashboard.highRisk') :
                                   PATIENT_DETAILS[patient.userId].fallRisk === 'medium' ? t('dashboard.mediumRisk') :
                                   t('dashboard.lowRisk')}
                                </span>
                              ) : (
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  patient.fallRisk === 'high' ? 'bg-red-100 text-red-800' :
                                  patient.fallRisk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {patient.fallRisk === 'high' ? t('dashboard.highRisk') :
                                   patient.fallRisk === 'medium' ? t('dashboard.mediumRisk') :
                                   t('dashboard.lowRisk')}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>{patient.bedNumber}</TableCell>
                            <TableCell>
                              {patient.assignedNurseId ? (
                                <span>{getNurseName(patient.assignedNurseId)}</span>
                              ) : (
                                <span className="text-gray-400">미배정</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedPatientId(patient.id);
                                    setIsViewingPatientDetails(true);
                                  }}
                                >
                                  {t('common.details')}
                                </Button>
                                <Button 
                                  variant="default" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // null 체크 추가
                                    if (selectedRoomId !== null) {
                                      assignPatientToRoom(selectedRoomId, patient.id);
                                    }
                                  }}
                                >
                                  환자 배정
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center p-8 border rounded-md">
                      <div className="text-neutral-400 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <p className="text-neutral-500">{t('rooms.emptyRoom')}</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <Card className="lg:col-span-3">
            <CardContent className="flex justify-center items-center h-64 text-neutral-500">
              {roomsLoading ? 
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div> :
                "Select a room to view details"
              }
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* 침대 추가 다이얼로그 */}
      <Dialog open={isAddingBed} onOpenChange={(open) => {
        if (!open) {
          setIsAddingBed(false);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>침대 추가</DialogTitle>
            <DialogDescription>
              {selectedRoom ? `${selectedRoom.name} 병실에 새 침대를 추가합니다.` : '병실에 새 침대를 추가합니다.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="bedNumber">침대 번호</Label>
              <Input
                id="bedNumber"
                type="number"
                min="1"
                placeholder="침대 번호를 입력하세요"
                className="mt-1"
                defaultValue={selectedRoom?.patients.length ? selectedRoom.patients.length + 1 : 1}
              />
            </div>
            
            <div className="pt-4 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddingBed(false)}>취소</Button>
              <Button onClick={() => {
                if (!selectedRoomId) return;
                
                // 현재 선택된 방의 인덱스 찾기
                const roomIndex = dummyRooms.findIndex(r => r.id === selectedRoomId);
                if (roomIndex === -1) return;
                
                // 입력된 침대 번호 가져오기
                const bedNumber = parseInt((document.getElementById('bedNumber') as HTMLInputElement).value);
                
                // 이미 존재하는 침대 번호인지 확인
                const existingBed = dummyRooms[roomIndex].patients.find(p => p.bedNumber === bedNumber);
                if (existingBed) {
                  toast({
                    title: "침대 번호 중복",
                    description: `${bedNumber}번 침대가 이미 존재합니다.`,
                    variant: "destructive"
                  });
                  return;
                }
                
                // 새 환자 ID 생성 (현재 최대 ID + 1)
                const maxPatientId = Math.max(
                  0, 
                  ...dummyRooms.flatMap(r => r.patients).map(p => p.id)
                );
                const newPatientId = maxPatientId + 1;
                
                // 새 환자(비어있는 침대) 추가
                const newPatient = {
                  id: newPatientId,
                  name: `침대 ${bedNumber}`,
                  age: 0,
                  roomId: selectedRoomId,
                  bedNumber: bedNumber,
                  fallRisk: "low" as const,
                  userId: null,
                  height: null,
                  weight: null,
                  blood: null,
                  assignedNurseId: null
                };
                
                // 레이아웃 업데이트
                const room = dummyRooms[roomIndex];
                let layout = { beds: [], objects: [] };
                
                if (room.layout) {
                  try {
                    layout = JSON.parse(room.layout);
                  } catch (e) {
                    console.error("레이아웃 파싱 오류:", e);
                  }
                }
                
                // 새 침대 추가 (기본 위치)
                const newBed = {
                  id: `${layout.beds.length + 1}`,
                  x: 10 + (layout.beds.length * 100),
                  y: 10,
                  width: 80,
                  height: 180,
                  rotation: 0,
                  patientId: newPatientId
                };
                
                // 타입스크립트 오류를 우회하기 위해 any 타입으로 변환
                const bedsArray = layout.beds as any[];
                bedsArray.push(newBed);
                
                // 업데이트할 룸 데이터 생성
                const updatedRoom = {
                  ...room,
                  layout: JSON.stringify(layout),
                  patients: [...room.patients, newPatient]
                };
                
                // dummyRooms 배열 업데이트 (React 상태 업데이트를 위한 새 배열 생성)
                const updatedRooms = [...dummyRooms];
                updatedRooms[roomIndex] = updatedRoom;
                setDummyRooms(updatedRooms);
                
                // 침대 추가 후 자동으로 UI가 갱신됩니다.
                
                // UI 업데이트
                toast({
                  title: "침대 추가됨",
                  description: `${bedNumber}번 침대가 성공적으로 추가되었습니다.`,
                });
                
                // 환자 탭으로 변경
                setActiveTab("patients");
                
                // 다이얼로그 닫기
                setIsAddingBed(false);
              }}>침대 추가</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* 환자 배정 다이얼로그 */}
      <Dialog open={isAssigningPatient} onOpenChange={(open) => {
        if (!open) {
          setIsAssigningPatient(false);
          setEditingPatientId(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>환자 배정</DialogTitle>
            <DialogDescription>
              {editingPatientId && selectedRoom?.patients.find(p => p.id === editingPatientId)?.name} 환자의 담당 간호사를 배정합니다.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="nurseId">담당 간호사</Label>
              <Select 
                defaultValue={editingPatientId ? 
                  String(selectedRoom?.patients.find(p => p.id === editingPatientId)?.assignedNurseId || "none") : 
                  "none"
                }
                onValueChange={(value) => {
                  // 선택된 값을 직접 상태로 관리하여 참조할 수 있게 합니다
                  const nurseIdElement = document.getElementById("nurseSelect");
                  if (nurseIdElement) {
                    nurseIdElement.setAttribute("data-value", value);
                  }
                }}
              >
                <SelectTrigger id="nurseSelect">
                  <SelectValue placeholder="담당 간호사를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">미배정</SelectItem>
                  {dummyNurses.map(nurse => (
                    <SelectItem key={nurse.id} value={String(nurse.id)}>
                      {nurse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="patientId">환자 배정</Label>
              <Select 
                defaultValue={editingPatientId && selectedRoom?.patients.find(p => p.id === editingPatientId)?.userId ? 
                  String(selectedRoom?.patients.find(p => p.id === editingPatientId)?.userId) : 
                  "none"
                }
                onValueChange={(value) => {
                  // 선택된 값을 직접 상태로 관리하여 참조할 수 있게 합니다
                  const patientIdElement = document.getElementById("patientSelect");
                  if (patientIdElement) {
                    patientIdElement.setAttribute("data-value", value);
                  }
                }}
              >
                <SelectTrigger id="patientSelect">
                  <SelectValue placeholder="환자를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">미배정</SelectItem>
                  {dummyPatients.map(patient => (
                    <SelectItem key={patient.id} value={String(patient.id)}>
                      {patient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="pt-4 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAssigningPatient(false)}>취소</Button>
              <Button onClick={() => {
                if (!editingPatientId || !selectedRoomId) return;
                
                // 현재 선택된 방의 인덱스 찾기
                const roomIndex = dummyRooms.findIndex(r => r.id === selectedRoomId);
                if (roomIndex === -1) return;
                
                // 선택된 값 가져오기
                const nurseIdElement = document.getElementById("nurseSelect");
                const patientIdElement = document.getElementById("patientSelect");
                
                const nurseId = nurseIdElement?.getAttribute('data-value') || "none";
                const patientUserId = patientIdElement?.getAttribute('data-value') || "none";
                
                console.log("선택된 간호사 ID:", nurseId);
                console.log("선택된 환자 ID:", patientUserId);
                
                // 환자 정보 업데이트
                const assignedNurseId = nurseId === "none" ? null : parseInt(nurseId);
                const assignedPatientId = patientUserId === "none" ? null : parseInt(patientUserId);
                
                // 이름 업데이트 - 환자가 배정되면 환자의 이름을 사용
                let patientName = "";
                if (assignedPatientId) {
                  patientName = dummyPatients.find(p => p.id === assignedPatientId)?.name || "";
                }
                
                // 모든 방의 사본 만들기
                const updatedRooms = [...dummyRooms];
                
                // 같은 환자가 이미 다른 침대에 배정되어 있는지 확인
                if (assignedPatientId) {
                  // 모든 방을 검사
                  updatedRooms.forEach((room, roomIdx) => {
                    // 현재 방의 모든 환자를 검사
                    room.patients.forEach((patient, patientIdx) => {
                      // 환자가 이 방에 있고 현재 편집 중인 환자가 아니라면
                      if (patient.userId === assignedPatientId && 
                          !(roomIdx === roomIndex && patient.id === editingPatientId)) {
                        
                        console.log(`환자 ID ${assignedPatientId}가 이미 ${room.name}의 침대 ${patient.bedNumber}에 배정되어 있습니다. 이동합니다.`);
                        
                        // 해당 환자의 할당 해제
                        updatedRooms[roomIdx].patients = updatedRooms[roomIdx].patients.map(p => 
                          p.id === patient.id
                            ? { ...p, userId: null, name: `침대 ${p.bedNumber}` }
                            : p
                        );
                        
                        toast({
                          title: "환자 이동",
                          description: "다른 침대에 배정된 환자를 새 위치로 이동했습니다.",
                        });
                      }
                    });
                  });
                }
                
                // 환자 인덱스 찾기
                const patientIndex = updatedRooms[roomIndex].patients.findIndex(p => p.id === editingPatientId);
                
                if (patientIndex !== -1) {
                  // 환자가 존재하면 정보 업데이트
                  updatedRooms[roomIndex] = {
                    ...updatedRooms[roomIndex],
                    patients: updatedRooms[roomIndex].patients.map((p, idx) => 
                      idx === patientIndex
                        ? { 
                            ...p, 
                            assignedNurseId, 
                            userId: assignedPatientId,
                            name: assignedPatientId && patientName ? patientName : `침대 ${p.bedNumber}`
                          }
                        : p
                    )
                  };
                } else {
                  // 환자가 존재하지 않으면 새로 추가 (이 경우는 발생하지 않아야 하지만 안전을 위해 추가)
                  console.error("편집하려는 환자 ID가 병실에 존재하지 않습니다:", editingPatientId);
                }
                
                // 상태 업데이트
                setDummyRooms(updatedRooms);
                
                // UI 업데이트
                toast({
                  title: "환자 배정 완료",
                  description: `담당 간호사가 ${assignedNurseId ? getNurseName(assignedNurseId) : '미배정'}(으)로 설정되었습니다.`,
                });
                
                // 다이얼로그 닫기
                setIsAssigningPatient(false);

              }}>저장</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Patient Details Dialog */}
      <Dialog open={isViewingPatientDetails} onOpenChange={(open) => {
        if (!open) {
          setIsViewingPatientDetails(false);
          setSelectedPatientId(null);
        }
      }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Button variant="ghost" size="sm" onClick={() => setIsViewingPatientDetails(false)} className="mr-2">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  {t('common.back')}
                </Button>
                <DialogTitle className="text-xl">
                  {selectedPatientId && PATIENT_DETAILS[selectedPatientId]?.name} {t('common.details')}
                </DialogTitle>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                selectedPatientId && PATIENT_DETAILS[selectedPatientId]?.condition === "안정" ? "bg-green-100 text-green-800" : 
                selectedPatientId && PATIENT_DETAILS[selectedPatientId]?.condition === "주의" ? "bg-yellow-100 text-yellow-800" : 
                "bg-red-100 text-red-800"
              }`}>
                {selectedPatientId && PATIENT_DETAILS[selectedPatientId]?.condition}
              </span>
            </div>
          </DialogHeader>
          
          {selectedPatientId && PATIENT_DETAILS[selectedPatientId] && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
              <div className="lg:col-span-1 space-y-6">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                    <CardTitle>{t('common.basicInfo')}</CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-blue-600"
                      onClick={() => {
                        // 상세 정보를 수정하기 위한 초기 상태 설정
                        setEditedPatientDetails({...PATIENT_DETAILS[selectedPatientId]});
                        setIsEditingBasicInfo(true);
                      }}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      {t('common.edit')}
                    </Button>
                  </div>
                  </CardHeader>
                  <CardContent>
                    {isEditingBasicInfo ? (
                      // 수정 폼
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label htmlFor="patientName">{t('common.name')}</Label>
                          <Input 
                            id="patientName" 
                            value={editedPatientDetails?.name || ''} 
                            onChange={(e) => setEditedPatientDetails({
                              ...editedPatientDetails,
                              name: e.target.value
                            })}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label htmlFor="patientAge">{t('dashboard.age')}</Label>
                            <Input 
                              id="patientAge" 
                              type="number"
                              value={editedPatientDetails?.age || 0} 
                              onChange={(e) => setEditedPatientDetails({
                                ...editedPatientDetails,
                                age: parseInt(e.target.value)
                              })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="patientGender">{t('common.gender')}</Label>
                            <Select 
                              defaultValue={editedPatientDetails?.gender || '남'}
                              onValueChange={(value) => setEditedPatientDetails({
                                ...editedPatientDetails,
                                gender: value
                              })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="남">남</SelectItem>
                                <SelectItem value="여">여</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="patientBirthdate">{t('common.birthDate')}</Label>
                          <Input 
                            id="patientBirthdate" 
                            value={editedPatientDetails?.birthDate || ''} 
                            onChange={(e) => setEditedPatientDetails({
                              ...editedPatientDetails,
                              birthDate: e.target.value
                            })}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label htmlFor="patientRoomNumber">{t('common.roomNumber')}</Label>
                            <Input 
                              id="patientRoomNumber" 
                              value={editedPatientDetails?.roomNumber || ''} 
                              onChange={(e) => setEditedPatientDetails({
                                ...editedPatientDetails,
                                roomNumber: e.target.value
                              })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="patientBedNumber">{t('common.bedNumber')}</Label>
                            <Input 
                              id="patientBedNumber" 
                              type="number"
                              value={editedPatientDetails?.bedNumber || 0} 
                              onChange={(e) => setEditedPatientDetails({
                                ...editedPatientDetails,
                                bedNumber: parseInt(e.target.value)
                              })}
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="patientDiagnosis">{t('common.diagnosis')}</Label>
                          <Input 
                            id="patientDiagnosis" 
                            value={editedPatientDetails?.diagnosis || ''} 
                            onChange={(e) => setEditedPatientDetails({
                              ...editedPatientDetails,
                              diagnosis: e.target.value
                            })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="patientAdmissionDate">{t('common.admissionDate')}</Label>
                          <Input 
                            id="patientAdmissionDate" 
                            value={editedPatientDetails?.admissionDate || ''} 
                            onChange={(e) => setEditedPatientDetails({
                              ...editedPatientDetails,
                              admissionDate: e.target.value
                            })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="patientDischargeDate">{t('common.dischargeDate')}</Label>
                          <Input 
                            id="patientDischargeDate" 
                            value={editedPatientDetails?.expectedDischargeDate || ''} 
                            onChange={(e) => setEditedPatientDetails({
                              ...editedPatientDetails,
                              expectedDischargeDate: e.target.value
                            })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="patientAddress">{t('common.address')}</Label>
                          <Input 
                            id="patientAddress" 
                            value={editedPatientDetails?.address || ''} 
                            onChange={(e) => setEditedPatientDetails({
                              ...editedPatientDetails,
                              address: e.target.value
                            })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="patientContact">{t('common.contact')}</Label>
                          <Input 
                            id="patientContact" 
                            value={editedPatientDetails?.contact || ''} 
                            onChange={(e) => setEditedPatientDetails({
                              ...editedPatientDetails,
                              contact: e.target.value
                            })}
                          />
                        </div>
                        <div className="pt-3 flex justify-end space-x-2">
                          <Button 
                            variant="outline"
                            onClick={() => {
                              setIsEditingBasicInfo(false);
                              setEditedPatientDetails(null);
                            }}
                          >
                            취소
                          </Button>
                          <Button 
                            onClick={() => {
                              if (!selectedPatientId || !editedPatientDetails) return;
                              
                              // 환자 데이터 업데이트
                              PATIENT_DETAILS[selectedPatientId] = {
                                ...PATIENT_DETAILS[selectedPatientId],
                                ...editedPatientDetails
                              };
                              
                              // UI 업데이트
                              toast({
                                title: "환자 정보가 업데이트되었습니다",
                                description: "환자의 기본 정보가 성공적으로 저장되었습니다."
                              });
                              
                              // 편집 모드 종료
                              setIsEditingBasicInfo(false);
                            }}
                          >
                            저장
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // 기본 정보 표시
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm font-medium mr-2">{t('common.name')}:</span>
                          <span className="text-sm">{PATIENT_DETAILS[selectedPatientId].name}</span>
                        </div>
                        <div className="flex items-center">
                          <CalendarClock className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm font-medium mr-2">{t('dashboard.age')}:</span>
                          <span className="text-sm">{PATIENT_DETAILS[selectedPatientId].age}세 ({PATIENT_DETAILS[selectedPatientId].gender})</span>
                        </div>
                        <div className="flex items-center">
                          <CalendarClock className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm font-medium mr-2">{t('common.birthDate')}:</span>
                          <span className="text-sm">{PATIENT_DETAILS[selectedPatientId].birthDate}</span>
                        </div>
                        <div className="flex items-center">
                          <BedDouble className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm font-medium mr-2">{t('common.roomBed')}:</span>
                          <span className="text-sm">{PATIENT_DETAILS[selectedPatientId].roomNumber}호 {PATIENT_DETAILS[selectedPatientId].bedNumber}번 침대</span>
                        </div>
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm font-medium mr-2">{t('common.diagnosis')}:</span>
                          <span className="text-sm">{PATIENT_DETAILS[selectedPatientId].diagnosis}</span>
                        </div>
                        <div className="flex items-center">
                          <CalendarClock className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm font-medium mr-2">{t('common.admissionDate')}:</span>
                          <span className="text-sm">{PATIENT_DETAILS[selectedPatientId].admissionDate}</span>
                        </div>
                        <div className="flex items-center">
                          <CalendarClock className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm font-medium mr-2">{t('common.dischargeDate')}:</span>
                          <span className="text-sm">{PATIENT_DETAILS[selectedPatientId].expectedDischargeDate}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm font-medium mr-2">{t('common.address')}:</span>
                          <span className="text-sm">{PATIENT_DETAILS[selectedPatientId].address}</span>
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm font-medium mr-2">{t('common.contact')}:</span>
                          <span className="text-sm">{PATIENT_DETAILS[selectedPatientId].contact}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle>{t('common.guardianInfo')}</CardTitle>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-blue-600"
                        onClick={() => {
                          // 보호자 정보를 수정하기 위한 초기 상태 설정
                          setEditedPatientDetails({
                            ...editedPatientDetails,
                            guardian: {...PATIENT_DETAILS[selectedPatientId].guardian}
                          });
                          setIsEditingGuardianInfo(true);
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        {t('common.edit')}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isEditingGuardianInfo ? (
                      // 보호자 정보 수정 폼
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label htmlFor="guardianName">{t('common.guardianName')}</Label>
                          <Input 
                            id="guardianName" 
                            value={editedPatientDetails?.guardian?.name || ''} 
                            onChange={(e) => setEditedPatientDetails({
                              ...editedPatientDetails,
                              guardian: {
                                ...editedPatientDetails?.guardian,
                                name: e.target.value
                              }
                            })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="guardianRelation">{t('common.relation')}</Label>
                          <Input 
                            id="guardianRelation" 
                            value={editedPatientDetails?.guardian?.relation || ''} 
                            onChange={(e) => setEditedPatientDetails({
                              ...editedPatientDetails,
                              guardian: {
                                ...editedPatientDetails?.guardian,
                                relation: e.target.value
                              }
                            })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="guardianContact">{t('common.guardianContact')}</Label>
                          <Input 
                            id="guardianContact" 
                            value={editedPatientDetails?.guardian?.contact || ''} 
                            onChange={(e) => setEditedPatientDetails({
                              ...editedPatientDetails,
                              guardian: {
                                ...editedPatientDetails?.guardian,
                                contact: e.target.value
                              }
                            })}
                          />
                        </div>
                        <div className="pt-3 flex justify-end space-x-2">
                          <Button 
                            variant="outline"
                            onClick={() => {
                              setIsEditingGuardianInfo(false);
                            }}
                          >
                            취소
                          </Button>
                          <Button 
                            onClick={() => {
                              if (!selectedPatientId || !editedPatientDetails || !editedPatientDetails.guardian) return;
                              
                              // 보호자 데이터 업데이트
                              PATIENT_DETAILS[selectedPatientId].guardian = {
                                ...editedPatientDetails.guardian
                              };
                              
                              // UI 업데이트
                              toast({
                                title: "보호자 정보가 업데이트되었습니다",
                                description: "환자의 보호자 정보가 성공적으로 저장되었습니다."
                              });
                              
                              // 편집 모드 종료
                              setIsEditingGuardianInfo(false);
                            }}
                          >
                            저장
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // 기본 보호자 정보 표시
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm font-medium mr-2">{t('common.guardianName')}:</span>
                          <span className="text-sm">{PATIENT_DETAILS[selectedPatientId].guardian.name} ({PATIENT_DETAILS[selectedPatientId].guardian.relation})</span>
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm font-medium mr-2">{t('common.guardianContact')}:</span>
                          <span className="text-sm">{PATIENT_DETAILS[selectedPatientId].guardian.contact}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <div className="lg:col-span-2">
                <Tabs defaultValue="fallRisk">
                  <TabsList className="grid grid-cols-3 mb-4">
                    <TabsTrigger value="fallRisk">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      <span>{t('dashboard.fallRisk')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="vitalSigns">
                      <HeartPulse className="h-4 w-4 mr-2" />
                      <span>{t('common.vitalSigns')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="medications">
                      <Clipboard className="h-4 w-4 mr-2" />
                      <span>{t('common.medications')}</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="fallRisk">
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle>{t('dashboard.fallRisk')}</CardTitle>
                            <CardDescription>{t('common.fallRiskDesc')}</CardDescription>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-blue-600"
                            onClick={() => {
                              setEditedPatientDetails({
                                ...editedPatientDetails,
                                fallRisk: PATIENT_DETAILS[selectedPatientId].fallRisk,
                                fallRiskScore: PATIENT_DETAILS[selectedPatientId].fallRiskScore,
                                fallHistory: [...PATIENT_DETAILS[selectedPatientId].fallHistory]
                              });
                              setIsEditingFallRisk(true);
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            {t('common.edit')}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {isEditingFallRisk ? (
                          // 낙상 위험 수정 폼
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="fallRisk">{t('dashboard.riskLevel')}</Label>
                              <Select 
                                defaultValue={editedPatientDetails?.fallRisk}
                                onValueChange={(value) => setEditedPatientDetails({
                                  ...editedPatientDetails,
                                  fallRisk: value
                                })}
                              >
                                <SelectTrigger id="fallRisk">
                                  <SelectValue placeholder={t('dashboard.selectRisk')} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">{t('dashboard.lowRisk')}</SelectItem>
                                  <SelectItem value="medium">{t('dashboard.mediumRisk')}</SelectItem>
                                  <SelectItem value="high">{t('dashboard.highRisk')}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="fallRiskScore">{t('dashboard.riskScore')} (0-100)</Label>
                              <Input 
                                id="fallRiskScore" 
                                type="number" 
                                min="0"
                                max="100"
                                value={editedPatientDetails?.fallRiskScore || 0} 
                                onChange={(e) => setEditedPatientDetails({
                                  ...editedPatientDetails,
                                  fallRiskScore: parseInt(e.target.value)
                                })}
                              />
                              <Progress value={editedPatientDetails?.fallRiskScore || 0} className="h-2" />
                            </div>

                            <div className="pt-4 border-t">
                              <div className="flex justify-between items-center mb-3">
                                <h4 className="text-sm font-medium">{t('dashboard.fallHistory')}</h4>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    const today = new Date();
                                    const dateStr = today.toISOString().split('T')[0];
                                    const timeStr = today.toTimeString().substring(0, 5);
                                    
                                    const newFallHistory = [
                                      ...(editedPatientDetails?.fallHistory || []),
                                      { 
                                        date: dateStr,
                                        time: timeStr,
                                        severity: "경미",
                                        location: "",
                                        description: ""
                                      }
                                    ];
                                    
                                    setEditedPatientDetails({
                                      ...editedPatientDetails,
                                      fallHistory: newFallHistory
                                    });
                                  }}
                                >
                                  <Plus className="h-3.5 w-3.5 mr-1" />
                                  낙상 기록 추가
                                </Button>
                              </div>
                              
                              {editedPatientDetails?.fallHistory?.length > 0 ? (
                                <div className="space-y-3">
                                  {editedPatientDetails.fallHistory.map((fall: any, index: number) => (
                                    <div key={index} className="bg-gray-50 p-3 rounded border">
                                      <div className="grid grid-cols-2 gap-3 mb-2">
                                        <div className="space-y-1">
                                          <Label htmlFor={`fall-date-${index}`}>날짜</Label>
                                          <Input 
                                            id={`fall-date-${index}`} 
                                            value={fall.date} 
                                            onChange={(e) => {
                                              const newHistory = [...editedPatientDetails.fallHistory];
                                              newHistory[index] = {
                                                ...newHistory[index],
                                                date: e.target.value
                                              };
                                              setEditedPatientDetails({
                                                ...editedPatientDetails,
                                                fallHistory: newHistory
                                              });
                                            }}
                                          />
                                        </div>
                                        <div className="space-y-1">
                                          <Label htmlFor={`fall-time-${index}`}>시간</Label>
                                          <Input 
                                            id={`fall-time-${index}`} 
                                            value={fall.time} 
                                            onChange={(e) => {
                                              const newHistory = [...editedPatientDetails.fallHistory];
                                              newHistory[index] = {
                                                ...newHistory[index],
                                                time: e.target.value
                                              };
                                              setEditedPatientDetails({
                                                ...editedPatientDetails,
                                                fallHistory: newHistory
                                              });
                                            }}
                                          />
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-3 mb-2">
                                        <div className="space-y-1">
                                          <Label htmlFor={`fall-severity-${index}`}>심각도</Label>
                                          <Select 
                                            defaultValue={fall.severity}
                                            onValueChange={(value) => {
                                              const newHistory = [...editedPatientDetails.fallHistory];
                                              newHistory[index] = {
                                                ...newHistory[index],
                                                severity: value
                                              };
                                              setEditedPatientDetails({
                                                ...editedPatientDetails,
                                                fallHistory: newHistory
                                              });
                                            }}
                                          >
                                            <SelectTrigger id={`fall-severity-${index}`}>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="경미">경미</SelectItem>
                                              <SelectItem value="중간">중간</SelectItem>
                                              <SelectItem value="심각">심각</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="space-y-1">
                                          <Label htmlFor={`fall-location-${index}`}>위치</Label>
                                          <Input 
                                            id={`fall-location-${index}`} 
                                            value={fall.location} 
                                            onChange={(e) => {
                                              const newHistory = [...editedPatientDetails.fallHistory];
                                              newHistory[index] = {
                                                ...newHistory[index],
                                                location: e.target.value
                                              };
                                              setEditedPatientDetails({
                                                ...editedPatientDetails,
                                                fallHistory: newHistory
                                              });
                                            }}
                                          />
                                        </div>
                                      </div>
                                      <div className="space-y-1">
                                        <Label htmlFor={`fall-desc-${index}`}>설명</Label>
                                        <Input 
                                          id={`fall-desc-${index}`} 
                                          value={fall.description} 
                                          onChange={(e) => {
                                            const newHistory = [...editedPatientDetails.fallHistory];
                                            newHistory[index] = {
                                              ...newHistory[index],
                                              description: e.target.value
                                            };
                                            setEditedPatientDetails({
                                              ...editedPatientDetails,
                                              fallHistory: newHistory
                                            });
                                          }}
                                        />
                                      </div>
                                      <div className="mt-2 text-right">
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                          onClick={() => {
                                            const newHistory = [...editedPatientDetails.fallHistory];
                                            newHistory.splice(index, 1);
                                            setEditedPatientDetails({
                                              ...editedPatientDetails,
                                              fallHistory: newHistory
                                            });
                                          }}
                                        >
                                          삭제
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-gray-500 text-sm">{t('dashboard.noFallHistory')}</div>
                              )}
                            </div>
                            
                            <div className="pt-3 flex justify-end space-x-2">
                              <Button 
                                variant="outline"
                                onClick={() => {
                                  setIsEditingFallRisk(false);
                                }}
                              >
                                취소
                              </Button>
                              <Button 
                                onClick={() => {
                                  if (!selectedPatientId || !editedPatientDetails) return;
                                  
                                  // 낙상 위험 데이터 업데이트
                                  PATIENT_DETAILS[selectedPatientId].fallRisk = editedPatientDetails.fallRisk;
                                  PATIENT_DETAILS[selectedPatientId].fallRiskScore = editedPatientDetails.fallRiskScore;
                                  PATIENT_DETAILS[selectedPatientId].fallHistory = [...editedPatientDetails.fallHistory];
                                  
                                  // UI 업데이트
                                  toast({
                                    title: "낙상 위험도 정보가 업데이트되었습니다",
                                    description: "환자의 낙상 위험 정보가 성공적으로 저장되었습니다."
                                  });
                                  
                                  // 편집 모드 종료
                                  setIsEditingFallRisk(false);
                                }}
                              >
                                저장
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // 낙상 위험도 기본 정보 표시
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{t('dashboard.riskLevel')}:</span>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                PATIENT_DETAILS[selectedPatientId].fallRisk === "high" ? "bg-red-100 text-red-800" : 
                                PATIENT_DETAILS[selectedPatientId].fallRisk === "medium" ? "bg-yellow-100 text-yellow-800" : 
                                "bg-green-100 text-green-800"
                              }`}>
                                {PATIENT_DETAILS[selectedPatientId].fallRisk === "high" ? t('dashboard.highRisk') :
                                 PATIENT_DETAILS[selectedPatientId].fallRisk === "medium" ? t('dashboard.mediumRisk') :
                                 t('dashboard.lowRisk')}
                              </span>
                            </div>
                            
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm">{t('dashboard.riskScore')}: {PATIENT_DETAILS[selectedPatientId].fallRiskScore}/100</span>
                              </div>
                              <Progress value={PATIENT_DETAILS[selectedPatientId].fallRiskScore} className="h-2" />
                            </div>
                            
                            <div className="pt-2 border-t">
                              <h4 className="text-sm font-medium mb-2">{t('dashboard.fallHistory')}</h4>
                              {PATIENT_DETAILS[selectedPatientId].fallHistory.length > 0 ? (
                                <div className="space-y-2">
                                  {PATIENT_DETAILS[selectedPatientId].fallHistory.map((fall: any, index: number) => (
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
                                <div className="text-gray-500 text-sm">{t('dashboard.noFallHistory')}</div>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="vitalSigns">
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle>{t('common.vitalSigns')}</CardTitle>
                            <CardDescription>{t('common.recentVitalSigns')}</CardDescription>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-blue-600"
                            onClick={() => {
                              setEditedPatientDetails({
                                ...editedPatientDetails,
                                vitalSigns: [...PATIENT_DETAILS[selectedPatientId].vitalSigns]
                              });
                              setIsEditingVitalSigns(true);
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            {t('common.edit')}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {isEditingVitalSigns ? (
                          // 생체신호 수정 폼
                          <div className="space-y-4">
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="text-sm font-medium">생체 신호 기록</h4>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  // 현재 날짜 생성
                                  const today = new Date();
                                  const dateStr = today.toISOString().split('T')[0];
                                  
                                  // 새 생체신호 데이터 추가
                                  const newVitalSigns = [
                                    {
                                      date: dateStr,
                                      bloodPressure: "",
                                      heartRate: 0,
                                      temperature: 36.5,
                                      respiratoryRate: 0
                                    },
                                    ...(editedPatientDetails?.vitalSigns || [])
                                  ];
                                  
                                  setEditedPatientDetails({
                                    ...editedPatientDetails,
                                    vitalSigns: newVitalSigns
                                  });
                                }}
                              >
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                신규 측정 추가
                              </Button>
                            </div>
                            
                            {editedPatientDetails?.vitalSigns?.length > 0 ? (
                              <div className="space-y-4">
                                {editedPatientDetails.vitalSigns.map((vital: any, index: number) => (
                                  <div key={index} className="bg-gray-50 p-3 rounded border">
                                    <div className="space-y-2 mb-3">
                                      <Label htmlFor={`vital-date-${index}`}>측정일</Label>
                                      <Input 
                                        id={`vital-date-${index}`} 
                                        value={vital.date} 
                                        onChange={(e) => {
                                          const newVitalSigns = [...editedPatientDetails.vitalSigns];
                                          newVitalSigns[index] = {
                                            ...newVitalSigns[index],
                                            date: e.target.value
                                          };
                                          setEditedPatientDetails({
                                            ...editedPatientDetails,
                                            vitalSigns: newVitalSigns
                                          });
                                        }}
                                      />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`vital-bp-${index}`}>혈압 (mmHg)</Label>
                                        <Input 
                                          id={`vital-bp-${index}`} 
                                          value={vital.bloodPressure} 
                                          placeholder="120/80"
                                          onChange={(e) => {
                                            const newVitalSigns = [...editedPatientDetails.vitalSigns];
                                            newVitalSigns[index] = {
                                              ...newVitalSigns[index],
                                              bloodPressure: e.target.value
                                            };
                                            setEditedPatientDetails({
                                              ...editedPatientDetails,
                                              vitalSigns: newVitalSigns
                                            });
                                          }}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`vital-hr-${index}`}>심박수 (BPM)</Label>
                                        <Input 
                                          id={`vital-hr-${index}`} 
                                          type="number"
                                          value={vital.heartRate} 
                                          onChange={(e) => {
                                            const newVitalSigns = [...editedPatientDetails.vitalSigns];
                                            newVitalSigns[index] = {
                                              ...newVitalSigns[index],
                                              heartRate: parseInt(e.target.value)
                                            };
                                            setEditedPatientDetails({
                                              ...editedPatientDetails,
                                              vitalSigns: newVitalSigns
                                            });
                                          }}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`vital-temp-${index}`}>체온 (°C)</Label>
                                        <Input 
                                          id={`vital-temp-${index}`} 
                                          type="number"
                                          step="0.1"
                                          value={vital.temperature} 
                                          onChange={(e) => {
                                            const newVitalSigns = [...editedPatientDetails.vitalSigns];
                                            newVitalSigns[index] = {
                                              ...newVitalSigns[index],
                                              temperature: parseFloat(e.target.value)
                                            };
                                            setEditedPatientDetails({
                                              ...editedPatientDetails,
                                              vitalSigns: newVitalSigns
                                            });
                                          }}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`vital-resp-${index}`}>호흡수 (/분)</Label>
                                        <Input 
                                          id={`vital-resp-${index}`} 
                                          type="number"
                                          value={vital.respiratoryRate} 
                                          onChange={(e) => {
                                            const newVitalSigns = [...editedPatientDetails.vitalSigns];
                                            newVitalSigns[index] = {
                                              ...newVitalSigns[index],
                                              respiratoryRate: parseInt(e.target.value)
                                            };
                                            setEditedPatientDetails({
                                              ...editedPatientDetails,
                                              vitalSigns: newVitalSigns
                                            });
                                          }}
                                        />
                                      </div>
                                    </div>
                                    <div className="mt-3 text-right">
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => {
                                          const newVitalSigns = [...editedPatientDetails.vitalSigns];
                                          newVitalSigns.splice(index, 1);
                                          setEditedPatientDetails({
                                            ...editedPatientDetails,
                                            vitalSigns: newVitalSigns
                                          });
                                        }}
                                      >
                                        삭제
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-gray-500 text-sm">기록된 생체신호가 없습니다.</div>
                            )}
                            
                            <div className="pt-3 flex justify-end space-x-2">
                              <Button 
                                variant="outline"
                                onClick={() => {
                                  setIsEditingVitalSigns(false);
                                }}
                              >
                                취소
                              </Button>
                              <Button 
                                onClick={() => {
                                  if (!selectedPatientId || !editedPatientDetails) return;
                                  
                                  // 생체신호 데이터 업데이트
                                  PATIENT_DETAILS[selectedPatientId].vitalSigns = [...editedPatientDetails.vitalSigns];
                                  
                                  // UI 업데이트
                                  toast({
                                    title: "생체신호 정보가 업데이트되었습니다",
                                    description: "환자의 생체신호 정보가 성공적으로 저장되었습니다."
                                  });
                                  
                                  // 편집 모드 종료
                                  setIsEditingVitalSigns(false);
                                }}
                              >
                                저장
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // 생체신호 기본 정보 표시
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left p-2">{t('common.date')}</th>
                                  <th className="text-left p-2">{t('common.bloodPressure')}</th>
                                  <th className="text-left p-2">{t('common.heartRate')}</th>
                                  <th className="text-left p-2">{t('common.temperature')}</th>
                                  <th className="text-left p-2">{t('common.respRate')}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {PATIENT_DETAILS[selectedPatientId].vitalSigns.map((vital: any, index: number) => (
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
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="medications">
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle>{t('common.medications')}</CardTitle>
                            <CardDescription>{t('common.currentMedications')}</CardDescription>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-blue-600"
                            onClick={() => {
                              setEditedPatientDetails({
                                ...editedPatientDetails,
                                medications: [...PATIENT_DETAILS[selectedPatientId].medications]
                              });
                              setIsEditingMedication(true);
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            {t('common.edit')}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {isEditingMedication ? (
                          // 투약 정보 수정 폼
                          <div className="space-y-4">
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="text-sm font-medium">현재 처방 약물</h4>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  // 새 약물 정보 추가
                                  const newMedications = [
                                    ...(editedPatientDetails?.medications || []),
                                    {
                                      name: "",
                                      dosage: "",
                                      frequency: "",
                                      timing: ""
                                    }
                                  ];
                                  
                                  setEditedPatientDetails({
                                    ...editedPatientDetails,
                                    medications: newMedications
                                  });
                                }}
                              >
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                약물 추가
                              </Button>
                            </div>
                            
                            {editedPatientDetails?.medications?.length > 0 ? (
                              <div className="space-y-4">
                                {editedPatientDetails.medications.map((med: any, index: number) => (
                                  <div key={index} className="bg-gray-50 p-3 rounded border">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-2">
                                      <div className="space-y-2">
                                        <Label htmlFor={`med-name-${index}`}>약물명</Label>
                                        <Input 
                                          id={`med-name-${index}`} 
                                          value={med.name} 
                                          onChange={(e) => {
                                            const newMedications = [...editedPatientDetails.medications];
                                            newMedications[index] = {
                                              ...newMedications[index],
                                              name: e.target.value
                                            };
                                            setEditedPatientDetails({
                                              ...editedPatientDetails,
                                              medications: newMedications
                                            });
                                          }}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`med-dosage-${index}`}>용량</Label>
                                        <Input 
                                          id={`med-dosage-${index}`} 
                                          value={med.dosage}
                                          onChange={(e) => {
                                            const newMedications = [...editedPatientDetails.medications];
                                            newMedications[index] = {
                                              ...newMedications[index],
                                              dosage: e.target.value
                                            };
                                            setEditedPatientDetails({
                                              ...editedPatientDetails,
                                              medications: newMedications
                                            });
                                          }}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`med-frequency-${index}`}>빈도</Label>
                                        <Input 
                                          id={`med-frequency-${index}`}
                                          value={med.frequency}
                                          placeholder="예: 1일 3회"
                                          onChange={(e) => {
                                            const newMedications = [...editedPatientDetails.medications];
                                            newMedications[index] = {
                                              ...newMedications[index],
                                              frequency: e.target.value
                                            };
                                            setEditedPatientDetails({
                                              ...editedPatientDetails,
                                              medications: newMedications
                                            });
                                          }}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`med-timing-${index}`}>복용 시점</Label>
                                        <Input 
                                          id={`med-timing-${index}`}
                                          value={med.timing}
                                          placeholder="예: 아침 식후, 취침 전"
                                          onChange={(e) => {
                                            const newMedications = [...editedPatientDetails.medications];
                                            newMedications[index] = {
                                              ...newMedications[index],
                                              timing: e.target.value
                                            };
                                            setEditedPatientDetails({
                                              ...editedPatientDetails,
                                              medications: newMedications
                                            });
                                          }}
                                        />
                                      </div>
                                    </div>
                                    <div className="mt-2 text-right">
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => {
                                          const newMedications = [...editedPatientDetails.medications];
                                          newMedications.splice(index, 1);
                                          setEditedPatientDetails({
                                            ...editedPatientDetails,
                                            medications: newMedications
                                          });
                                        }}
                                      >
                                        삭제
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-gray-500 text-sm">현재 처방된 약물이 없습니다.</div>
                            )}
                            
                            <div className="pt-3 flex justify-end space-x-2">
                              <Button 
                                variant="outline"
                                onClick={() => {
                                  setIsEditingMedication(false);
                                }}
                              >
                                취소
                              </Button>
                              <Button 
                                onClick={() => {
                                  if (!selectedPatientId || !editedPatientDetails) return;
                                  
                                  // 투약 정보 데이터 업데이트
                                  PATIENT_DETAILS[selectedPatientId].medications = [...editedPatientDetails.medications];
                                  
                                  // UI 업데이트
                                  toast({
                                    title: "투약 정보가 업데이트되었습니다",
                                    description: "환자의 투약 정보가 성공적으로 저장되었습니다."
                                  });
                                  
                                  // 편집 모드 종료
                                  setIsEditingMedication(false);
                                }}
                              >
                                저장
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // 투약 정보 기본 보기
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left p-2">{t('common.name')}</th>
                                  <th className="text-left p-2">{t('common.dosage')}</th>
                                  <th className="text-left p-2">{t('common.frequency')}</th>
                                  <th className="text-left p-2">{t('common.timing')}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {PATIENT_DETAILS[selectedPatientId].medications.map((med: any, index: number) => (
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
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Add/Edit Room Dialog */}
      <Dialog open={isAddingRoom || !!editingRoom} onOpenChange={(open) => {
        if (!open) {
          setIsAddingRoom(false);
          setEditingRoom(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRoom ? t('common.edit') + ' ' + editingRoom.name : t('rooms.addRoom')}
            </DialogTitle>
            <DialogDescription>
              {editingRoom ? 
                "Edit room details and thresholds" :
                "Add a new room to the system"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitRoom)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('cctv.roomName')}</FormLabel>
                    <FormControl>
                      <Input placeholder={`${selectedFloor}01호`} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="tempThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('rooms.tempThreshold')} (°C)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1" 
                        placeholder="26.0" 
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="humidityThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('rooms.humidityThreshold')} (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="1" 
                        placeholder="60" 
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setIsAddingRoom(false);
                  setEditingRoom(null);
                }}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit">{t('common.save')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Add Floor Dialog */}
      <Dialog open={isAddingFloor} onOpenChange={(open) => {
        if (!open) {
          setIsAddingFloor(false);
          setFloorInput("");
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>층 추가</DialogTitle>
            <DialogDescription>
              새로운 층을 병원에 추가합니다. 층 번호를 입력하세요.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="floor-number">층 번호</Label>
              <Input
                id="floor-number"
                type="number"
                min="1"
                max="99"
                placeholder="층 번호를 입력하세요"
                value={floorInput}
                onChange={(e) => setFloorInput(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingFloor(false)}>
              취소
            </Button>
            <Button
              onClick={() => {
                const floorNum = parseInt(floorInput);
                if (!isNaN(floorNum) && floorNum > 0) {
                  // 중복 확인
                  if (floors.includes(floorNum)) {
                    toast({
                      title: "이미 존재하는 층",
                      description: `${floorNum}층은 이미 존재합니다.`,
                      variant: "destructive"
                    });
                    return;
                  }
                  
                  // 층 추가
                  const updatedFloors = [...floors, floorNum].sort((a, b) => a - b);
                  setFloors(updatedFloors);
                  setSelectedFloor(floorNum);
                  setIsAddingFloor(false);
                  setFloorInput("");
                  
                  toast({
                    title: "층 추가됨",
                    description: `${floorNum}층이 추가되었습니다.`,
                  });
                } else {
                  toast({
                    title: "잘못된 입력",
                    description: "유효한 층 번호를 입력하세요.",
                    variant: "destructive"
                  });
                }
              }}
            >
              추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
  } catch (error) {
    console.error("RoomManagementPage에서 오류 발생:", error);
    return <div className="p-6 text-center">
      <h1 className="text-2xl font-bold text-red-500 mb-4">오류가 발생했습니다</h1>
      <p className="text-gray-600 mb-4">병실 관리 페이지를 로드하는 중 문제가 발생했습니다.</p>
      <pre className="bg-gray-100 p-4 rounded text-left text-sm overflow-auto">
        {error instanceof Error ? error.message : JSON.stringify(error)}
      </pre>
    </div>;
  }
}
