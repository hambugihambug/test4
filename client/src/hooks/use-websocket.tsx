import { useEffect, useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

// WebSocket 연결 상태를 나타내는 타입
type WebSocketStatus = 'connecting' | 'open' | 'closing' | 'closed' | 'error';

// WebSocket 메시지 타입
interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

/**
 * WebSocket 연결을 관리하는 커스텀 훅
 * 실시간 알림, 이벤트 업데이트 등을 처리합니다.
 */
export function useWebSocket() {
  const { toast } = useToast();
  const [status, setStatus] = useState<WebSocketStatus>('closed');
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket 서버에 연결
  const connect = useCallback(() => {
    // 이미 연결 중이거나 연결된 경우 무시
    if (socketRef.current && (socketRef.current.readyState === WebSocket.CONNECTING || socketRef.current.readyState === WebSocket.OPEN)) {
      return;
    }

    // 기존 재연결 타이머 제거
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // WebSocket 프로토콜 선택 (HTTPS면 WSS, HTTP면 WS)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      setStatus('connecting');
      socketRef.current = new WebSocket(wsUrl);

      // 연결 성공 이벤트 핸들러
      socketRef.current.onopen = () => {
        setStatus('open');
        console.log('WebSocket 연결됨');
      };

      // 메시지 수신 이벤트 핸들러
      socketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('WebSocket 메시지 파싱 오류:', error);
        }
      };

      // 연결 종료 이벤트 핸들러
      socketRef.current.onclose = () => {
        setStatus('closed');
        console.log('WebSocket 연결 종료됨');
        
        // 자동 재연결 시도
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 5000); // 5초 후 재연결
      };

      // 오류 이벤트 핸들러
      socketRef.current.onerror = (error) => {
        setStatus('error');
        console.error('WebSocket 오류:', error);
      };
    } catch (error) {
      setStatus('error');
      console.error('WebSocket 연결 오류:', error);
    }
  }, []);

  // WebSocket 연결 종료
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      setStatus('closing');
      socketRef.current.close();
      socketRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // WebSocket 메시지 전송
  const sendMessage = useCallback((data: WebSocketMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket이 연결되지 않았습니다. 메시지를 전송할 수 없습니다.');
    }
  }, []);

  // WebSocket 메시지 처리
  const handleWebSocketMessage = useCallback((data: any) => {
    console.log('WebSocket 메시지 수신:', data);

    // 메시지 유형에 따른 처리
    switch (data.type) {
      case 'event_created':
      case 'event_updated':
        // 이벤트 데이터 캐시 업데이트
        queryClient.invalidateQueries({ queryKey: ['/api/events'] });
        
        // 알림 표시
        toast({
          title: data.type === 'event_created' ? '새 이벤트' : '이벤트 업데이트',
          description: data.message,
          duration: 5000,
        });
        break;
        
      case 'event_deleted':
        // 이벤트 데이터 캐시 업데이트
        queryClient.invalidateQueries({ queryKey: ['/api/events'] });
        
        // 알림 표시
        toast({
          title: '이벤트 삭제됨',
          description: data.message,
          duration: 5000,
        });
        break;
        
      case 'alert':
        // 긴급 알림 표시
        toast({
          title: data.title,
          description: data.message,
          variant: 'destructive',
          duration: 10000, // 긴급 알림은 더 오래 표시
        });
        break;
        
      case 'fall_detection':
        // 낙상 감지 알림 표시
        toast({
          title: '낙상 감지 알림!',
          description: data.message,
          variant: 'destructive',
          duration: 10000,
        });
        
        // 관련 데이터 캐시 업데이트
        queryClient.invalidateQueries({ queryKey: ['/api/accidents'] });
        break;
        
      case 'environment_log':
        // 환경 로그 데이터 캐시 업데이트
        if (data.data && data.data.roomId) {
          queryClient.invalidateQueries({ 
            queryKey: ['/api/env-logs/room', data.data.roomId] 
          });
        }
        break;
        
      case 'connected':
        console.log('WebSocket 서버 연결 확인:', data.message);
        break;
        
      default:
        console.log('알 수 없는 WebSocket 메시지 유형:', data.type);
    }
  }, [toast]);

  // 컴포넌트 마운트 시 자동 연결, 언마운트 시 연결 종료
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    status,
    connect,
    disconnect,
    sendMessage,
  };
}