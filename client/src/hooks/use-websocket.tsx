import { useState, useEffect, useRef, useCallback } from 'react';

type WebSocketStatus = 'connecting' | 'open' | 'closing' | 'closed' | 'error';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export function useWebSocket() {
  const [status, setStatus] = useState<WebSocketStatus>('closed');
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  
  // 메시지 전송 함수
  const sendMessage = useCallback((data: WebSocketMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, []);
  
  // 최근 메시지 초기화 함수
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);
  
  // 웹소켓 연결 초기화 함수
  const initialize = useCallback(() => {
    // 기존 웹소켓 연결 정리
    if (socketRef.current) {
      socketRef.current.close();
    }
    
    setStatus('connecting');
    
    // 적절한 WebSocket URL 생성
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    // 새 WebSocket 연결 생성
    const newSocket = new WebSocket(wsUrl);
    socketRef.current = newSocket;
    
    // 연결 이벤트 핸들러
    newSocket.onopen = () => {
      setStatus('open');
      console.log('WebSocket 연결됨');
    };
    
    // 메시지 수신 이벤트 핸들러
    newSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMessages((prev) => [...prev, data]);
        console.log('WebSocket 메시지 수신:', data);
      } catch (error) {
        console.error('WebSocket 메시지 파싱 오류:', error);
      }
    };
    
    // 에러 핸들러
    newSocket.onerror = (error) => {
      console.error('WebSocket 오류:', error);
      setStatus('error');
    };
    
    // 연결 종료 핸들러
    newSocket.onclose = () => {
      console.log('WebSocket 연결 종료됨');
      setStatus('closed');
    };
    
    // 컴포넌트 언마운트 시 연결 정리
    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, []);
  
  // 연결 상태 확인용 ping 전송
  const ping = useCallback(() => {
    return sendMessage({ type: 'ping', timestamp: new Date().toISOString() });
  }, [sendMessage]);
  
  // 컴포넌트 마운트 시 자동 연결
  useEffect(() => {
    const cleanup = initialize();
    
    // 주기적으로 ping 메시지 보내기 (5초마다)
    const pingInterval = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        ping();
      }
    }, 5000);
    
    return () => {
      clearInterval(pingInterval);
      cleanup();
    };
  }, [initialize, ping]);
  
  return {
    status,
    messages,
    sendMessage,
    clearMessages,
    initialize,
  };
}