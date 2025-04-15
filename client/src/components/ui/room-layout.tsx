import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/contexts/I18nContext';
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
    roomWidth: number;
    roomHeight: number;
  };
  onSave: (layout: any) => void;
  editable: boolean;
}

const DEFAULT_LAYOUT = {
  beds: [],
  roomWidth: 600,
  roomHeight: 400
};

// 환자 배치 관련 인터페이스
interface PatientWithAssignmentStatus {
  id: number;
  name: string;
  assigned: boolean;
}

export function RoomLayout({ roomId, layout, onSave, editable }: RoomLayoutProps) {
  const { t } = useI18n();
  const [currentLayout, setCurrentLayout] = useState(layout || DEFAULT_LAYOUT);
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<'select' | 'add' | 'move' | 'resize' | 'rotate'>('select');
  const [showPatientAssignment, setShowPatientAssignment] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 선택된 침대
  const selectedBed = selectedBedId 
    ? currentLayout.beds.find(bed => bed.id === selectedBedId) 
    : null;
  
  // 초기 레이아웃 설정
  useEffect(() => {
    if (layout) {
      setCurrentLayout(layout);
    }
  }, [layout]);
  
  // 병실 레이아웃 저장
  const saveLayout = () => {
    onSave(currentLayout);
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
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCurrentLayout(prev => ({
      ...prev,
      beds: prev.beds.map(bed => 
        bed.id === selectedBedId
          ? { ...bed, x, y }
          : bed
      )
    }));
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
  
  // 병실 크기 변경
  const updateRoomSize = (width: number, height: number) => {
    setCurrentLayout(prev => ({
      ...prev,
      roomWidth: width,
      roomHeight: height
    }));
  };
  
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
              <Label htmlFor="width" className="text-xs">W:</Label>
              <Input
                id="width"
                type="number"
                value={currentLayout.roomWidth}
                onChange={(e) => updateRoomSize(parseInt(e.target.value), currentLayout.roomHeight)}
                className="h-8 w-16"
              />
              
              <Label htmlFor="height" className="text-xs">H:</Label>
              <Input
                id="height"
                type="number"
                value={currentLayout.roomHeight}
                onChange={(e) => updateRoomSize(currentLayout.roomWidth, parseInt(e.target.value))}
                className="h-8 w-16"
              />
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
            width: `${currentLayout.roomWidth}px`, 
            height: `${currentLayout.roomHeight}px`,
            margin: '0 auto'
          }}
          onClick={addBed}
          onMouseMove={moveBed}
        >
          {/* 벽 테두리 */}
          <div className="absolute inset-0 border-8 border-gray-200 pointer-events-none"></div>
          
          {/* 바닥 격자 */}
          <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
          
          {/* 침대 */}
          {currentLayout.beds.map(bed => (
            <div
              key={bed.id}
              className={`absolute bg-white border-2 ${
                selectedBedId === bed.id 
                  ? 'border-primary shadow-md' 
                  : 'border-gray-300'
              } rounded-md overflow-hidden`}
              style={{
                width: `${bed.width}px`,
                height: `${bed.height}px`,
                transform: `translate(${bed.x - bed.width/2}px, ${bed.y - bed.height/2}px) rotate(${bed.rotation}deg)`,
                transition: editMode === 'move' ? 'none' : 'transform 0.2s',
                cursor: editMode === 'select' ? 'pointer' : 'default'
              }}
              onClick={(e) => {
                e.stopPropagation();
                selectBed(bed.id);
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
                    {t('rooms.emptyBed')}
                  </div>
                )}
              </div>
            </div>
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
                  <span className="text-xs">{selectedBed.width}px</span>
                  <Button variant="outline" size="sm" onClick={() => resizeBed(10, 0)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                  
                  <span className="mx-2">×</span>
                  
                  <Button variant="outline" size="sm" onClick={() => resizeBed(0, -10)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-xs">{selectedBed.height}px</span>
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
                  <span className="text-xs">{selectedBed.rotation}°</span>
                  <Button variant="outline" size="sm" onClick={() => rotateBed(90)}>
                    <RotateCw className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <Label className="text-xs">{t('rooms.assignPatient')}</Label>
              <div className="flex items-center mt-1 space-x-2">
                {selectedBed.patientName ? (
                  <>
                    <div className="flex items-center bg-blue-50 px-2 py-1 rounded-md">
                      <User className="h-3 w-3 text-blue-600 mr-1" />
                      <span className="text-xs font-medium">{selectedBed.patientName}</span>
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
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {AVAILABLE_PATIENTS
                      .filter(p => !p.assigned || (selectedBed.patientId === p.id))
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
                          {patient.assigned && patient.id !== selectedBed.patientId && (
                            <span className="text-xs text-gray-500">{t('rooms.alreadyAssigned')}</span>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}