/**
 * API 라우트 정의 파일
 * 
 * 실제 구현은 DB 연결 후 사용자가 직접 구현합니다.
 * 이 파일은 백엔드 요소 및 더미데이터가 제거된 템플릿입니다.
 */

import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { UserRole } from "@shared/schema";

/**
 * 역할 기반 액세스 제어를 위한 미들웨어 템플릿
 * 인증된 사용자가 특정 역할을 가지고 있는지 확인합니다.
 */
const hasRole = (roles: UserRole[]) => (req: Request, res: Response, next: NextFunction) => {
  // 실제 구현은 사용자가 작성합니다.
  // 예시:
  // const user = (req as any).user;
  // if (!user) {
  //   return res.status(401).json({ message: "인증이 필요합니다" });
  // }
  // if (roles.includes(user.role as UserRole)) {
  //   return next();
  // }
  // res.status(403).json({ message: "권한이 없습니다" });
  
  next(); // 임시로 모든 요청 허용 (실제 구현에서는 제거)
};

/**
 * 모든 API 라우트를 등록하는 함수
 * Express 앱에 라우트를 추가하고 HTTP 서버와 WebSocket 서버를 생성합니다.
 */
export async function registerRoutes(app: Express): Promise<Server> {
  // 인증 관련 라우트 설정
  // setupAuth(app); // 사용자가 직접 구현해야 함
  
  // 기본 API 응답
  app.get('/api/status', (req, res) => {
    res.json({ status: 'ok', message: '서버가 실행 중입니다. 실제 API는 사용자가 직접 구현해야 합니다.' });
  });
  
  /**
   * HTTP 서버 초기화
   * Express 앱을 HTTP 서버로 래핑
   */
  const httpServer = createServer(app);
  
  /**
   * WebSocket 서버 초기화
   * 실시간 업데이트 기능을 위한 양방향 통신 제공
   * 경로는 '/ws'로 설정하여 Vite HMR 웹소켓과 충돌 방지
   */
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  /**
   * WebSocket 연결 이벤트 처리
   * 새 클라이언트 연결, 메시지 수신, 연결 종료 등의 이벤트 관리
   */
  wss.on('connection', (ws) => {
    console.log('새로운 WebSocket 연결이 설정되었습니다');
    
    // 메시지 수신 처리
    ws.on('message', (message) => {
      console.log('메시지 수신:', message.toString());
      
      // 현재는 에코 기능만 구현 (향후 확장 예정)
      if (ws.readyState === ws.OPEN) {
        ws.send(message);
      }
    });
    
    // 연결 종료 처리
    ws.on('close', () => {
      console.log('WebSocket 연결이 종료되었습니다');
    });
  });
  
  /**
   * 모든 연결된 클라이언트에 메시지 브로드캐스트 함수
   * 실시간 알림, 환자 상태 변경, 낙상 감지 등의 정보를 모든 클라이언트에 전송
   */
  const broadcast = (data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  return httpServer;
}