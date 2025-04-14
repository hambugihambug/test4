import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { CircleAlert, AlertCircle } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";

interface FallAlertProps {
  patientName: string;
  roomName: string;
  time: Date;
  onClose: () => void;
  onAction: () => void;
}

export default function FallAlert({ patientName, roomName, time, onClose, onAction }: FallAlertProps) {
  const { t } = useI18n();
  const [progress, setProgress] = useState(100);
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 0.5;
      });
    }, 100);
    
    const timeout = setTimeout(() => {
      handleClose();
    }, 20000); // Close after 20 seconds
    
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);
  
  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };
  
  const handleAction = () => {
    onAction();
  };
  
  if (!visible) return null;
  
  return (
    <div className="fixed bottom-6 right-6 max-w-sm w-full bg-white rounded-lg shadow-lg border-l-4 border-red-500 overflow-hidden z-50 transition-opacity duration-300">
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium text-neutral-900">
              {t('fallAlert.title')}
            </p>
            <p className="mt-1 text-sm text-neutral-600">
              {roomName} {patientName} {t('fallAlert.description')}
            </p>
            <div className="mt-3 flex space-x-2">
              <button 
                className="bg-red-600 text-white px-3 py-1.5 text-xs font-medium rounded hover:bg-red-700"
                onClick={handleAction}
              >
                {t('common.confirmAndAction')}
              </button>
              <button 
                className="bg-white border border-neutral-300 text-neutral-700 px-3 py-1.5 text-xs font-medium rounded hover:bg-neutral-50"
                onClick={handleClose}
              >
                {t('common.close')}
              </button>
            </div>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button 
              className="inline-flex text-neutral-400 hover:text-neutral-500"
              onClick={handleClose}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      <div className="border-t border-neutral-200 p-1 bg-red-50 animate-pulse">
        <div className="relative">
          <div className="overflow-hidden h-1.5 flex rounded-full bg-red-200">
            <div 
              className="bg-red-500 rounded-full transition-all duration-100 ease-linear" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
