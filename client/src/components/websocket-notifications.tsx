/**
 * WebSocket 알림 컴포넌트
 * 
 * WebSocket을 통한 실시간 알림을 처리하고 표시합니다.
 * App.tsx에 포함되어 글로벌 WebSocket 연결을 관리합니다.
 */

import { useEffect } from 'react';
import { useWebSocket } from '@/hooks/use-websocket';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

/**
 * WebSocket 연결 상태를 표시하는 배지 컴포넌트
 */
function ConnectionStatusBadge({ status }: { status: string }) {
  let variant: 'default' | 'destructive' | 'outline' | 'secondary' = 'outline';

  switch (status) {
    case 'open':
      variant = 'default';
      break;
    case 'connecting':
      variant = 'secondary';
      break;
    case 'error':
      variant = 'destructive';
      break;
    default:
      variant = 'outline';
  }

  return (
    <Badge variant={variant} className="ml-2">
      {status === 'open' ? '연결됨' : 
       status === 'connecting' ? '연결 중...' : 
       status === 'error' ? '연결 오류' : '연결 끊김'}
    </Badge>
  );
}

/**
 * 전체 WebSocket 알림 컴포넌트
 * App.tsx 루트에 포함되어 전역적으로 WebSocket 연결을 관리합니다.
 */
export function WebSocketNotifications({ showStatus = false }: { showStatus?: boolean }) {
  const { status } = useWebSocket();
  const { toast } = useToast();

  // 개발 모드에서 WebSocket 상태 변경 시 알림 (옵션)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      if (status === 'open') {
        toast({
          title: 'WebSocket 연결됨',
          description: '실시간 알림을 수신합니다.',
          duration: 3000,
        });
      } else if (status === 'error') {
        toast({
          title: 'WebSocket 연결 오류',
          description: '실시간 알림 수신이 중단되었습니다.',
          variant: 'destructive',
          duration: 5000,
        });
      }
    }
  }, [status, toast]);

  // WebSocket 상태만 표시하고 실제 메시지 처리는 useWebSocket 내부에서 이루어짐
  return showStatus ? <ConnectionStatusBadge status={status} /> : null;
}