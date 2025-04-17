/**
 * 데이터 저장소 모듈
 * 
 * 데이터베이스 접근 계층을 추상화하여 애플리케이션 비즈니스 로직과 데이터 저장소를 분리합니다.
 * 이 모듈은 메모리 저장소와 데이터베이스 저장소 두 가지 구현을 제공합니다.
 * - MemStorage: 개발 및 테스트용 인메모리 데이터 저장
 * - DatabaseStorage: 실제 PostgreSQL 데이터베이스 사용
 */

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

// 세션 저장소 설정
const PostgresSessionStore = connectPg(session);  // PostgreSQL 기반 세션 저장소
const MemoryStore = createMemoryStore(session);   // 메모리 기반 세션 저장소 (개발용)

/**
 * 저장소 인터페이스
 * 
 * 모든 데이터 접근 메서드를 정의하는 인터페이스입니다.
 * 이 인터페이스를 구현하는 구체적인 클래스는 다양한 저장 방식(메모리, 데이터베이스 등)을 제공할 수 있습니다.
 */
export interface IStorage {
  /** 
   * 세션 저장소
   * 사용자 세션 정보를 저장하는 객체 
   */
  sessionStore: any; // 세션 저장소 타입 (TypeScript 오류 방지를 위해 any 사용)
  
  /**
   * 사용자 관리 메서드
   * 사용자 계정과 관련된 모든 작업을 처리합니다.
   */
  getUser(id: number): Promise<User | undefined>;                         // ID로 사용자 조회
  getUserByUsername(username: string): Promise<User | undefined>;         // 사용자명으로 사용자 조회
  getUserByEmail(email: string): Promise<User | undefined>;               // 이메일로 사용자 조회
  createUser(user: InsertUser): Promise<User>;                            // 새 사용자 생성
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>; // 사용자 정보 수정
  deleteUser(id: number): Promise<boolean>;                               // 사용자 삭제
  getUsersByRole(role: UserRole): Promise<User[]>;                        // 역할별 사용자 목록 조회
  
  /**
   * 병실 관리 메서드
   * 병실 정보와 관련된 모든 작업을 처리합니다.
   */
  getRooms(): Promise<Room[]>;                                          // 모든 병실 목록 조회
  getRoom(id: number): Promise<Room | undefined>;                        // ID로 특정 병실 조회
  createRoom(room: InsertRoom): Promise<Room>;                          // 새 병실 생성
  updateRoom(id: number, roomData: Partial<Room>): Promise<Room | undefined>; // 병실 정보 수정
  deleteRoom(id: number): Promise<boolean>;                             // 병실 삭제
  getRoomWithPatients(id: number): Promise<RoomWithPatients | undefined>; // 환자 정보를 포함한 병실 조회
  getAllRoomsWithPatients(): Promise<RoomWithPatients[]>;               // 환자 정보를 포함한 모든 병실 조회
  
  /**
   * 환자 관리 메서드
   * 환자 정보와 관련된 모든 작업을 처리합니다.
   */
  getPatients(): Promise<Patient[]>;                                       // 모든 환자 목록 조회
  getPatient(id: number): Promise<Patient | undefined>;                    // ID로 환자 조회
  createPatient(patient: InsertPatient): Promise<Patient>;                 // 새 환자 등록
  updatePatient(id: number, patientData: Partial<Patient>): Promise<Patient | undefined>; // 환자 정보 수정
  deletePatient(id: number): Promise<boolean>;                             // 환자 삭제
  getPatientsByRoomId(roomId: number): Promise<Patient[]>;                 // 병실별 환자 목록 조회
  getPatientsByAssignedNurse(nurseId: number): Promise<Patient[]>;         // 담당 간호사별 환자 목록 조회
  getPatientWithDetails(id: number): Promise<PatientWithDetails | undefined>; // 상세 정보를 포함한 환자 조회
  getPatientsWithDetails(): Promise<PatientWithDetails[]>;                  // 상세 정보를 포함한 모든 환자 조회
  
  /**
   * 보호자 관리 메서드
   * 환자 보호자와 관련된 모든 작업을 처리합니다.
   */
  getGuardians(): Promise<Guardian[]>;                                     // 모든 보호자 목록 조회
  getGuardian(id: number): Promise<Guardian | undefined>;                  // ID로 보호자 조회
  createGuardian(guardian: InsertGuardian): Promise<Guardian>;             // 새 보호자 등록
  updateGuardian(id: number, guardianData: Partial<Guardian>): Promise<Guardian | undefined>; // 보호자 정보 수정
  deleteGuardian(id: number): Promise<boolean>;                            // 보호자 삭제
  getGuardianByPatientId(patientId: number): Promise<Guardian | undefined>; // 환자 ID로 보호자 조회
  
  /**
   * 낙상 사고 관리 메서드
   * 낙상 사고 기록과 관련된 모든 작업을 처리합니다.
   */
  getAccidents(): Promise<Accident[]>;                                     // 모든 낙상 사고 목록 조회
  getAccident(id: number): Promise<Accident | undefined>;                  // ID로 낙상 사고 조회
  createAccident(accident: InsertAccident): Promise<Accident>;             // 새 낙상 사고 기록 생성
  updateAccident(id: number, accidentData: Partial<Accident>): Promise<Accident | undefined>; // 낙상 사고 정보 수정
  getAccidentsByPatientId(patientId: number): Promise<Accident[]>;         // 환자별 낙상 사고 목록 조회
  getAccidentsByRoomId(roomId: number): Promise<Accident[]>;               // 병실별 낙상 사고 목록 조회
  getRecentAccidents(limit: number): Promise<Accident[]>;                  // 최근 낙상 사고 목록 조회 (개수 제한)
  
