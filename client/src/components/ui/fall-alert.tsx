import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FallAlertProps {
  patientName: string;
  roomName: string;
  time: Date;
  onClose: () => void;
  onAction: () => void;
}

const FallAlert: React.FC<FallAlertProps> = ({
  patientName,
  roomName,
  time,
  onClose,
  onAction
}) => {
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 overflow-hidden animate-fade-in">
        <div className="bg-red-600 p-4 flex items-start">
          <AlertTriangle className="h-6 w-6 text-white mr-3 mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-xl font-bold text-white">응급 상황 감지됨</h3>
            <p className="text-red-100 mt-1">낙상 사고가 감지되었습니다. 즉시 확인이 필요합니다.</p>
          </div>
        </div>
        
        <div className="p-5">
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">환자:</span>
              <span className="font-semibold">{patientName}</span>
            </div>
            
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">위치:</span>
              <span className="font-semibold">{roomName}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">시간:</span>
              <span className="font-semibold">{formatTime(time)}</span>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-4">
            <Button variant="outline" onClick={onClose}>
              무시
            </Button>
            <Button onClick={onAction}>
              즉시 확인
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FallAlert;