import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
// I18n 관련 기능을 직접 구현하여 useI18n 의존성 제거
// import { useI18n } from "@/contexts/I18nContext";
import { translations } from "@/lib/translations";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RoomLayout } from "@/components/ui/room-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Room, RoomWithPatients, Patient, InsertRoom } from "@shared/schema";
import { Plus, Thermometer, Droplets, CheckCircle, AlertCircle, AlertTriangle, Pencil } from "lucide-react";

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
    
    console.log("RoomManagementPage 상태 초기화 중, 사용자:", user?.username);
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  
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
  const [activeTab, setActiveTab] = useState<string>("details");
  
  // 사용자 정보는 위에서 이미 가져옴
  console.log("RoomManagementPage - 현재 사용자:", user?.username, "역할:", user?.role);
  
  // 임시 병실 데이터 (API가 구현될 때까지 사용)
  const dummyRooms: RoomWithPatients[] = [
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
  
  // 실제 API로부터 데이터 가져오기 (추후 구현)
  const { data: roomsWithPatients, isLoading: roomsLoading, error: roomsError } = {
    data: dummyRooms,
    isLoading: false,
    error: null
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
      setSelectedRoomId(roomsWithPatients[0].id);
    }
  }, [roomsWithPatients, selectedRoomId]);
  
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
      }
      
      // Reset state
      setIsAddingRoom(false);
      setEditingRoom(null);
      form.reset();
    } catch (error) {
      console.error("Failed to save room:", error);
    }
  };
  
  // Handle saving room layout
  const handleSaveLayout = async (layout: any) => {
    if (!selectedRoomId) return;
    
    try {
      await apiRequest("PUT", `/api/rooms/${selectedRoomId}/layout`, layout);
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/rooms/with-patients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
    } catch (error) {
      console.error("Failed to save layout:", error);
    }
  };
  
  // Handle selecting a room
  const selectRoom = (roomId: number) => {
    setSelectedRoomId(roomId);
    setActiveTab("details");
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
        <Button onClick={() => setIsAddingRoom(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          {t('rooms.addRoom')}
        </Button>
      </div>
      
      {/* Room Management Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Room List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{t('common.roomManagement')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {roomsLoading ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="divide-y">
                {roomsWithPatients?.map((room) => (
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
              </div>
            )}
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
                <TabsList className="grid grid-cols-3 mb-6">
                  <TabsTrigger value="details">{t('common.details')}</TabsTrigger>
                  <TabsTrigger value="layout">{t('rooms.layout')}</TabsTrigger>
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
                
                {/* Room Layout Tab */}
                <TabsContent value="layout" className="mt-0">
                  <div className="border rounded-md">
                    <RoomLayout
                      roomId={selectedRoom.id}
                      layout={selectedRoom.layout ? JSON.parse(selectedRoom.layout) : undefined}
                      onSave={handleSaveLayout}
                      editable={true}
                    />
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
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedRoom.patients.map((patient) => (
                          <TableRow key={patient.id}>
                            <TableCell className="font-medium">{patient.name}</TableCell>
                            <TableCell>{patient.age}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                patient.fallRisk === 'high' ? 'bg-red-100 text-red-800' :
                                patient.fallRisk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {patient.fallRisk === 'high' ? t('dashboard.highRisk') :
                                 patient.fallRisk === 'medium' ? t('dashboard.mediumRisk') :
                                 t('dashboard.lowRisk')}
                              </span>
                            </TableCell>
                            <TableCell>{patient.bedNumber}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm">
                                {t('common.details')}
                              </Button>
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
                      <Input placeholder="101호" {...field} />
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
