import { 
  users, patients, rooms, guardians, accidents, envLogs, cameras, messages,
  User, Room, Patient, Guardian, Accident, EnvLog, Camera, Message,
  InsertUser, InsertRoom, InsertPatient, InsertGuardian, InsertAccident, InsertEnvLog, InsertCamera, InsertMessage,
  UserRole, RoomWithPatients, PatientWithDetails
} from "@shared/schema";
import session from "express-session";
import { db } from "./db";
import { eq, and, desc, asc, or } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import createMemoryStore from "memorystore";

const PostgresSessionStore = connectPg(session);
const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Session store
  sessionStore: any; // Using any for session store type to avoid TypeScript errors
  
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getUsersByRole(role: UserRole): Promise<User[]>;
  
  // Room methods
  getRooms(): Promise<Room[]>;
  getRoom(id: number): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
  updateRoom(id: number, roomData: Partial<Room>): Promise<Room | undefined>;
  deleteRoom(id: number): Promise<boolean>;
  getRoomWithPatients(id: number): Promise<RoomWithPatients | undefined>;
  getAllRoomsWithPatients(): Promise<RoomWithPatients[]>;
  
  // Patient methods
  getPatients(): Promise<Patient[]>;
  getPatient(id: number): Promise<Patient | undefined>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: number, patientData: Partial<Patient>): Promise<Patient | undefined>;
  deletePatient(id: number): Promise<boolean>;
  getPatientsByRoomId(roomId: number): Promise<Patient[]>;
  getPatientWithDetails(id: number): Promise<PatientWithDetails | undefined>;
  getPatientsWithDetails(): Promise<PatientWithDetails[]>;
  
  // Guardian methods
  getGuardians(): Promise<Guardian[]>;
  getGuardian(id: number): Promise<Guardian | undefined>;
  createGuardian(guardian: InsertGuardian): Promise<Guardian>;
  updateGuardian(id: number, guardianData: Partial<Guardian>): Promise<Guardian | undefined>;
  deleteGuardian(id: number): Promise<boolean>;
  getGuardianByPatientId(patientId: number): Promise<Guardian | undefined>;
  
  // Accident methods
  getAccidents(): Promise<Accident[]>;
  getAccident(id: number): Promise<Accident | undefined>;
  createAccident(accident: InsertAccident): Promise<Accident>;
  updateAccident(id: number, accidentData: Partial<Accident>): Promise<Accident | undefined>;
  getAccidentsByPatientId(patientId: number): Promise<Accident[]>;
  getAccidentsByRoomId(roomId: number): Promise<Accident[]>;
  getRecentAccidents(limit: number): Promise<Accident[]>;
  
  // Environmental logs methods
  getEnvLogs(): Promise<EnvLog[]>;
  createEnvLog(log: InsertEnvLog): Promise<EnvLog>;
  getEnvLogsByRoomId(roomId: number, limit?: number): Promise<EnvLog[]>;
  getLatestEnvLogByRoomId(roomId: number): Promise<EnvLog | undefined>;
  
  // Camera methods
  getCameras(): Promise<Camera[]>;
  getCamera(id: number): Promise<Camera | undefined>;
  createCamera(camera: InsertCamera): Promise<Camera>;
  updateCamera(id: number, cameraData: Partial<Camera>): Promise<Camera | undefined>;
  deleteCamera(id: number): Promise<boolean>;
  getCamerasByRoomId(roomId: number): Promise<Camera[]>;
  
  // Message methods
  getMessages(): Promise<Message[]>;
  getMessage(id: number): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: number, messageData: Partial<Message>): Promise<Message | undefined>;
  getMessagesBetweenUsers(user1Id: number, user2Id: number, limit?: number): Promise<Message[]>;
  getUnreadMessageCountForUser(userId: number): Promise<number>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private rooms: Map<number, Room>;
  private patients: Map<number, Patient>;
  private guardians: Map<number, Guardian>;
  private accidents: Map<number, Accident>;
  private envLogs: Map<number, EnvLog>;
  private cameras: Map<number, Camera>;
  private messages: Map<number, Message>;
  sessionStore: any; // Using any for session store type to avoid TypeScript errors
  
  private userIdCounter: number = 1;
  private roomIdCounter: number = 1;
  private patientIdCounter: number = 1;
  private guardianIdCounter: number = 1;
  private accidentIdCounter: number = 1;
  private envLogIdCounter: number = 1;
  private cameraIdCounter: number = 1;
  private messageIdCounter: number = 1;

  constructor() {
    this.users = new Map();
    this.rooms = new Map();
    this.patients = new Map();
    this.guardians = new Map();
    this.accidents = new Map();
    this.envLogs = new Map();
    this.cameras = new Map();
    this.messages = new Map();
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    // Initialize with admin user
    this.createUser({
      username: "admin",
      password: "adminpassword", // Will be hashed in auth.ts
      name: "병원장",
      role: UserRole.ADMIN,
      preferredLanguage: "ko"
    });
    
    // Initialize sample rooms
    for (let i = 1; i <= 3; i++) {
      this.createRoom({
        name: `${100 + i}호`,
        tempThreshold: 26.0,
        humidityThreshold: 60.0,
        layout: JSON.stringify({
          beds: [
            { id: 1, x: 50, y: 50, width: 100, height: 50, label: `침대 ${i}` },
            { id: 2, x: 50, y: 150, width: 100, height: 50, label: `침대 ${i+1}` },
            { id: 3, x: 200, y: 50, width: 100, height: 50, label: `침대 ${i+2}` },
            { id: 4, x: 200, y: 150, width: 100, height: 50, label: `침대 ${i+3}` }
          ],
          walls: [
            { id: 1, x: 0, y: 0, width: 350, height: 10 },
            { id: 2, x: 0, y: 0, width: 10, height: 250 },
            { id: 3, x: 340, y: 0, width: 10, height: 250 },
            { id: 4, x: 0, y: 240, width: 350, height: 10 }
          ],
          door: { id: 1, x: 150, y: 0, width: 50, height: 10 }
        })
      });
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt, fcmToken: null };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async getUsersByRole(role: UserRole): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === role);
  }

  // Room methods
  async getRooms(): Promise<Room[]> {
    return Array.from(this.rooms.values());
  }

  async getRoom(id: number): Promise<Room | undefined> {
    return this.rooms.get(id);
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const id = this.roomIdCounter++;
    const room: Room = { 
      ...insertRoom, 
      id, 
      currentTemp: Math.random() * 5 + 20, // Random temp between 20-25
      currentHumidity: Math.random() * 20 + 40, // Random humidity between 40-60
      status: "normal"
    };
    this.rooms.set(id, room);
    return room;
  }

  async updateRoom(id: number, roomData: Partial<Room>): Promise<Room | undefined> {
    const room = this.rooms.get(id);
    if (!room) return undefined;

    const updatedRoom = { ...room, ...roomData };
    this.rooms.set(id, updatedRoom);
    return updatedRoom;
  }

  async deleteRoom(id: number): Promise<boolean> {
    return this.rooms.delete(id);
  }

  async getRoomWithPatients(id: number): Promise<RoomWithPatients | undefined> {
    const room = this.rooms.get(id);
    if (!room) return undefined;

    const roomPatients = await this.getPatientsByRoomId(id);
    return { ...room, patients: roomPatients };
  }

  async getAllRoomsWithPatients(): Promise<RoomWithPatients[]> {
    const rooms = await this.getRooms();
    const result: RoomWithPatients[] = [];

    for (const room of rooms) {
      const patients = await this.getPatientsByRoomId(room.id);
      result.push({ ...room, patients });
    }

    return result;
  }

  // Patient methods
  async getPatients(): Promise<Patient[]> {
    return Array.from(this.patients.values());
  }

  async getPatient(id: number): Promise<Patient | undefined> {
    return this.patients.get(id);
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const id = this.patientIdCounter++;
    const patient: Patient = { ...insertPatient, id };
    this.patients.set(id, patient);
    return patient;
  }

  async updatePatient(id: number, patientData: Partial<Patient>): Promise<Patient | undefined> {
    const patient = this.patients.get(id);
    if (!patient) return undefined;

    const updatedPatient = { ...patient, ...patientData };
    this.patients.set(id, updatedPatient);
    return updatedPatient;
  }

  async deletePatient(id: number): Promise<boolean> {
    return this.patients.delete(id);
  }

  async getPatientsByRoomId(roomId: number): Promise<Patient[]> {
    return Array.from(this.patients.values()).filter(patient => patient.roomId === roomId);
  }

  async getPatientWithDetails(id: number): Promise<PatientWithDetails | undefined> {
    const patient = this.patients.get(id);
    if (!patient) return undefined;

    const user = patient.userId ? await this.getUser(patient.userId) : undefined;
    const room = patient.roomId ? await this.getRoom(patient.roomId) : undefined;
    const guardian = await this.getGuardianByPatientId(id);
    const assignedNurse = patient.assignedNurseId ? await this.getUser(patient.assignedNurseId) : undefined;

    if (!user || !room) return undefined;

    return {
      ...patient,
      user,
      room,
      guardian,
      assignedNurse
    };
  }

  async getPatientsWithDetails(): Promise<PatientWithDetails[]> {
    const patients = await this.getPatients();
    const result: PatientWithDetails[] = [];

    for (const patient of patients) {
      const patientWithDetails = await this.getPatientWithDetails(patient.id);
      if (patientWithDetails) {
        result.push(patientWithDetails);
      }
    }

    return result;
  }

  // Guardian methods
  async getGuardians(): Promise<Guardian[]> {
    return Array.from(this.guardians.values());
  }

  async getGuardian(id: number): Promise<Guardian | undefined> {
    return this.guardians.get(id);
  }

  async createGuardian(insertGuardian: InsertGuardian): Promise<Guardian> {
    const id = this.guardianIdCounter++;
    const guardian: Guardian = { ...insertGuardian, id };
    this.guardians.set(id, guardian);
    return guardian;
  }

  async updateGuardian(id: number, guardianData: Partial<Guardian>): Promise<Guardian | undefined> {
    const guardian = this.guardians.get(id);
    if (!guardian) return undefined;

    const updatedGuardian = { ...guardian, ...guardianData };
    this.guardians.set(id, updatedGuardian);
    return updatedGuardian;
  }

  async deleteGuardian(id: number): Promise<boolean> {
    return this.guardians.delete(id);
  }

  async getGuardianByPatientId(patientId: number): Promise<Guardian | undefined> {
    return Array.from(this.guardians.values()).find(guardian => guardian.patientId === patientId);
  }

  // Accident methods
  async getAccidents(): Promise<Accident[]> {
    return Array.from(this.accidents.values());
  }

  async getAccident(id: number): Promise<Accident | undefined> {
    return this.accidents.get(id);
  }

  async createAccident(insertAccident: InsertAccident): Promise<Accident> {
    const id = this.accidentIdCounter++;
    const accident: Accident = { 
      ...insertAccident, 
      id, 
      date: new Date(), 
      notified: false, 
      resolved: false,
      resolvedBy: null
    };
    this.accidents.set(id, accident);
    return accident;
  }

  async updateAccident(id: number, accidentData: Partial<Accident>): Promise<Accident | undefined> {
    const accident = this.accidents.get(id);
    if (!accident) return undefined;

    const updatedAccident = { ...accident, ...accidentData };
    this.accidents.set(id, updatedAccident);
    return updatedAccident;
  }

  async getAccidentsByPatientId(patientId: number): Promise<Accident[]> {
    return Array.from(this.accidents.values())
      .filter(accident => accident.patientId === patientId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async getAccidentsByRoomId(roomId: number): Promise<Accident[]> {
    return Array.from(this.accidents.values())
      .filter(accident => accident.roomId === roomId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async getRecentAccidents(limit: number): Promise<Accident[]> {
    return Array.from(this.accidents.values())
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, limit);
  }

  // Environmental logs methods
  async getEnvLogs(): Promise<EnvLog[]> {
    return Array.from(this.envLogs.values());
  }

  async createEnvLog(insertLog: InsertEnvLog): Promise<EnvLog> {
    const id = this.envLogIdCounter++;
    const room = await this.getRoom(insertLog.roomId);
    
    let alert = false;
    if (room) {
      alert = insertLog.temperature > room.tempThreshold || 
              insertLog.humidity > room.humidityThreshold;
      
      // Update room's current temperature and humidity
      await this.updateRoom(room.id, {
        currentTemp: insertLog.temperature,
        currentHumidity: insertLog.humidity,
        status: alert ? "warning" : "normal"
      });
    }
    
    const log: EnvLog = { 
      ...insertLog, 
      id, 
      timestamp: new Date(),
      alert
    };
    
    this.envLogs.set(id, log);
    return log;
  }

  async getEnvLogsByRoomId(roomId: number, limit?: number): Promise<EnvLog[]> {
    const logs = Array.from(this.envLogs.values())
      .filter(log => log.roomId === roomId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return limit ? logs.slice(0, limit) : logs;
  }

  async getLatestEnvLogByRoomId(roomId: number): Promise<EnvLog | undefined> {
    const logs = await this.getEnvLogsByRoomId(roomId, 1);
    return logs.length > 0 ? logs[0] : undefined;
  }

  // Camera methods
  async getCameras(): Promise<Camera[]> {
    return Array.from(this.cameras.values());
  }

  async getCamera(id: number): Promise<Camera | undefined> {
    return this.cameras.get(id);
  }

  async createCamera(insertCamera: InsertCamera): Promise<Camera> {
    const id = this.cameraIdCounter++;
    const camera: Camera = { ...insertCamera, id, active: true };
    this.cameras.set(id, camera);
    return camera;
  }

  async updateCamera(id: number, cameraData: Partial<Camera>): Promise<Camera | undefined> {
    const camera = this.cameras.get(id);
    if (!camera) return undefined;

    const updatedCamera = { ...camera, ...cameraData };
    this.cameras.set(id, updatedCamera);
    return updatedCamera;
  }

  async deleteCamera(id: number): Promise<boolean> {
    return this.cameras.delete(id);
  }

  async getCamerasByRoomId(roomId: number): Promise<Camera[]> {
    return Array.from(this.cameras.values()).filter(camera => camera.roomId === roomId);
  }

  // Message methods
  async getMessages(): Promise<Message[]> {
    return Array.from(this.messages.values());
  }

  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const message: Message = { 
      ...insertMessage, 
      id, 
      timestamp: new Date(),
      read: false
    };
    this.messages.set(id, message);
    return message;
  }

  async updateMessage(id: number, messageData: Partial<Message>): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;

    const updatedMessage = { ...message, ...messageData };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }

  async getMessagesBetweenUsers(user1Id: number, user2Id: number, limit?: number): Promise<Message[]> {
    const messages = Array.from(this.messages.values())
      .filter(msg => 
        (msg.senderId === user1Id && msg.receiverId === user2Id) ||
        (msg.senderId === user2Id && msg.receiverId === user1Id)
      )
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    return limit ? messages.slice(-limit) : messages;
  }

  async getUnreadMessageCountForUser(userId: number): Promise<number> {
    return Array.from(this.messages.values())
      .filter(msg => msg.receiverId === userId && !msg.read)
      .length;
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: any; // Using any for session store type to avoid TypeScript errors

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }

  async getUsersByRole(role: UserRole): Promise<User[]> {
    if (!role) {
      return await db.select().from(users);
    }
    return await db.select().from(users).where(eq(users.role, role));
  }

  // Room methods
  async getRooms(): Promise<Room[]> {
    return await db.select().from(rooms);
  }

  async getRoom(id: number): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room;
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const [room] = await db.insert(rooms).values({
      ...insertRoom,
      currentTemp: Math.random() * 5 + 20, // Random temp between 20-25
      currentHumidity: Math.random() * 20 + 40, // Random humidity between 40-60
      status: "normal"
    }).returning();
    return room;
  }

  async updateRoom(id: number, roomData: Partial<Room>): Promise<Room | undefined> {
    const [updatedRoom] = await db.update(rooms)
      .set(roomData)
      .where(eq(rooms.id, id))
      .returning();
    return updatedRoom;
  }

  async deleteRoom(id: number): Promise<boolean> {
    const result = await db.delete(rooms).where(eq(rooms.id, id));
    return result.rowCount > 0;
  }

  async getRoomWithPatients(id: number): Promise<RoomWithPatients | undefined> {
    const room = await this.getRoom(id);
    if (!room) return undefined;
    
    const roomPatients = await this.getPatientsByRoomId(id);
    return { ...room, patients: roomPatients };
  }

  async getAllRoomsWithPatients(): Promise<RoomWithPatients[]> {
    const rooms = await this.getRooms();
    const result: RoomWithPatients[] = [];

    for (const room of rooms) {
      const patients = await this.getPatientsByRoomId(room.id);
      result.push({ ...room, patients });
    }

    return result;
  }

  // Patient methods
  async getPatients(): Promise<Patient[]> {
    return await db.select().from(patients);
  }

  async getPatient(id: number): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
    return patient;
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const [patient] = await db.insert(patients).values(insertPatient).returning();
    return patient;
  }

  async updatePatient(id: number, patientData: Partial<Patient>): Promise<Patient | undefined> {
    const [updatedPatient] = await db.update(patients)
      .set(patientData)
      .where(eq(patients.id, id))
      .returning();
    return updatedPatient;
  }

  async deletePatient(id: number): Promise<boolean> {
    const result = await db.delete(patients).where(eq(patients.id, id));
    return result.rowCount > 0;
  }

  async getPatientsByRoomId(roomId: number): Promise<Patient[]> {
    return await db.select().from(patients).where(eq(patients.roomId, roomId));
  }

  async getPatientWithDetails(id: number): Promise<PatientWithDetails | undefined> {
    const patient = await this.getPatient(id);
    if (!patient) return undefined;

    const [user] = patient.userId ? 
      await db.select().from(users).where(eq(users.id, patient.userId)) : 
      [undefined];
      
    const [room] = patient.roomId ? 
      await db.select().from(rooms).where(eq(rooms.id, patient.roomId)) : 
      [undefined];
      
    const [guardian] = await db.select().from(guardians).where(eq(guardians.patientId, id));
    
    const [assignedNurse] = patient.assignedNurseId ? 
      await db.select().from(users).where(eq(users.id, patient.assignedNurseId)) : 
      [undefined];

    if (!user || !room) return undefined;

    return {
      ...patient,
      user,
      room,
      guardian,
      assignedNurse
    };
  }

  async getPatientsWithDetails(): Promise<PatientWithDetails[]> {
    const patientsList = await this.getPatients();
    const result: PatientWithDetails[] = [];

    for (const patient of patientsList) {
      const patientWithDetails = await this.getPatientWithDetails(patient.id);
      if (patientWithDetails) {
        result.push(patientWithDetails);
      }
    }

    return result;
  }

  // Guardian methods
  async getGuardians(): Promise<Guardian[]> {
    return await db.select().from(guardians);
  }

  async getGuardian(id: number): Promise<Guardian | undefined> {
    const [guardian] = await db.select().from(guardians).where(eq(guardians.id, id));
    return guardian;
  }

  async createGuardian(insertGuardian: InsertGuardian): Promise<Guardian> {
    const [guardian] = await db.insert(guardians).values(insertGuardian).returning();
    return guardian;
  }

  async updateGuardian(id: number, guardianData: Partial<Guardian>): Promise<Guardian | undefined> {
    const [updatedGuardian] = await db.update(guardians)
      .set(guardianData)
      .where(eq(guardians.id, id))
      .returning();
    return updatedGuardian;
  }

  async deleteGuardian(id: number): Promise<boolean> {
    const result = await db.delete(guardians).where(eq(guardians.id, id));
    return result.rowCount > 0;
  }

  async getGuardianByPatientId(patientId: number): Promise<Guardian | undefined> {
    const [guardian] = await db.select().from(guardians).where(eq(guardians.patientId, patientId));
    return guardian;
  }

  // Accident methods
  async getAccidents(): Promise<Accident[]> {
    return await db.select().from(accidents);
  }

  async getAccident(id: number): Promise<Accident | undefined> {
    const [accident] = await db.select().from(accidents).where(eq(accidents.id, id));
    return accident;
  }

  async createAccident(insertAccident: InsertAccident): Promise<Accident> {
    const [accident] = await db.insert(accidents).values({
      ...insertAccident,
      date: new Date(),
      notified: false,
      resolved: false,
      resolvedBy: null
    }).returning();
    return accident;
  }

  async updateAccident(id: number, accidentData: Partial<Accident>): Promise<Accident | undefined> {
    const [updatedAccident] = await db.update(accidents)
      .set(accidentData)
      .where(eq(accidents.id, id))
      .returning();
    return updatedAccident;
  }

  async getAccidentsByPatientId(patientId: number): Promise<Accident[]> {
    return await db.select().from(accidents)
      .where(eq(accidents.patientId, patientId))
      .orderBy(desc(accidents.date));
  }

  async getAccidentsByRoomId(roomId: number): Promise<Accident[]> {
    return await db.select().from(accidents)
      .where(eq(accidents.roomId, roomId))
      .orderBy(desc(accidents.date));
  }

  async getRecentAccidents(limit: number): Promise<Accident[]> {
    return await db.select().from(accidents)
      .orderBy(desc(accidents.date))
      .limit(limit);
  }

  // Environmental logs methods
  async getEnvLogs(): Promise<EnvLog[]> {
    return await db.select().from(envLogs);
  }

  async createEnvLog(insertLog: InsertEnvLog): Promise<EnvLog> {
    const room = await this.getRoom(insertLog.roomId);
    
    let alert = false;
    if (room) {
      alert = insertLog.temperature > room.tempThreshold || 
              insertLog.humidity > room.humidityThreshold;
      
      // Update room's current temperature and humidity
      await this.updateRoom(room.id, {
        currentTemp: insertLog.temperature,
        currentHumidity: insertLog.humidity,
        status: alert ? "warning" : "normal"
      });
    }
    
    const [log] = await db.insert(envLogs).values({
      ...insertLog,
      timestamp: new Date(),
      alert
    }).returning();
    
    return log;
  }

  async getEnvLogsByRoomId(roomId: number, limit?: number): Promise<EnvLog[]> {
    const query = db.select().from(envLogs)
      .where(eq(envLogs.roomId, roomId))
      .orderBy(desc(envLogs.timestamp));
    
    if (limit) {
      query.limit(limit);
    }
    
    return await query;
  }

  async getLatestEnvLogByRoomId(roomId: number): Promise<EnvLog | undefined> {
    const [log] = await db.select().from(envLogs)
      .where(eq(envLogs.roomId, roomId))
      .orderBy(desc(envLogs.timestamp))
      .limit(1);
    
    return log;
  }

  // Camera methods
  async getCameras(): Promise<Camera[]> {
    return await db.select().from(cameras);
  }

  async getCamera(id: number): Promise<Camera | undefined> {
    const [camera] = await db.select().from(cameras).where(eq(cameras.id, id));
    return camera;
  }

  async createCamera(insertCamera: InsertCamera): Promise<Camera> {
    const [camera] = await db.insert(cameras).values({
      ...insertCamera,
      active: true
    }).returning();
    return camera;
  }

  async updateCamera(id: number, cameraData: Partial<Camera>): Promise<Camera | undefined> {
    const [updatedCamera] = await db.update(cameras)
      .set(cameraData)
      .where(eq(cameras.id, id))
      .returning();
    return updatedCamera;
  }

  async deleteCamera(id: number): Promise<boolean> {
    const result = await db.delete(cameras).where(eq(cameras.id, id));
    return result.rowCount > 0;
  }

  async getCamerasByRoomId(roomId: number): Promise<Camera[]> {
    return await db.select().from(cameras).where(eq(cameras.roomId, roomId));
  }

  // Message methods
  async getMessages(): Promise<Message[]> {
    return await db.select().from(messages);
  }

  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values({
      ...insertMessage,
      timestamp: new Date(),
      read: false
    }).returning();
    return message;
  }

  async updateMessage(id: number, messageData: Partial<Message>): Promise<Message | undefined> {
    const [updatedMessage] = await db.update(messages)
      .set(messageData)
      .where(eq(messages.id, id))
      .returning();
    return updatedMessage;
  }

  async getMessagesBetweenUsers(user1Id: number, user2Id: number, limit?: number): Promise<Message[]> {
    const query = db.select().from(messages)
      .where(
        or(
          and(
            eq(messages.senderId, user1Id),
            eq(messages.receiverId, user2Id)
          ),
          and(
            eq(messages.senderId, user2Id),
            eq(messages.receiverId, user1Id)
          )
        )
      )
      .orderBy(asc(messages.timestamp));
    
    if (limit) {
      // Get the most recent messages if limit is provided
      const totalCount = await db.select({ count: messages.id }).from(messages)
        .where(
          or(
            and(
              eq(messages.senderId, user1Id),
              eq(messages.receiverId, user2Id)
            ),
            and(
              eq(messages.senderId, user2Id),
              eq(messages.receiverId, user1Id)
            )
          )
        );
      
      const count = totalCount[0]?.count || 0;
      if (count > limit) {
        const offset = count - limit;
        query.offset(offset);
      }
    }
    
    return await query;
  }

  async getUnreadMessageCountForUser(userId: number): Promise<number> {
    const result = await db.select({ count: messages.id }).from(messages)
      .where(
        and(
          eq(messages.receiverId, userId),
          eq(messages.read, false)
        )
      );
    
    return result[0]?.count || 0;
  }
}

