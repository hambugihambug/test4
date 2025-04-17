/**
 * WebSocket 방송 모듈
 * 
 * 다양한 이벤트를 모든 클라이언트에게 브로드캐스트하는 기능을 제공합니다.
 */

import WebSocket from 'ws';
import { log } from './vite';

// WebSocketServer 인스턴스 저장 변수
let wss: WebSocket.Server | null = null;

/**
 * WebSocketServer 설정 함수
 * 외부에서 사용할 WebSocketServer 인스턴스를 설정합니다.
 */
export function setWebSocketServer(server: WebSocket.Server) {
  wss = server;
  log('WebSocketBroadcaster에 WebSocketServer 설정됨', 'websocket');
}

/**
 * WebSocketBroadcaster 클래스
 * 다양한 메시지 타입을 클라이언트에 브로드캐스트하는 기능을 제공합니다.
 */
export class WebSocketBroadcaster {
  /**
   * 모든 클라이언트에 이벤트 생성 알림 전송
   */
  static notifyEventCreated(event: any) {
    WebSocketBroadcaster.broadcast({
      type: 'event_created',
      data: event,
      timestamp: new Date().toISOString(),
      message: `새 이벤트가 생성되었습니다: ${event.title}`
    });
  }

  /**
   * 모든 클라이언트에 이벤트 업데이트 알림 전송
   */
  static notifyEventUpdated(event: any) {
    WebSocketBroadcaster.broadcast({
      type: 'event_updated',
      data: event,
      timestamp: new Date().toISOString(),
      message: `이벤트가 수정되었습니다: ${event.title}`
    });
  }

  /**
   * 모든 클라이언트에 이벤트 삭제 알림 전송
   */
  static notifyEventDeleted(eventId: number, eventTitle: string) {
    WebSocketBroadcaster.broadcast({
      type: 'event_deleted',
      data: { id: eventId, title: eventTitle },
      timestamp: new Date().toISOString(),
      message: `이벤트가 삭제되었습니다: ${eventTitle}`
    });
  }

  /**
   * 긴급 알림 전송 (낙상 감지 등)
   */
  static notifyAlert(title: string, message: string, data: any = {}) {
    WebSocketBroadcaster.broadcast({
      type: 'alert',
      title,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 환경 로그 전송
   */
  static notifyEnvironmentLog(envData: any) {
    WebSocketBroadcaster.broadcast({
      type: 'environment_log',
      data: envData,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 낙상 사고 알림 전송
   */
  static notifyFallDetection(fallData: any) {
    WebSocketBroadcaster.broadcast({
      type: 'fall_detection',
      data: fallData,
      timestamp: new Date().toISOString(),
      message: `낙상 감지 알림: ${fallData.patientName || '환자'} (병실: ${fallData.roomNumber || '-'})`
    });
  }

  /**
   * 모든 클라이언트에 메시지 전송 (내부용)
   */
  private static broadcast(data: any) {
    if (!wss) {
      throw new Error('WebSocketServer가 설정되지 않았습니다.');
    }

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(JSON.stringify(data));
        } catch (error) {
          log(`WebSocket 메시지 전송 오류: ${error}`, 'websocket');
        }
      }
    });

    log(`WebSocket 브로드캐스트: ${data.type}`, 'websocket');
  }
}