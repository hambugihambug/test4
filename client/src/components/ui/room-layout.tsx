import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import Draggable from 'react-draggable';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// import { useI18n } from '@/contexts/I18nContext';
import { translations } from '@/lib/translations';
import { Patient } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { 
  RotateCw, Plus, Minus, Move, Save, Trash2, 
  BedDouble, PencilRuler, User, UserX 
} from 'lucide-react';

// 침대 인터페이스
interface Bed {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  patientId?: number;
  patientName?: string;
}

// 병실 레이아웃 인터페이스
interface RoomLayoutProps {
  roomId: number;
  layout?: {
    beds: Bed[];
  };
  onSave: (layout: any) => void;
  editable: boolean;
}

// 병실 레이아웃 크기를 800x400으로 고정합니다
const ROOM_WIDTH = 800;
const ROOM_HEIGHT = 400;

const DEFAULT_LAYOUT = {
  beds: []
};

// 환자 배치 관련 인터페이스
interface PatientWithAssignmentStatus {
  id: number;
  name: string;
  assigned: boolean;
}

export function RoomLayout({ roomId, layout, onSave, editable }: RoomLayoutProps) {
  const { toast } = useToast();
  
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
  const [currentLayout, setCurrentLayout] = useState(layout || DEFAULT_LAYOUT);
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<'select' | 'add' | 'move' | 'resize' | 'rotate'>('select');
  const [showPatientAssignment, setShowPatientAssignment] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggedBedId, setDraggedBedId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{x: number, y: number} | null>(null);
  
  // 임시 환자 데이터 (타입 오류 해결을 위해 필드 제거)
  const dummyPatients: Patient[] = [
    { id: 1, name: "김환자", age: 65, roomId: 1, bedNumber: 1, fallRisk: "high", userId: null, height: null, weight: null, blood: null, assignedNurseId: null },
    { id: 2, name: "이환자", age: 78, roomId: 1, bedNumber: 2, fallRisk: "medium", userId: null, height: null, weight: null, blood: null, assignedNurseId: null },
    { id: 3, name: "박환자", age: 72, roomId: 2, bedNumber: 1, fallRisk: "high", userId: null, height: null, weight: null, blood: null, assignedNurseId: null },
    { id: 4, name: "최환자", age: 68, roomId: 2, bedNumber: 2, fallRisk: "low", userId: null, height: null, weight: null, blood: null, assignedNurseId: null },
    { id: 5, name: "정환자", age: 81, roomId: 2, bedNumber: 3, fallRisk: "medium", userId: null, height: null, weight: null, blood: null, assignedNurseId: null },
    { id: 6, name: "강환자", age: 75, roomId: 3, bedNumber: 1, fallRisk: "low", userId: null, height: null, weight: null, blood: null, assignedNurseId: null },
    { id: 7, name: "윤환자", age: 69, roomId: 3, bedNumber: 2, fallRisk: "high", userId: null, height: null, weight: null, blood: null, assignedNurseId: null }
  ];
  
  // 해당 병실에 속한 환자만 필터링
  const filteredPatients = dummyPatients.filter(p => p.roomId === roomId);
  
  // 환자 데이터 설정
  const { data: patients, isLoading: patientsLoading } = {
    data: filteredPatients,
    isLoading: false
  };
  
  // 병실 환자 정보에 배정 상태 추가
  const [availablePatients, setAvailablePatients] = useState<PatientWithAssignmentStatus[]>([]);
  
  // 환자 배정 상태 계산
  useEffect(() => {
    if (patients) {
      const bedPatientIds = currentLayout.beds
        .map(bed => bed.patientId)
        .filter(id => id !== undefined) as number[];
      
      const patientsWithStatus = patients.map(patient => ({
        id: patient.id,
        name: patient.name,
        assigned: bedPatientIds.includes(patient.id)
      }));
      
      setAvailablePatients(patientsWithStatus);
    }
  }, [patients, currentLayout.beds]);
  
  // 선택된 침대
  const selectedBed = selectedBedId 
    ? currentLayout.beds.find(bed => bed.id === selectedBedId) 
    : null;
  
  // 초기 레이아웃 설정
  useEffect(() => {
    console.log("레이아웃 변경 감지:", layout);
    if (layout) {
      setCurrentLayout(layout);
    }
  }, [layout]);
  
  // 디버깅용 - 레이아웃이 변경될 때마다 로그 출력
  useEffect(() => {
    console.log("현재 레이아웃 상태:", currentLayout);
  }, [currentLayout]);
  
  // 침대 위치에 따라 번호 재정렬
  const reorderBedNumbers = () => {
    // 침대들을 Y축 기준으로 정렬 (위에서 아래로)
    const sortedBedsY = [...currentLayout.beds].sort((a, b) => a.y - b.y);
    
    // Y축 기준으로 행 그룹화 (비슷한 Y 위치에 있는 침대들을 하나의 행으로 간주)
    const rowGroups: Bed[][] = [];
    const yThreshold = 50; // 같은 행으로 간주할 Y축 거리 임계값
    
    sortedBedsY.forEach(bed => {
      // 이미 존재하는 행 중에 현재 침대와 Y축이 가까운 행이 있는지 확인
      const existingRowIndex = rowGroups.findIndex(row => {
        if (row.length === 0) return false;
        const rowY = row[0].y;
        return Math.abs(bed.y - rowY) < yThreshold;
      });
      
      if (existingRowIndex >= 0) {
        // 기존 행에 추가
        rowGroups[existingRowIndex].push(bed);
      } else {
        // 새 행 생성
        rowGroups.push([bed]);
      }
    });
    
    // 각 행 내에서 침대를 X축 기준으로 정렬 (왼쪽에서 오른쪽으로)
    rowGroups.forEach(row => {
      row.sort((a, b) => a.x - b.x);
    });
    
    console.log("행 그룹화 결과:", rowGroups);
    
    // 모든 침대를 순서대로 펼침 (위에서 아래로, 각 행에서는 왼쪽에서 오른쪽으로)
    const reorderedBeds = rowGroups.flat();
    
    // 환자 데이터 매핑하여 유지 (기존 침대 번호와 환자 정보 유지)
    const updatedBeds = reorderedBeds.map((bed) => {
      const existingBed = currentLayout.beds.find(b => b.id === bed.id);
      return {
        ...bed,
        patientId: existingBed?.patientId,
        patientName: existingBed?.patientName,
      };
    });
    
    return updatedBeds;
  };
  
  // 병실 레이아웃 저장
  const saveLayout = () => {
    // 저장 전에 침대 번호 재정렬
    const updatedBeds = reorderBedNumbers();
    
    const saveData = {
      beds: updatedBeds
    };
    
    // 현재 레이아웃 업데이트
    setCurrentLayout({
      ...currentLayout,
      beds: updatedBeds
    });
    
    onSave(saveData);
    toast({
      title: t('common.savedMessage') || '저장되었습니다',
      description: '침대 번호가 위치에 따라 재정렬되었습니다.',
      variant: "default",
      duration: 3000,
    });
  };
  
  // 새 침대 추가
  const addBed = (e: React.MouseEvent) => {
    if (editMode !== 'add' || !containerRef.current) return;
    
    // 컨테이너 내 상대 좌표 계산
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 새 침대 생성
    const newBed: Bed = {
      id: `bed-${Date.now()}`,
      x,
      y,
      width: 80,
      height: 160,
      rotation: 0
    };
    
    setCurrentLayout(prev => ({
      ...prev,
      beds: [...prev.beds, newBed]
    }));
    
    // 선택 모드로 전환
    setEditMode('select');
    setSelectedBedId(newBed.id);
  };
  
  // 침대 선택
  const selectBed = (id: string) => {
    if (editMode !== 'select') return;
    setSelectedBedId(id === selectedBedId ? null : id);
  };
  
  // 선택된 침대 이동
  const moveBed = (e: React.MouseEvent) => {
    if (editMode !== 'move' || !selectedBedId || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    
    // 현재 선택된 침대 가져오기
    const selectedBed = currentLayout.beds.find(bed => bed.id === selectedBedId);
    if (!selectedBed) return;
    
    // 침대가 화면 밖으로 나가지 않도록 경계 설정
    // 침대 중심 기준으로 각 방향 최대/최소값 계산
    const minX = selectedBed.width / 2;
    const maxX = ROOM_WIDTH - (selectedBed.width / 2);
    const minY = selectedBed.height / 2;
    const maxY = ROOM_HEIGHT - (selectedBed.height / 2);
    
    // 경계 내로 제한
    const x = Math.min(maxX, Math.max(minX, rawX));
    const y = Math.min(maxY, Math.max(minY, rawY));
    
    setCurrentLayout(prev => ({
      ...prev,
      beds: prev.beds.map(bed => 
        bed.id === selectedBedId
          ? { ...bed, x, y }
          : bed
      )
    }));
  };
  
  // 마우스를 떼면 이동 종료 (선택 모드로 변경)
  const endMove = () => {
    if (editMode === 'move') {
      setEditMode('select');
    }
  };
  
  // 침대 크기 조정
  const resizeBed = (widthChange: number, heightChange: number) => {
    if (!selectedBedId) return;
    
    setCurrentLayout(prev => ({
      ...prev,
      beds: prev.beds.map(bed => 
        bed.id === selectedBedId
          ? { 
              ...bed, 
              width: Math.max(40, bed.width + widthChange),
              height: Math.max(80, bed.height + heightChange)
            }
          : bed
      )
    }));
  };
  
  // 침대 회전
  const rotateBed = (degrees: number) => {
    if (!selectedBedId) return;
    
    setCurrentLayout(prev => ({
      ...prev,
      beds: prev.beds.map(bed => 
        bed.id === selectedBedId
          ? { ...bed, rotation: (bed.rotation + degrees) % 360 }
          : bed
      )
    }));
  };
  
  // 선택된 침대 삭제
  const deleteBed = () => {
    if (!selectedBedId) return;
    
    setCurrentLayout(prev => ({
      ...prev,
      beds: prev.beds.filter(bed => bed.id !== selectedBedId)
    }));
    
    setSelectedBedId(null);
  };
  
  // 환자 배정
  const assignPatient = (patientId: number, patientName: string) => {
    if (!selectedBedId) return;
    
    setCurrentLayout(prev => ({
      ...prev,
      beds: prev.beds.map(bed => 
        bed.id === selectedBedId
          ? { ...bed, patientId, patientName }
          : bed
      )
    }));
    
    setShowPatientAssignment(false);
  };
  
  // 환자 배정 취소
  const unassignPatient = () => {
    if (!selectedBedId) return;
    
    setCurrentLayout(prev => ({
      ...prev,
      beds: prev.beds.map(bed => 
        bed.id === selectedBedId
          ? { ...bed, patientId: undefined, patientName: undefined }
          : bed
      )
    }));
  };
  
  // 병실 크기는 800x400으로 고정되어 있습니다
  
  return (
    <div className="space-y-4">
      {editable && (
        <div className="p-3 flex flex-wrap gap-2 border-b">
          <Toggle 
            pressed={editMode === 'select'} 
            onPressedChange={() => setEditMode('select')}
            aria-label="Select mode"
          >
            <PencilRuler className="h-4 w-4 mr-1" /> {t('rooms.select')}
          </Toggle>
          
          <Toggle 
            pressed={editMode === 'add'} 
            onPressedChange={() => setEditMode('add')}
            aria-label="Add bed"
          >
            <Plus className="h-4 w-4 mr-1" /> {t('rooms.addBed')}
          </Toggle>
          
          <Toggle 
            pressed={editMode === 'move'} 
            onPressedChange={() => setEditMode('move')}
            aria-label="Move bed"
            disabled={!selectedBedId}
          >
            <Move className="h-4 w-4 mr-1" /> {t('rooms.move')}
          </Toggle>
          
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">800 × 400</span>
            </div>
            
            <Button onClick={saveLayout} size="sm">
              <Save className="h-4 w-4 mr-1" /> {t('common.save')}
            </Button>
          </div>
        </div>
      )}
      
      <div className="relative">
        <div
          ref={containerRef}
          className="border border-dashed relative bg-gray-50 cursor-pointer"
          style={{ 
            width: `${ROOM_WIDTH}px`, 
            height: `${ROOM_HEIGHT}px`,
            margin: '0 auto'
          }}
          onClick={addBed}
          onMouseMove={(e) => {
            // 드래그 중이면 침대 이동 처리
            if (draggedBedId && dragStartPos) {
              e.stopPropagation();
              const rect = containerRef.current?.getBoundingClientRect();
              if (!rect) return;
              
              const currentX = e.clientX - rect.left;
              const currentY = e.clientY - rect.top;
              
              // 현재 드래그 중인 침대 찾기
              const bed = currentLayout.beds.find(b => b.id === draggedBedId);
              if (!bed) return;
              
              // 침대가 화면 밖으로 나가지 않도록 경계 설정
              const minX = bed.width / 2;
              const maxX = ROOM_WIDTH - (bed.width / 2);
              const minY = bed.height / 2;
              const maxY = ROOM_HEIGHT - (bed.height / 2);
              
              // 경계 내로 제한
              const x = Math.min(maxX, Math.max(minX, currentX));
              const y = Math.min(maxY, Math.max(minY, currentY));
              
              // 침대 위치 업데이트
              setCurrentLayout(prev => ({
                ...prev,
                beds: prev.beds.map(b => 
                  b.id === draggedBedId
                    ? { ...b, x, y }
                    : b
                )
              }));
            } else {
              // 일반 이동 모드에서의 처리
              moveBed(e);
            }
          }}
          onMouseUp={(e) => {
            // 드래그 중이었다면 드래그 종료
            if (draggedBedId) {
              setDraggedBedId(null);
              setDragStartPos(null);
            }
            endMove();
          }}
          onMouseLeave={(e) => {
            // 마우스가 영역을 벗어나면 드래그 종료
            if (draggedBedId) {
              setDraggedBedId(null);
              setDragStartPos(null);
            }
            endMove();
          }}
        >
          {/* 벽 테두리 */}
          <div className="absolute inset-0 border-8 border-gray-200 pointer-events-none"></div>
          
          {/* 바닥 격자 */}
          <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
          
          {/* 침대 */}
          {currentLayout.beds.map(bed => (
            <Draggable
              key={bed.id}
              disabled={!editable || editMode !== 'move'}
              defaultPosition={{x: bed.x - bed.width/2, y: bed.y - bed.height/2}}
              bounds={{
                left: 0,
                top: 0,
                right: ROOM_WIDTH - bed.width,
                bottom: ROOM_HEIGHT - bed.height
              }}
              onDrag={(e, data) => {
                // 드래그 중 위치 업데이트
                const centerX = data.x + bed.width/2;
                const centerY = data.y + bed.height/2;
                setCurrentLayout(prev => ({
                  ...prev,
                  beds: prev.beds.map(b => 
                    b.id === bed.id
                      ? { ...b, x: centerX, y: centerY }
                      : b
                  )
                }));
              }}
              onStop={(e, data) => {
                // 드래그 종료 시 final 위치 업데이트
                const centerX = data.x + bed.width/2;
                const centerY = data.y + bed.height/2;
                setCurrentLayout(prev => ({
                  ...prev,
                  beds: prev.beds.map(b => 
                    b.id === bed.id
                      ? { ...b, x: centerX, y: centerY }
                      : b
                  )
                }));
                
                // 드래그 종료 알림
                toast({
                  title: "침대 이동 완료",
                  description: "침대 위치가 업데이트되었습니다.",
                });
              }}
            >
              <div
                className={`bg-white border-2 ${
                  selectedBedId === bed.id 
                    ? 'border-primary shadow-md' 
                    : 'border-gray-300'
                } rounded-md overflow-hidden ${editMode === 'move' ? 'cursor-move' : editMode === 'select' ? 'cursor-pointer' : 'cursor-default'}`}
                style={{
                  width: `${bed.width}px`,
                  height: `${bed.height}px`,
                  transform: `rotate(${bed.rotation}deg)`,
                  transition: 'box-shadow 0.2s',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  selectBed(bed.id);
                }}
                onMouseDown={(e) => {
                  if (editable && editMode !== 'move') {
                    e.stopPropagation();
                    // 다른 편집 모드일 때 선택만 하기
                    setSelectedBedId(bed.id);
                  }
                }}
            >
              <div className="h-full flex flex-col items-center justify-center p-1">
                <BedDouble className="text-gray-600 h-8 w-8 mb-1" />
                
                {bed.patientName ? (
                  <div className="text-xs text-center font-medium bg-blue-100 text-blue-800 px-1 py-0.5 rounded-sm w-full truncate">
                    {bed.patientName}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">
                    {currentLayout.beds.indexOf(bed) + 1}번
                  </div>
                )}
              </div>
            </Draggable>
          ))}
        </div>
        
        {/* 선택된 침대 컨트롤 */}
        {selectedBed && editable && (
          <div className="mt-3 p-3 border rounded-md bg-white">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">{t('rooms.bedControls')}</h3>
              <Button variant="destructive" size="sm" onClick={deleteBed}>
                <Trash2 className="h-4 w-4 mr-1" /> {t('common.delete')}
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">{t('rooms.bedSize')}</Label>
                <div className="flex items-center mt-1 space-x-2">
                  <Button variant="outline" size="sm" onClick={() => resizeBed(-10, 0)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-xs">{selectedBed?.width || 0}px</span>
                  <Button variant="outline" size="sm" onClick={() => resizeBed(10, 0)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                  
                  <span className="mx-2">×</span>
                  
                  <Button variant="outline" size="sm" onClick={() => resizeBed(0, -10)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-xs">{selectedBed?.height || 0}px</span>
                  <Button variant="outline" size="sm" onClick={() => resizeBed(0, 10)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div>
                <Label className="text-xs">{t('rooms.rotation')}</Label>
                <div className="flex items-center mt-1 space-x-2">
                  <Button variant="outline" size="sm" onClick={() => rotateBed(-90)}>
                    <RotateCw className="h-3 w-3 -scale-x-100" />
                  </Button>
                  <span className="text-xs">{selectedBed?.rotation || 0}°</span>
                  <Button variant="outline" size="sm" onClick={() => rotateBed(90)}>
                    <RotateCw className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <Label className="text-xs">{t('rooms.assignPatient')}</Label>
              <div className="flex items-center mt-1 space-x-2">
                {selectedBed?.patientName ? (
                  <>
                    <div className="flex items-center bg-blue-50 px-2 py-1 rounded-md">
                      <User className="h-3 w-3 text-blue-600 mr-1" />
                      <span className="text-xs font-medium">{selectedBed?.patientName}</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={unassignPatient}>
                      <UserX className="h-3 w-3 mr-1" /> {t('rooms.unassign')}
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setShowPatientAssignment(true)}>
                    <User className="h-3 w-3 mr-1" /> {t('rooms.assign')}
                  </Button>
                )}
              </div>
              
              {showPatientAssignment && (
                <div className="mt-2 p-2 border rounded-md bg-gray-50">
                  <h4 className="text-xs font-medium mb-2">{t('rooms.selectPatient')}</h4>
                  
                  {patientsLoading ? (
                    <div className="flex justify-center items-center py-2">
                      <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  ) : availablePatients.length === 0 ? (
                    <div className="text-xs text-gray-500 text-center py-2">
                      {t('rooms.noPatients')}
                    </div>
                  ) : (
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {availablePatients
                        .filter(p => !p.assigned || (selectedBed?.patientId === p.id))
                        .map(patient => (
                          <div 
                            key={patient.id}
                            className="flex items-center justify-between px-2 py-1 hover:bg-gray-100 rounded-sm cursor-pointer"
                            onClick={() => assignPatient(patient.id, patient.name)}
                          >
                            <div className="flex items-center">
                              <User className="h-3 w-3 mr-1 text-gray-500" />
                              <span className="text-xs">{patient.name}</span>
                            </div>
                            {patient.assigned && patient.id !== selectedBed?.patientId && (
                              <span className="text-xs text-gray-500">{t('rooms.alreadyAssigned')}</span>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}