  /**
   * 환경 로그 관리 메서드
   * 병실 환경(온도, 습도 등) 측정 데이터와 관련된 모든 작업을 처리합니다.
   */
  getEnvLogs(): Promise<EnvLog[]>;                                         // 모든 환경 로그 조회
  createEnvLog(log: InsertEnvLog): Promise<EnvLog>;                        // 새 환경 로그 생성
  getEnvLogsByRoomId(roomId: number, limit?: number): Promise<EnvLog[]>;   // 병실별 환경 로그 조회 (개수 제한 가능)
  getLatestEnvLogByRoomId(roomId: number): Promise<EnvLog | undefined>;    // 병실별 최신 환경 로그 조회
  
  /**
   * 카메라 관리 메서드
   * CCTV 카메라와 관련된 모든 작업을 처리합니다.
   */
  getCameras(): Promise<Camera[]>;                                         // 모든 카메라 목록 조회
  getCamera(id: number): Promise<Camera | undefined>;                      // ID로 카메라 조회
  createCamera(camera: InsertCamera): Promise<Camera>;                     // 새 카메라 등록
  updateCamera(id: number, cameraData: Partial<Camera>): Promise<Camera | undefined>; // 카메라 정보 수정
  deleteCamera(id: number): Promise<boolean>;                              // 카메라 삭제
  getCamerasByRoomId(roomId: number): Promise<Camera[]>;                   // 병실별 카메라 목록 조회
  
  /**
   * 메시지 관리 메서드
   * 사용자 간 메시지와 관련된 모든 작업을 처리합니다.
   */
  getMessages(): Promise<Message[]>;                                       // 모든 메시지 조회
  getMessage(id: number): Promise<Message | undefined>;                    // ID로 메시지 조회
  createMessage(message: InsertMessage): Promise<Message>;                 // 새 메시지 생성
  updateMessage(id: number, messageData: Partial<Message>): Promise<Message | undefined>; // 메시지 정보 수정 (읽음 처리 등)
  getMessagesBetweenUsers(user1Id: number, user2Id: number, limit?: number): Promise<Message[]>; // 두 사용자 간 주고받은 메시지 조회
  getUnreadMessageCountForUser(userId: number): Promise<number>;           // 사용자별 안 읽은 메시지 수 조회
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
      email: "admin@example.com",
      password: "adminpassword", // Will be hashed in auth.ts
      name: "병원장",
      role: UserRole.DIRECTOR,
      preferredLanguage: "ko"
    });
    
    // 샘플 병실 초기화
    for (let i = 1; i <= 3; i++) {
      this.createRoom({
        name: `${100 + i}호`,
        tempThreshold: 26.0,
        humidityThreshold: 60.0,
        // 사용자 요청에 따라 레이아웃 기반 침대 관리에서 간단한 침대 목록으로 변경
        layout: JSON.stringify({
          beds: [
            { id: 1, label: `침대 1` },
            { id: 2, label: `침대 2` },
            { id: 3, label: `침대 3` },
            { id: 4, label: `침대 4` }
          ]
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
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
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
  
  async getPatientsByAssignedNurse(nurseId: number): Promise<Patient[]> {
    return Array.from(this.patients.values()).filter(patient => patient.assignedNurseId === nurseId);
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
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
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

  async getUsersByRole(role?: UserRole): Promise<User[]> {
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

  /**
   * 새 병실 생성
   * 
   * 사용자 요청에 따라 병실 정보를 데이터베이스에 저장하고, 
   * 임시 온도 및 습도 값을 설정합니다.
   */
  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    // 사용자 요청에 따라 레이아웃은 이제 간단한 침대 목록만 포함합니다.
    // 이전의 좌표 기반 레이아웃 코드는 제거되었습니다.
    const [room] = await db.insert(rooms).values({
      ...insertRoom,
      currentTemp: Math.random() * 5 + 20, // 20°C~25°C 사이의 임의의 온도
      currentHumidity: Math.random() * 20 + 40, // 40%~60% 사이의 임의의 습도
      status: "normal" // 정상 상태로 초기화
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
  
  async getPatientsByAssignedNurse(nurseId: number): Promise<Patient[]> {
    return await db.select().from(patients).where(eq(patients.assignedNurseId, nurseId));
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
    .where(eq(users.role, UserRole.DIRECTOR))
    .limit(1);
  
  if (adminCheck.length === 0) {
    console.log("Creating admin user");
    // Create admin user with a hashed password
    const salt = randomBytes(16).toString("hex");
    const buf = await scryptAsync("adminpassword", salt, 64) as Buffer;
    const hashedPassword = `${buf.toString("hex")}.${salt}`;
    
    await db.insert(users).values({
      username: "admin",
      email: "admin@example.com",
      password: hashedPassword,
      name: "병원장",
      role: UserRole.DIRECTOR,
      preferredLanguage: "ko"
    });
  }
  
  // Check if rooms exist
  const roomsCheck = await db.select().from(rooms).limit(1);
  
  if (roomsCheck.length === 0) {
    console.log("Creating sample rooms");
    // Create sample rooms
    // 샘플 병실 초기화
    for (let i = 1; i <= 3; i++) {
      await db.insert(rooms).values({
        name: `${100 + i}호`,
        tempThreshold: 26.0,
        humidityThreshold: 60.0,
        // 사용자 요청에 따라 레이아웃 기반 침대 관리에서 간단한 침대 목록으로 변경
        layout: JSON.stringify({
          beds: [
            { id: 1, label: `침대 1` },
            { id: 2, label: `침대 2` },
            { id: 3, label: `침대 3` },
            { id: 4, label: `침대 4` }
          ]
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
