import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { WebSocketServer } from "ws";
import { z } from "zod";
import { insertRoomSchema, insertPatientSchema, insertGuardianSchema, insertCameraSchema, insertMessageSchema, UserRole } from "@shared/schema";

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

// Middleware to check if user has specific role
const hasRole = (roles: UserRole[]) => (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  if (roles.includes(req.user.role as UserRole)) {
    return next();
  }
  
  res.status(403).json({ message: "Forbidden" });
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
  
  // User Routes
  app.get('/api/users', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.NURSE]), async (req, res) => {
    const users = await storage.getUsersByRole(req.query.role as UserRole);
    res.json(users);
  });
  
  // Current user language preference
  app.patch('/api/user/language', isAuthenticated, async (req, res) => {
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
  app.get('/api/rooms', isAuthenticated, async (req, res) => {
    try {
      const rooms = await storage.getRooms();
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ message: "Error fetching rooms" });
    }
  });
  
  app.get('/api/rooms/:id', isAuthenticated, async (req, res) => {
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
  
  app.post('/api/rooms', isAuthenticated, hasRole([UserRole.ADMIN]), async (req, res) => {
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
  
  app.put('/api/rooms/:id', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.NURSE]), async (req, res) => {
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
  
  app.get('/api/rooms/:id/layout', isAuthenticated, async (req, res) => {
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
  
  app.put('/api/rooms/:id/layout', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.NURSE]), async (req, res) => {
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
  app.get('/api/rooms/with-patients', isAuthenticated, async (req, res) => {
    try {
      const roomsWithPatients = await storage.getAllRoomsWithPatients();
      res.json(roomsWithPatients);
    } catch (error) {
      res.status(500).json({ message: "Error fetching rooms with patients" });
    }
  });
  
  // Patient Routes
  app.get('/api/patients', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.NURSE]), async (req, res) => {
    try {
      const patients = await storage.getPatients();
      res.json(patients);
    } catch (error) {
      res.status(500).json({ message: "Error fetching patients" });
    }
  });
  
  app.get('/api/patients/:id', isAuthenticated, async (req, res) => {
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
  
  app.get('/api/patients/:id/details', isAuthenticated, async (req, res) => {
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
  
  app.post('/api/patients', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.NURSE]), async (req, res) => {
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
  
  app.put('/api/patients/:id', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.NURSE]), async (req, res) => {
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
  app.get('/api/guardians', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.NURSE]), async (req, res) => {
    try {
      const guardians = await storage.getGuardians();
      res.json(guardians);
    } catch (error) {
      res.status(500).json({ message: "Error fetching guardians" });
    }
  });
  
  app.get('/api/patients/:id/guardian', isAuthenticated, async (req, res) => {
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
  
  app.post('/api/guardians', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.NURSE]), async (req, res) => {
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
  app.get('/api/accidents', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.NURSE]), async (req, res) => {
    try {
      const accidents = await storage.getAccidents();
      res.json(accidents);
    } catch (error) {
      res.status(500).json({ message: "Error fetching accidents" });
    }
  });
  
  app.get('/api/accidents/recent', isAuthenticated, async (req, res) => {
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
  
  app.put('/api/accidents/:id/resolve', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.NURSE]), async (req, res) => {
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
  app.get('/api/rooms/:id/env-logs', isAuthenticated, async (req, res) => {
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
  app.get('/api/cameras', isAuthenticated, async (req, res) => {
    try {
      const cameras = await storage.getCameras();
      res.json(cameras);
    } catch (error) {
      res.status(500).json({ message: "Error fetching cameras" });
    }
  });
  
  app.get('/api/rooms/:id/cameras', isAuthenticated, async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const cameras = await storage.getCamerasByRoomId(roomId);
      res.json(cameras);
    } catch (error) {
      res.status(500).json({ message: "Error fetching room cameras" });
    }
  });
  
  app.post('/api/cameras', isAuthenticated, hasRole([UserRole.ADMIN]), async (req, res) => {
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
  app.get('/api/messages/:user1Id/:user2Id', isAuthenticated, async (req, res) => {
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
  
  app.post('/api/messages', isAuthenticated, async (req, res) => {
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
  
  app.put('/api/messages/:id/read', isAuthenticated, async (req, res) => {
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
  app.get('/api/stats/dashboard', isAuthenticated, async (req, res) => {
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
  app.get('/api/stats/fall-incidents', isAuthenticated, async (req, res) => {
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
