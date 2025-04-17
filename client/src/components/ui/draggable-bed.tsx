import { useState } from 'react';
import Draggable from 'react-draggable';
import { BedDouble } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DraggableBedProps {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  patientId?: number;
  patientName?: string;
  selected: boolean;
  editable: boolean;
  editMode: string;
  containerWidth: number;
  containerHeight: number;
  onSelect: (id: string) => void;
  onPositionChange: (id: string, x: number, y: number) => void;
}

export function DraggableBed({
  id,
  x,
  y,
  width,
  height,
  rotation,
  patientId,
  patientName,
  selected,
  editable,
  editMode,
  containerWidth,
  containerHeight,
  onSelect,
  onPositionChange
}: DraggableBedProps) {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  
  // 침대 중앙점 기준에서 왼쪽 상단점으로 변환
  const position = {
    x: x - width / 2,
    y: y - height / 2
  };
  
  return (
    <Draggable
      disabled={!editable || editMode !== 'move'}
      position={position}
      bounds={{
        left: 0,
        top: 0,
        right: containerWidth - width,
        bottom: containerHeight - height
      }}
      onStart={() => {
        setIsDragging(true);
        onSelect(id);
      }}
      onDrag={(e, data) => {
        // 중앙점 좌표로 변환하여 위치 업데이트
        const centerX = data.x + width / 2;
        const centerY = data.y + height / 2;
        onPositionChange(id, centerX, centerY);
      }}
      onStop={(e, data) => {
        setIsDragging(false);
        // 중앙점 좌표로 변환하여 최종 위치 업데이트
        const centerX = data.x + width / 2;
        const centerY = data.y + height / 2;
        onPositionChange(id, centerX, centerY);
        
        // 드래그 완료 메시지
        if (editMode === 'move') {
          toast({
            title: "침대 이동 완료",
            description: "침대 위치가 업데이트되었습니다.",
          });
        }
      }}
    >
      <div
        className={`bg-white border-2 ${
          selected ? 'border-primary shadow-md' : 'border-gray-300'
        } rounded-md overflow-hidden ${
          editMode === 'move' ? 'cursor-move' : 'cursor-pointer'
        }`}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          transform: `rotate(${rotation}deg)`,
        }}
        onClick={(e) => {
          if (!isDragging) {
            e.stopPropagation();
            onSelect(id);
          }
        }}
      >
        <div className="h-full flex flex-col items-center justify-center p-1">
          <BedDouble className="text-gray-600 h-8 w-8 mb-1" />
          
          {patientName ? (
            <div className="text-xs text-center font-medium bg-blue-100 text-blue-800 px-1 py-0.5 rounded-sm w-full truncate">
              {patientName}
            </div>
          ) : (
            <div className="text-xs text-gray-500">
              빈 침대
            </div>
          )}
        </div>
      </div>
    </Draggable>
  );
}