/**
 * WebSocket 연결 관리 훅
 * 
 * 클라이언트-서버 간 실시간 통신을 위한 WebSocket 연결을 관리합니다.
 * 연결 상태 추적, 메시지 송수신, 자동 재연결 기능을 제공합니다.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

// WebSocket 상태 타입
export type WebSocketStatus = 'connecting' | 'open' | 'closed' | 'error';

// WebSocket 메시지 타입
export type WebSocketMessage = {
  type: string;
  data?: any;
  [key: string]: any;
};

/**
 * WebSocket 연결 관리 훅
 * 
 * WebSocket API를 React 훅으로 래핑하여 사용하기 쉽게 제공합니다.
 * 연결 상태, 메시지 전송, 연결 관리 기능을 포함합니다.
 * 
 * @returns WebSocket 기능이 포함된 객체
 */
export function useWebSocket() {
  const [status, setStatus] = useState<WebSocketStatus>('closed');
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // WebSocket 서버 URL 생성 (프로토콜 및 호스트 자동 감지)
  const getWebSocketUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws`;
  }, []);

  // WebSocket 연결 설정
  const connect = useCallback(() => {
    // 이미 연결된 경우 추가 연결 방지
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || 
        socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      setStatus('connecting');
      
      // WebSocket 인스턴스 생성 및 이벤트 리스너 등록
      const socket = new WebSocket(getWebSocketUrl());
      socketRef.current = socket;
      
      // 연결 성공 처리
      socket.onopen = () => {
        setStatus('open');
        console.log('WebSocket 연결 성공');
      };
      
      // 메시지 수신 처리
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleIncomingMessage(message);
        } catch (error) {
          console.error('WebSocket 메시지 파싱 오류:', error);
        }
      };
      
      // 연결 종료 처리
      socket.onclose = () => {
        setStatus('closed');
        console.log('WebSocket 연결 종료');
        
        // 재연결 시도
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000); // 3초 후 재연결 시도
      };
      
      // 오류 처리
      socket.onerror = (error) => {
        setStatus('error');
        console.error('WebSocket 오류:', error);
      };
      
    } catch (error) {
      setStatus('error');
      console.error('WebSocket 연결 오류:', error);
    }
  }, [getWebSocketUrl]);

  // WebSocket 연결 종료
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setStatus('closed');
  }, []);

  // 메시지 전송
  const sendMessage = useCallback((data: WebSocketMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, []);

  // 수신된 메시지 처리
  const handleIncomingMessage = useCallback((message: WebSocketMessage) => {
    setMessages(prevMessages => [...prevMessages, message]);
    
    // 메시지 타입에 따른 처리
    switch (message.type) {
      case 'EVENT_CREATED':
        toast({
          title: '새 이벤트 생성됨',
          description: `${message.data.title || '새 이벤트'}가 생성되었습니다.`,
          duration: 5000,
        });
        break;
        
      case 'EVENT_UPDATED':
        toast({
          title: '이벤트 업데이트',
          description: `${message.data.title || '이벤트'}가 업데이트되었습니다.`,
          duration: 5000,
        });
        break;
        
      case 'EVENT_DELETED':
        toast({
          title: '이벤트 삭제됨',
          description: `${message.data.title || '이벤트'}가 삭제되었습니다.`,
          variant: 'destructive',
          duration: 5000,
        });
        break;
        
      case 'FALL_DETECTION':
        toast({
          title: '⚠️ 낙상 감지',
          description: `${message.data.patientName || '환자'}의 낙상이 감지되었습니다! 즉시 확인해주세요.`,
          variant: 'destructive',
          duration: 10000, // 중요 알림은 더 오래 표시
        });
        break;
        
      case 'ENVIRONMENT_ALERT':
        toast({
          title: '환경 알림',
          description: message.data.message || '병실 환경에 이상이 감지되었습니다.',
          duration: 5000,
        });
        break;
        
      case 'ALERT':
        toast({
          title: message.data.title || '알림',
          description: message.data.message || '새로운 알림이 있습니다.',
          variant: message.data.level === 'error' ? 'destructive' : 'default',
          duration: 5000,
        });
        break;
        
      default:
        // 기본 처리 (로깅만)
        console.log('WebSocket 메시지 수신:', message);
        break;
    }
  }, [toast]);

  // 컴포넌트 마운트 시 WebSocket 연결 시작
  useEffect(() => {
    connect();
    
    // 언마운트 시 연결 정리
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    status,
    messages,
    connect,
    disconnect,
    sendMessage,
  };
}