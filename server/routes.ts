/**
 * API 라우트 정의 파일
 * 
 * 데이터베이스 접근 및 API 엔드포인트를 설정합니다.
 * 모든 API 요청은 '/api' 경로를 통해 이루어집니다.
 */

import { Request, Response, NextFunction, Express } from 'express';
import { Server, createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { log } from './vite';
import { storage } from './storage';
import { initializeDatabase } from './db';
import { UserRole } from '@shared/schema';

/**
 * 역할 기반 액세스 제어를 위한 미들웨어
 * 인증된 사용자가 특정 역할을 가지고 있는지 확인합니다.
 */
const hasRole = (roles: UserRole[]) => (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: '인증이 필요합니다' });
  }
  
  const userRole = req.user.role;
  
  if (!roles.includes(userRole)) {
    return res.status(403).json({ message: '권한이 없습니다' });
  }
  
  next();
};

/**
 * 모든 API 라우트를 등록하는 함수
 * Express 앱에 라우트를 추가하고 HTTP 서버와 WebSocket 서버를 생성합니다.
 */
export async function registerRoutes(app: Express): Promise<Server> {
  try {
    // 데이터베이스 초기화
    log('데이터베이스 초기화 시작...', 'routes');
    await initializeDatabase();
    log('데이터베이스 초기화 완료', 'routes');
  } catch (error) {
    log(`데이터베이스 초기화 실패: ${error}`, 'routes');
  }

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
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws' 
  });

  /**
   * WebSocket 연결 이벤트 처리
   * 새 클라이언트 연결, 메시지 수신, 연결 종료 등의 이벤트 관리
   */
  wss.on('connection', (ws) => {
    log('새 WebSocket 클라이언트 연결됨', 'websocket');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        log(`메시지 수신: ${JSON.stringify(data)}`, 'websocket');
        
        // 메시지 타입에 따른 처리
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        }
      } catch (error) {
        log(`WebSocket 메시지 처리 오류: ${error}`, 'websocket');
      }
    });
    
    ws.on('close', () => {
      log('WebSocket 클라이언트 연결 종료됨', 'websocket');
    });
    
    // 초기 연결 확인 메시지 전송
    ws.send(JSON.stringify({ 
      type: 'connected', 
      message: 'WebSocket 서버에 연결되었습니다',
      timestamp: new Date().toISOString()
    }));
  });

  /**
   * 모든 연결된 클라이언트에 메시지 브로드캐스트 함수
   * 실시간 알림, 환자 상태 변경, 낙상 감지 등의 정보를 모든 클라이언트에 전송
   */
  function broadcastToAll(data: any) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }

  // API 엔드포인트 정의
  
  // 테스트 엔드포인트
  app.get('/api/status', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      message: '서버가 정상적으로 동작 중입니다'
    });
  });
  
  // 사용자 관련 API 엔드포인트
  app.get('/api/users', async (req, res) => {
    try {
      const users = await storage.getUsersByRole();
      res.json(users);
    } catch (error) {
      log(`사용자 목록 조회 오류: ${error}`, 'api');
      res.status(500).json({ message: '서버 오류가 발생했습니다' });
    }
  });
  
  app.get('/api/users/:id', async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
      }
      res.json(user);
    } catch (error) {
      log(`사용자 조회 오류 (ID: ${req.params.id}): ${error}`, 'api');
      res.status(500).json({ message: '서버 오류가 발생했습니다' });
    }
  });
  
  // 병실 관련 API 엔드포인트
  app.get('/api/rooms', async (req, res) => {
    try {
      const rooms = await storage.getRooms();
      res.json(rooms);
    } catch (error) {
      log(`병실 목록 조회 오류: ${error}`, 'api');
      res.status(500).json({ message: '서버 오류가 발생했습니다' });
    }
  });
  
  app.get('/api/rooms/:id', async (req, res) => {
    try {
      const room = await storage.getRoom(parseInt(req.params.id));
      if (!room) {
        return res.status(404).json({ message: '병실을 찾을 수 없습니다' });
      }
      res.json(room);
    } catch (error) {
      log(`병실 조회 오류 (ID: ${req.params.id}): ${error}`, 'api');
      res.status(500).json({ message: '서버 오류가 발생했습니다' });
    }
  });
  
  app.get('/api/rooms/:id/patients', async (req, res) => {
    try {
      const roomWithPatients = await storage.getRoomWithPatients(parseInt(req.params.id));
      if (!roomWithPatients) {
        return res.status(404).json({ message: '병실을 찾을 수 없습니다' });
      }
      res.json(roomWithPatients);
    } catch (error) {
      log(`병실 환자 목록 조회 오류 (병실 ID: ${req.params.id}): ${error}`, 'api');
      res.status(500).json({ message: '서버 오류가 발생했습니다' });
    }
  });
  
  app.get('/api/rooms-with-patients', async (req, res) => {
    try {
      const roomsWithPatients = await storage.getAllRoomsWithPatients();
      res.json(roomsWithPatients);
    } catch (error) {
      log(`환자 정보 포함 병실 목록 조회 오류: ${error}`, 'api');
      res.status(500).json({ message: '서버 오류가 발생했습니다' });
    }
  });
  
  // 환자 관련 API 엔드포인트
  app.get('/api/patients', async (req, res) => {
    try {
      const patients = await storage.getPatients();
      res.json(patients);
    } catch (error) {
      log(`환자 목록 조회 오류: ${error}`, 'api');
      res.status(500).json({ message: '서버 오류가 발생했습니다' });
    }
  });
  
  app.get('/api/patients/:id', async (req, res) => {
    try {
      const patient = await storage.getPatient(parseInt(req.params.id));
      if (!patient) {
        return res.status(404).json({ message: '환자를 찾을 수 없습니다' });
      }
      res.json(patient);
    } catch (error) {
      log(`환자 조회 오류 (ID: ${req.params.id}): ${error}`, 'api');
      res.status(500).json({ message: '서버 오류가 발생했습니다' });
    }
  });
  
  app.get('/api/patients/:id/details', async (req, res) => {
    try {
      const patientWithDetails = await storage.getPatientWithDetails(parseInt(req.params.id));
      if (!patientWithDetails) {
        return res.status(404).json({ message: '환자를 찾을 수 없습니다' });
      }
      res.json(patientWithDetails);
    } catch (error) {
      log(`환자 상세 정보 조회 오류 (ID: ${req.params.id}): ${error}`, 'api');
      res.status(500).json({ message: '서버 오류가 발생했습니다' });
    }
  });
  
  app.get('/api/patients-with-details', async (req, res) => {
    try {
      const patientsWithDetails = await storage.getPatientsWithDetails();
      res.json(patientsWithDetails);
    } catch (error) {
      log(`환자 상세 정보 목록 조회 오류: ${error}`, 'api');
      res.status(500).json({ message: '서버 오류가 발생했습니다' });
    }
  });
  
  // 낙상 사고 관련 API 엔드포인트
  app.get('/api/accidents', async (req, res) => {
    try {
      const accidents = await storage.getAccidents();
      res.json(accidents);
    } catch (error) {
      log(`낙상 사고 목록 조회 오류: ${error}`, 'api');
      res.status(500).json({ message: '서버 오류가 발생했습니다' });
    }
  });
  
  app.get('/api/accidents/recent/:limit', async (req, res) => {
    try {
      const limit = parseInt(req.params.limit) || 10;
      const accidents = await storage.getRecentAccidents(limit);
      res.json(accidents);
    } catch (error) {
      log(`최근 낙상 사고 목록 조회 오류: ${error}`, 'api');
      res.status(500).json({ message: '서버 오류가 발생했습니다' });
    }
  });
  
  app.post('/api/accidents', async (req, res) => {
    try {
      const accident = await storage.createAccident(req.body);
      
      // WebSocket으로 모든 클라이언트에 알림
      broadcastToAll({
        type: 'accident',
        data: accident,
        timestamp: new Date().toISOString()
      });
      
      res.status(201).json(accident);
    } catch (error) {
      log(`낙상 사고 생성 오류: ${error}`, 'api');
      res.status(500).json({ message: '서버 오류가 발생했습니다' });
    }
  });
  
  // 환경 로그 관련 API 엔드포인트
  app.get('/api/env-logs/room/:roomId', async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      const envLogs = await storage.getEnvLogsByRoomId(roomId, limit);
      res.json(envLogs);
    } catch (error) {
      log(`병실별 환경 로그 목록 조회 오류 (병실 ID: ${req.params.roomId}): ${error}`, 'api');
      res.status(500).json({ message: '서버 오류가 발생했습니다' });
    }
  });
  
  app.get('/api/env-logs/room/:roomId/latest', async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const latestEnvLog = await storage.getLatestEnvLogByRoomId(roomId);
      
      if (!latestEnvLog) {
        return res.status(404).json({ message: '환경 로그를 찾을 수 없습니다' });
      }
      
      res.json(latestEnvLog);
    } catch (error) {
      log(`병실별 최신 환경 로그 조회 오류 (병실 ID: ${req.params.roomId}): ${error}`, 'api');
      res.status(500).json({ message: '서버 오류가 발생했습니다' });
    }
  });
  
  app.post('/api/env-logs', async (req, res) => {
    try {
      const envLog = await storage.createEnvLog(req.body);
      
      // WebSocket으로 모든 클라이언트에 알림
      broadcastToAll({
        type: 'env_log',
        data: envLog,
        timestamp: new Date().toISOString()
      });
      
      res.status(201).json(envLog);
    } catch (error) {
      log(`환경 로그 생성 오류: ${error}`, 'api');
      res.status(500).json({ message: '서버 오류가 발생했습니다' });
    }
  });
  
  return httpServer;
}