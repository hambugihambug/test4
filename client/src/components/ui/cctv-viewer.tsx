import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { Maximize, MinusCircle } from 'lucide-react';

interface CCTVViewerProps {
  streamUrl?: string;
  cameraName: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export function CCTVViewer({ streamUrl, cameraName, isFullscreen = false, onToggleFullscreen }: CCTVViewerProps) {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!streamUrl || !videoRef.current) {
      setError('No stream URL provided');
      setIsLoading(false);
      return;
    }
    
    // In a real implementation, this would connect to the stream
    // For this example, we'll simulate a loading state
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
      // In a real implementation with actual stream URLs, we would handle errors properly
      if (!streamUrl.startsWith('rtsp://') && !streamUrl.startsWith('http')) {
        setError('Invalid stream URL');
      }
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [streamUrl]);
  
  const handleFullscreenToggle = () => {
    if (onToggleFullscreen) {
      onToggleFullscreen();
    }
  };
  
  return (
    <div className={`relative rounded-lg overflow-hidden border border-neutral-200 ${isFullscreen ? 'h-full' : 'h-48'}`}>
      {/* Camera header */}
      <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 flex justify-between items-center z-10">
        <span className="text-sm font-medium">{cameraName}</span>
        <button 
          className="p-1 hover:bg-black hover:bg-opacity-30 rounded"
          onClick={handleFullscreenToggle}
        >
          {isFullscreen ? <MinusCircle size={16} /> : <Maximize size={16} />}
        </button>
      </div>
      
      {/* Video container */}
      <div className="bg-black h-full w-full flex items-center justify-center">
        {isLoading ? (
          <div className="text-white flex flex-col items-center">
            <div className="w-6 h-6 border-2 border-t-2 border-white border-t-transparent rounded-full animate-spin mb-2"></div>
            <span className="text-xs">Loading stream...</span>
          </div>
        ) : error ? (
          <div className="text-white text-center px-4">
            <div className="text-red-400 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-sm">{error || t('cctv.noStream')}</p>
          </div>
        ) : (
          // This would show an actual video stream in a real implementation
          // For now, we'll show a placeholder with stream URL
          <div className="text-white text-center">
            <p className="text-xs text-gray-400 mb-2">{streamUrl}</p>
            <video 
              ref={videoRef}
              className="h-full w-full object-cover"
              autoPlay
              muted
              playsInline
            >
              <source src={streamUrl} type="video/mp4" />
              {t('cctv.noStream')}
            </video>
          </div>
        )}
      </div>
    </div>
  );
}