// Add admin user and sample rooms if none exist
async function initializeData() {
  // Check if admin user exists
  const adminCheck = await db.select().from(users)
    .where(eq(users.role, UserRole.ADMIN))
    .limit(1);
  
  if (adminCheck.length === 0) {
    console.log("Creating admin user");
    // Create admin user with a hashed password
    const salt = randomBytes(16).toString("hex");
    const buf = await scryptAsync("adminpassword", salt, 64) as Buffer;
    const hashedPassword = `${buf.toString("hex")}.${salt}`;
    
    await db.insert(users).values({
      username: "admin",
      password: hashedPassword,
      name: "병원장",
      role: UserRole.ADMIN,
      preferredLanguage: "ko"
    });
  }
  
  // Check if rooms exist
  const roomsCheck = await db.select().from(rooms).limit(1);
  
  if (roomsCheck.length === 0) {
    console.log("Creating sample rooms");
    // Create sample rooms
    for (let i = 1; i <= 3; i++) {
      await db.insert(rooms).values({
        name: `${100 + i}호`,
        tempThreshold: 26.0,
        humidityThreshold: 60.0,
        layout: JSON.stringify({
          beds: [
            { id: 1, x: 50, y: 50, width: 100, height: 50, label: `침대 ${i}` },
            { id: 2, x: 50, y: 150, width: 100, height: 50, label: `침대 ${i+1}` },
            { id: 3, x: 200, y: 50, width: 100, height: 50, label: `침대 ${i+2}` },
            { id: 4, x: 200, y: 150, width: 100, height: 50, label: `침대 ${i+3}` }
          ],
          walls: [
            { id: 1, x: 0, y: 0, width: 350, height: 10 },
            { id: 2, x: 0, y: 0, width: 10, height: 250 },
            { id: 3, x: 340, y: 0, width: 10, height: 250 },
            { id: 4, x: 0, y: 240, width: 350, height: 10 }
          ],
          door: { id: 1, x: 150, y: 0, width: 50, height: 10 }
        }),
        currentTemp: Math.random() * 5 + 20, // Random temp between 20-25
        currentHumidity: Math.random() * 20 + 40, // Random humidity between 40-60
        status: "normal"
      });
    }
  }
}

// Import crypto modules
import { randomBytes } from 'crypto';
import { promisify } from 'util';
import { scrypt } from 'crypto';

// Create promisified version of scrypt
const scryptAsync = promisify(scrypt);

// Export an instance of DatabaseStorage
const storage = new DatabaseStorage();

// Initialize data if needed
initializeData().catch(console.error);

export { storage };
