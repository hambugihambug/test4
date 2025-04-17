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
import { registerEventRoutes } from './event-routes';
import { setWebSocketServer } from './ws-broadcaster';
import jwt from 'jsonwebtoken';

/**
 * 역할 기반 액세스 제어를 위한 미들웨어
 * 인증된 사용자가 특정 역할을 가지고 있는지 확인합니다.
 */
// Express에 사용자 정보 타입 추가
declare global {
  namespace Express {
    interface Request {
      user?: { id: number; role: UserRole; [key: string]: any };
    }
  }
}

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
  
  // WebSocketBroadcaster에 WebSocketServer 인스턴스 설정
  setWebSocketServer(wss);

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
  
  // 이벤트 관련 API 엔드포인트 등록
  registerEventRoutes(app);
  
  // 테스트 엔드포인트
  app.get('/api/status', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      message: '서버가 정상적으로 동작 중입니다'
    });
  });
  
  // 인증 관련 API 엔드포인트
  app.post('/api/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: '사용자명과 비밀번호를 입력해주세요' });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(401).json({ message: '사용자를 찾을 수 없습니다' });
      }
      
      // 실제 환경에서는 비밀번호 해싱 필요
      if (user.password !== password) {
        return res.status(401).json({ message: '비밀번호가 일치하지 않습니다' });
      }
      
      // JWT 토큰 생성
      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET || "hospital-care-system-jwt-secret-key-2025-06",
        { expiresIn: '7d' }
      );
      
      // 비밀번호 필드 제거하고 토큰 추가해서 응답
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({
        ...userWithoutPassword,
        token
      });
    } catch (error) {
      log(`로그인 오류: ${error}`, 'api');
      res.status(500).json({ message: '서버 오류가 발생했습니다' });
    }
  });
  
  app.post('/api/register', async (req, res) => {
    try {
      const userData = req.body;
      
      // 필수 필드 확인
      if (!userData.username || !userData.password || !userData.email || !userData.name || !userData.role) {
        return res.status(400).json({ message: '모든 필수 정보를 입력해주세요' });
      }
      
      // 사용자명 중복 확인
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: '이미 사용 중인 사용자명입니다' });
      }
      
      // 이메일 중복 확인
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: '이미 사용 중인 이메일입니다' });
      }
      
      // 사용자 생성
      const newUser = await storage.createUser(userData);
      
      // 비밀번호 필드 제거
      const { password: _, ...userWithoutPassword } = newUser;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      log(`회원가입 오류: ${error}`, 'api');
      res.status(500).json({ message: '서버 오류가 발생했습니다' });
    }
  });
  
  app.post('/api/logout', (req, res) => {
    // 실제 세션 기반 인증에서는 세션 제거 필요
    res.status(200).json({ message: '로그아웃 되었습니다' });
  });
  
  app.get('/api/user', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return res.status(401).json({ message: '인증 정보가 없습니다' });
      }
      
      // Bearer 토큰 형식 확인 및 토큰 추출
      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ message: '잘못된 인증 형식입니다' });
      }
      
      const token = parts[1];
      
      try {
        // JWT 토큰 검증
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "hospital-care-system-jwt-secret-key-2025-06") as jwt.JwtPayload;
        
        // 사용자 정보 조회
        const user = await storage.getUser(decoded.id);
        
        if (!user) {
          return res.status(401).json({ message: '사용자를 찾을 수 없습니다' });
        }
        
        // 비밀번호 제외하고 응답
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
          return res.status(401).json({ message: '토큰이 만료되었습니다' });
        } else if (error instanceof jwt.JsonWebTokenError) {
          return res.status(401).json({ message: '유효하지 않은 토큰입니다' });
        }
        throw error;
      }
    } catch (error) {
      log(`사용자 정보 조회 오류: ${error}`, 'api');
      res.status(500).json({ message: '서버 오류가 발생했습니다' });
    }
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