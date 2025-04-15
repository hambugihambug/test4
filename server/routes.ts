import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth, authenticateJWT } from "./auth";
import { storage } from "./storage";
import { WebSocketServer } from "ws";
import { z } from "zod";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { insertRoomSchema, insertPatientSchema, insertGuardianSchema, insertAccidentSchema, insertCameraSchema, insertMessageSchema, UserRole, User } from "@shared/schema";

// scrypt 비동기 버전
const scryptAsync = promisify(scrypt);

// Middleware to check user roles
const hasRole = (roles: UserRole[]) => (req: Request, res: Response, next: NextFunction) => {
  // user 객체는 authenticateJWT에서 이미 req에 추가됨
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({ message: "인증이 필요합니다" });
  }
  
  if (roles.includes(user.role as UserRole)) {
    return next();
  }
  
  res.status(403).json({ message: "권한이 없습니다" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Initialize HTTP server
  const httpServer = createServer(app);
  
  // Initialize WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('New WebSocket connection established');
    
    ws.on('message', (message) => {
      console.log('Received message:', message.toString());
      
      // Echo back for now
      if (ws.readyState === ws.OPEN) {
        ws.send(message);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });
  
  // Function to broadcast to all connected clients
  const broadcast = (data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };
  
  // 해시 비밀번호 함수 가져오기 - auth.ts에서 사용하는 것과 동일한 함수
  async function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  }
  
  // 비밀번호 비교 함수
  async function comparePasswords(supplied: string, stored: string) {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  }
  
  // User Routes
  // 모든 사용자 조회 API (역할 필터링 지원)
  app.get('/api/users', authenticateJWT, hasRole([UserRole.DIRECTOR, UserRole.NURSE]), async (req, res) => {
    try {
      const requestUser = (req as any).user;
      let users = [];
      
      // 역할 기반 필터링
      const roleParam = req.query.role as string | undefined;
      
      // 병원장은 모든 사용자 볼 수 있음
      if (requestUser.role === UserRole.DIRECTOR) {
        if (roleParam && Object.values(UserRole).includes(roleParam as UserRole)) {
          users = await storage.getUsersByRole(roleParam as UserRole);
        } else {
          // 모든 사용자 가져오기
          users = await storage.getUsersByRole();
        }
      } 
      // 간호사는 환자와 보호자만 볼 수 있음
      else if (requestUser.role === UserRole.NURSE) {
        if (roleParam === UserRole.PATIENT) {
          users = await storage.getUsersByRole(UserRole.PATIENT);
        } else if (roleParam === UserRole.GUARDIAN) {
          users = await storage.getUsersByRole(UserRole.GUARDIAN);
        } else {
          // 기본적으로 환자와 보호자 모두 가져오기
          const patients = await storage.getUsersByRole(UserRole.PATIENT);
          const guardians = await storage.getUsersByRole(UserRole.GUARDIAN);
          users = [...patients, ...guardians];
        }
      }
      
      // 비밀번호 필드 제외하고 반환
      const safeUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.status(200).json(safeUsers);
    } catch (error) {
      console.error('사용자 조회 오류:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다' });
    }
  });
  
  // Check if username or email exists
  app.get('/api/check-user', async (req, res) => {
    try {
      const { username, email } = req.query;
      
      if (username) {
        const user = await storage.getUserByUsername(username as string);
        return res.json({ exists: !!user });
      }
      
      if (email) {
        const user = await storage.getUserByEmail(email as string);
        return res.json({ exists: !!user });
      }
      
      res.status(400).json({ message: "Username or email query parameter is required" });
    } catch (error) {
      res.status(500).json({ message: "Error checking user" });
    }
  });

  // Current user language preference
  app.patch('/api/user/language', authenticateJWT, async (req, res) => {
    const { language } = req.body;
    if (!language || (language !== 'ko' && language !== 'en')) {
      return res.status(400).json({ message: "Invalid language" });
    }
    
    const updatedUser = await storage.updateUser(req.user.id, { preferredLanguage: language });
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(updatedUser);
  });
  
  // Room Routes
  app.get('/api/rooms', authenticateJWT, async (req, res) => {
    try {
      const rooms = await storage.getRooms();
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ message: "Error fetching rooms" });
    }
  });
  
  app.get('/api/rooms/:id', authenticateJWT, async (req, res) => {
    try {
      const room = await storage.getRoom(parseInt(req.params.id));
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      res.json(room);
    } catch (error) {
      res.status(500).json({ message: "Error fetching room" });
    }
  });
  
  app.post('/api/rooms', authenticateJWT, hasRole([UserRole.DIRECTOR]), async (req, res) => {
    try {
      const validatedData = insertRoomSchema.parse(req.body);
      const room = await storage.createRoom(validatedData);
      res.status(201).json(room);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid room data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating room" });
    }
  });
  
  app.put('/api/rooms/:id', authenticateJWT, hasRole([UserRole.DIRECTOR, UserRole.NURSE]), async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const room = await storage.getRoom(roomId);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      
      const updatedRoom = await storage.updateRoom(roomId, req.body);
      res.json(updatedRoom);
    } catch (error) {
      res.status(500).json({ message: "Error updating room" });
    }
  });
  
  app.get('/api/rooms/:id/layout', authenticateJWT, async (req, res) => {
    try {
      const room = await storage.getRoom(parseInt(req.params.id));
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      
      const layout = room.layout ? JSON.parse(room.layout) : null;
      res.json(layout);
    } catch (error) {
      res.status(500).json({ message: "Error fetching room layout" });
    }
  });
  
  app.put('/api/rooms/:id/layout', authenticateJWT, hasRole([UserRole.DIRECTOR, UserRole.NURSE]), async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const room = await storage.getRoom(roomId);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      
      const updatedRoom = await storage.updateRoom(roomId, { 
        layout: JSON.stringify(req.body) 
      });
      
      res.json(updatedRoom);
    } catch (error) {
      res.status(500).json({ message: "Error updating room layout" });
    }
  });
  
  // Get rooms with patients
  app.get('/api/rooms/with-patients', authenticateJWT, async (req, res) => {
    try {
      const roomsWithPatients = await storage.getAllRoomsWithPatients();
      res.json(roomsWithPatients);
    } catch (error) {
      res.status(500).json({ message: "Error fetching rooms with patients" });
    }
  });
  
  // Patient Routes
  app.get('/api/patients', authenticateJWT, hasRole([UserRole.DIRECTOR, UserRole.NURSE]), async (req, res) => {
    try {
      const patients = await storage.getPatients();
      res.json(patients);
    } catch (error) {
      res.status(500).json({ message: "Error fetching patients" });
    }
  });
  
  app.get('/api/patients/:id', authenticateJWT, async (req, res) => {
    try {
      // Patients can only view their own data
      if (req.user.role === UserRole.PATIENT && req.user.id !== parseInt(req.params.id)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const patient = await storage.getPatient(parseInt(req.params.id));
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      res.json(patient);
    } catch (error) {
      res.status(500).json({ message: "Error fetching patient" });
    }
  });
  
  app.get('/api/patients/:id/details', authenticateJWT, async (req, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const patient = await storage.getPatientWithDetails(patientId);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      // Guardians can only see details of their patients
      if (req.user.role === UserRole.GUARDIAN) {
        const guardian = await storage.getGuardianByPatientId(patientId);
        if (!guardian || guardian.userId !== req.user.id) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }
      
      res.json(patient);
    } catch (error) {
      res.status(500).json({ message: "Error fetching patient details" });
    }
  });
  
  app.post('/api/patients', authenticateJWT, hasRole([UserRole.DIRECTOR, UserRole.NURSE]), async (req, res) => {
    try {
      const validatedData = insertPatientSchema.parse(req.body);
      const patient = await storage.createPatient(validatedData);
      res.status(201).json(patient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid patient data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating patient" });
    }
  });
  
  app.put('/api/patients/:id', authenticateJWT, hasRole([UserRole.DIRECTOR, UserRole.NURSE]), async (req, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const patient = await storage.getPatient(patientId);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      const updatedPatient = await storage.updatePatient(patientId, req.body);
      res.json(updatedPatient);
    } catch (error) {
      res.status(500).json({ message: "Error updating patient" });
    }
  });
  
  // Guardian Routes
  app.get('/api/guardians', authenticateJWT, hasRole([UserRole.DIRECTOR, UserRole.NURSE]), async (req, res) => {
    try {
      const guardians = await storage.getGuardians();
      res.json(guardians);
    } catch (error) {
      res.status(500).json({ message: "Error fetching guardians" });
    }
  });
  
  app.get('/api/patients/:id/guardian', authenticateJWT, async (req, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const guardian = await storage.getGuardianByPatientId(patientId);
      
      if (!guardian) {
        return res.status(404).json({ message: "Guardian not found" });
      }
      
      res.json(guardian);
    } catch (error) {
      res.status(500).json({ message: "Error fetching guardian" });
    }
  });
  
  app.post('/api/guardians', authenticateJWT, hasRole([UserRole.DIRECTOR, UserRole.NURSE]), async (req, res) => {
    try {
      const validatedData = insertGuardianSchema.parse(req.body);
      const guardian = await storage.createGuardian(validatedData);
      res.status(201).json(guardian);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid guardian data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating guardian" });
    }
  });
  
  // Accident Routes
  app.get('/api/accidents', authenticateJWT, hasRole([UserRole.DIRECTOR, UserRole.NURSE]), async (req, res) => {
    try {
      const accidents = await storage.getAccidents();
      res.json(accidents);
    } catch (error) {
      res.status(500).json({ message: "Error fetching accidents" });
    }
  });
  
  app.get('/api/accidents/recent', authenticateJWT, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const accidents = await storage.getRecentAccidents(limit);
      res.json(accidents);
    } catch (error) {
      res.status(500).json({ message: "Error fetching recent accidents" });
    }
  });
  
  app.post('/api/accidents', async (req, res) => {
    try {
      // This route might be called by IOT devices, so no auth is required
      const { patientId, roomId } = req.body;
      
      if (!patientId || !roomId) {
        return res.status(400).json({ message: "patientId and roomId are required" });
      }
      
      const patient = await storage.getPatient(patientId);
      const room = await storage.getRoom(roomId);
      
      if (!patient || !room) {
        return res.status(404).json({ message: "Patient or room not found" });
      }
      
      const accident = await storage.createAccident({ patientId, roomId });
      
      // Update room status
      await storage.updateRoom(roomId, { status: "alert" });
      
      // Broadcast the accident to all connected clients
      broadcast({
        type: 'ACCIDENT',
        data: accident
      });
      
      res.status(201).json(accident);
    } catch (error) {
      res.status(500).json({ message: "Error creating accident record" });
    }
  });
  
  // AI 낙상 감지 엔드포인트
  app.post('/api/fall-detection', async (req, res) => {
    try {
      const { roomId, confidence, timestamp, poseData } = req.body;
      
      if (!roomId) {
        return res.status(400).json({ message: "roomId is required" });
      }
      
      const room = await storage.getRoom(roomId);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      
      // 해당 병실의 환자들 조회
      const patients = await storage.getPatientsByRoomId(roomId);
      
      if (patients.length === 0) {
        return res.status(404).json({ message: "No patients found in this room" });
      }
      
      // 첫 번째 환자를 기본값으로 사용 (실제로는 카메라 ID와 환자 매핑 필요)
      const patientId = patients[0].id;
      
      // 낙상 사고 기록
      const accident = await storage.createAccident({ 
        patientId, 
        roomId,
        date: timestamp ? new Date(timestamp) : new Date()
      });
      
      // 병실 상태 업데이트
      await storage.updateRoom(roomId, { status: "alert" });
      
      // 연결된 모든 클라이언트에게 알림 브로드캐스트
      broadcast({
        type: 'AI_FALL_DETECTION',
        data: {
          accident,
          confidence: confidence || 1.0,
          poseData: poseData || null
        }
      });
      
      res.status(201).json({
        success: true,
        accident,
        message: "낙상 감지 기록이 생성되었습니다."
      });
    } catch (error) {
      console.error("낙상 감지 처리 중 오류:", error);
      res.status(500).json({ 
        success: false,
        message: "낙상 감지 처리 중 오류가 발생했습니다."
      });
    }
  });
  
  app.put('/api/accidents/:id/resolve', authenticateJWT, hasRole([UserRole.DIRECTOR, UserRole.NURSE]), async (req, res) => {
    try {
      const accidentId = parseInt(req.params.id);
      const accident = await storage.getAccident(accidentId);
      
      if (!accident) {
        return res.status(404).json({ message: "Accident not found" });
      }
      
      const updatedAccident = await storage.updateAccident(accidentId, {
        resolved: true,
        resolvedBy: req.user.id
      });
      
      // Reset room status if no other active accidents
      const roomAccidents = await storage.getAccidentsByRoomId(accident.roomId);
      const hasActiveAccidents = roomAccidents.some(a => !a.resolved && a.id !== accidentId);
      
      if (!hasActiveAccidents) {
        await storage.updateRoom(accident.roomId, { status: "normal" });
      }
      
      broadcast({
        type: 'ACCIDENT_RESOLVED',
        data: updatedAccident
      });
      
      res.json(updatedAccident);
    } catch (error) {
      res.status(500).json({ message: "Error resolving accident" });
    }
  });
  
  // Environment Log Routes
  app.get('/api/rooms/:id/env-logs', authenticateJWT, async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      const logs = await storage.getEnvLogsByRoomId(roomId, limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Error fetching environment logs" });
    }
  });
  
  app.post('/api/env-logs', async (req, res) => {
    try {
      // This route might be called by IOT devices, so no auth is required
      const { roomId, temperature, humidity } = req.body;
      
      if (!roomId || temperature === undefined || humidity === undefined) {
        return res.status(400).json({ message: "roomId, temperature and humidity are required" });
      }
      
      const room = await storage.getRoom(roomId);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      
      const log = await storage.createEnvLog({ roomId, temperature, humidity });
      
      // If this log triggered an alert, broadcast it
      if (log.alert) {
        broadcast({
          type: 'ENV_ALERT',
          data: log
        });
      }
      
      res.status(201).json(log);
    } catch (error) {
      res.status(500).json({ message: "Error creating environment log" });
    }
  });
  
  // Camera Routes
  app.get('/api/cameras', authenticateJWT, async (req, res) => {
    try {
      const cameras = await storage.getCameras();
      res.json(cameras);
    } catch (error) {
      res.status(500).json({ message: "Error fetching cameras" });
    }
  });
  
  app.get('/api/rooms/:id/cameras', authenticateJWT, async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const cameras = await storage.getCamerasByRoomId(roomId);
      res.json(cameras);
    } catch (error) {
      res.status(500).json({ message: "Error fetching room cameras" });
    }
  });
  
  app.post('/api/cameras', authenticateJWT, hasRole([UserRole.DIRECTOR]), async (req, res) => {
    try {
      const validatedData = insertCameraSchema.parse(req.body);
      const camera = await storage.createCamera(validatedData);
      res.status(201).json(camera);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid camera data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating camera" });
    }
  });
  
  // Message Routes
  app.get('/api/messages/:user1Id/:user2Id', authenticateJWT, async (req, res) => {
    try {
      const user1Id = parseInt(req.params.user1Id);
      const user2Id = parseInt(req.params.user2Id);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      // Ensure current user is one of the participants
      if (req.user.id !== user1Id && req.user.id !== user2Id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const messages = await storage.getMessagesBetweenUsers(user1Id, user2Id, limit);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Error fetching messages" });
    }
  });
  
  app.post('/api/messages', authenticateJWT, async (req, res) => {
    try {
      const validatedData = insertMessageSchema.parse(req.body);
      
      // Ensure sender is the current user
      if (validatedData.senderId !== req.user.id) {
        return res.status(403).json({ message: "Sender ID must match authenticated user" });
      }
      
      const message = await storage.createMessage(validatedData);
      
      // Broadcast the message to inform connected clients
      broadcast({
        type: 'NEW_MESSAGE',
        data: message
      });
      
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      res.status(500).json({ message: "Error sending message" });
    }
  });
  
  app.put('/api/messages/:id/read', authenticateJWT, async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      const message = await storage.getMessage(messageId);
      
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      // Ensure recipient is the current user
      if (message.receiverId !== req.user.id) {
        return res.status(403).json({ message: "Only the recipient can mark a message as read" });
      }
      
      const updatedMessage = await storage.updateMessage(messageId, { read: true });
      res.json(updatedMessage);
    } catch (error) {
      res.status(500).json({ message: "Error updating message" });
    }
  });
  
  // Statistics Routes
  app.get('/api/stats/dashboard', authenticateJWT, async (req, res) => {
    try {
      const rooms = await storage.getRooms();
      const patients = await storage.getPatients();
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const accidents = await storage.getAccidents();
      const todayAccidents = accidents.filter(a => a.date >= todayStart);
      
      const envLogs = await storage.getEnvLogs();
      const alertLogs = envLogs.filter(log => log.alert);
      
      // Calculate fall risk distribution
      const fallRiskCounts = {
        low: patients.filter(p => p.fallRisk === 'low').length,
        medium: patients.filter(p => p.fallRisk === 'medium').length,
        high: patients.filter(p => p.fallRisk === 'high').length
      };
      
      // Get recent events
      const recentAccidents = await storage.getRecentAccidents(5);
      
      res.json({
        totalRooms: rooms.length,
        totalPatients: patients.length,
        todayAccidents: todayAccidents.length,
        environmentalAlerts: alertLogs.length,
        fallRiskDistribution: fallRiskCounts,
        recentEvents: recentAccidents
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching dashboard statistics" });
    }
  });
  
  // Weekly fall incidents
  app.get('/api/stats/fall-incidents', authenticateJWT, async (req, res) => {
    try {
      const accidents = await storage.getAccidents();
      
      // Get last 7 days
      const days = [];
      const counts = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(date.getDate() + 1);
        
        // Count accidents on this day
        const count = accidents.filter(a => 
          a.date >= date && a.date < nextDate
        ).length;
        
        days.push(date.toLocaleDateString('ko-KR', { weekday: 'short' }));
        counts.push(count);
      }
      
      res.json({
        labels: days,
        data: counts
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching fall incidents statistics" });
    }
  });

  return httpServer;
}
