/**
 * 데이터 저장소 모듈
 * 
 * 데이터베이스 접근 계층을 추상화하여 애플리케이션 비즈니스 로직과 데이터 저장소를 분리합니다.
 * 임시 테이블에만 접근하도록 구현하여 기존 데이터베이스를 보호합니다.
 */

import { pool, TABLE_PREFIX } from './db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { log } from './vite';
import { 
  User, InsertUser, 
  Room, InsertRoom, 
  Patient, InsertPatient, 
  Guardian, InsertGuardian, 
  Accident, InsertAccident, 
  EnvLog, InsertEnvLog, 
  Camera, InsertCamera, 
  Message, InsertMessage,
  Event, InsertEvent,
  UserRole,
  RoomWithPatients,
  PatientWithDetails
} from '@shared/schema';

// 세션 스토어 대용 (메모리 스토어 사용, 실제 구현 시 redis 등으로 교체 권장)
import createMemoryStore from "memorystore";
import session from "express-session";
const MemoryStore = createMemoryStore(session);

/**
 * 저장소 인터페이스
 * 
 * 모든 데이터 접근 메서드를 정의하는 인터페이스입니다.
 * 이 인터페이스를 구현하는 구체적인 클래스는 다양한 저장 방식(메모리, 데이터베이스 등)을 제공합니다.
 */
export interface IStorage {
  /** 
   * 세션 저장소
   * 사용자 세션 정보를 저장하는 객체 
   */
  sessionStore: session.Store;
  
  /**
   * 사용자 관리 메서드
   */
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getUsersByRole(role?: UserRole): Promise<User[]>;
  
  /**
   * 병실 관리 메서드
   */
  getRooms(): Promise<Room[]>;
  getRoom(id: number): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
  updateRoom(id: number, roomData: Partial<Room>): Promise<Room | undefined>;
  deleteRoom(id: number): Promise<boolean>;
  getRoomWithPatients(id: number): Promise<RoomWithPatients | undefined>;
  getAllRoomsWithPatients(): Promise<RoomWithPatients[]>;
  
  /**
   * 환자 관리 메서드
   */
  getPatients(): Promise<Patient[]>;
  getPatient(id: number): Promise<Patient | undefined>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: number, patientData: Partial<Patient>): Promise<Patient | undefined>;
  deletePatient(id: number): Promise<boolean>;
  getPatientsByRoomId(roomId: number): Promise<Patient[]>;
  getPatientsByAssignedNurse(nurseId: number): Promise<Patient[]>;
  getPatientWithDetails(id: number): Promise<PatientWithDetails | undefined>;
  getPatientsWithDetails(): Promise<PatientWithDetails[]>;
  
  /**
   * 보호자 관리 메서드
   */
  getGuardians(): Promise<Guardian[]>;
  getGuardian(id: number): Promise<Guardian | undefined>;
  createGuardian(guardian: InsertGuardian): Promise<Guardian>;
  updateGuardian(id: number, guardianData: Partial<Guardian>): Promise<Guardian | undefined>;
  deleteGuardian(id: number): Promise<boolean>;
  getGuardianByPatientId(patientId: number): Promise<Guardian | undefined>;
  
  /**
   * 낙상 사고 관리 메서드
   */
  getAccidents(): Promise<Accident[]>;
  getAccident(id: number): Promise<Accident | undefined>;
  createAccident(accident: InsertAccident): Promise<Accident>;
  updateAccident(id: number, accidentData: Partial<Accident>): Promise<Accident | undefined>;
  getAccidentsByPatientId(patientId: number): Promise<Accident[]>;
  getAccidentsByRoomId(roomId: number): Promise<Accident[]>;
  getRecentAccidents(limit: number): Promise<Accident[]>;
  
  /**
   * 환경 로그 관리 메서드
   */
  getEnvLogs(): Promise<EnvLog[]>;
  createEnvLog(log: InsertEnvLog): Promise<EnvLog>;
  getEnvLogsByRoomId(roomId: number, limit?: number): Promise<EnvLog[]>;
  getLatestEnvLogByRoomId(roomId: number): Promise<EnvLog | undefined>;
  
  /**
   * 카메라 관리 메서드
   */
  getCameras(): Promise<Camera[]>;
  getCamera(id: number): Promise<Camera | undefined>;
  createCamera(camera: InsertCamera): Promise<Camera>;
  updateCamera(id: number, cameraData: Partial<Camera>): Promise<Camera | undefined>;
  deleteCamera(id: number): Promise<boolean>;
  getCamerasByRoomId(roomId: number): Promise<Camera[]>;
  
  /**
   * 메시지 관리 메서드
   */
  getMessages(): Promise<Message[]>;
  getMessage(id: number): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: number, messageData: Partial<Message>): Promise<Message | undefined>;
  getMessagesBetweenUsers(user1Id: number, user2Id: number, limit?: number): Promise<Message[]>;
  getUnreadMessageCountForUser(userId: number): Promise<number>;
  
  /**
   * 이벤트 관리 메서드
   */
  getEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, eventData: Partial<Event>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;
  getEventsByType(type: string): Promise<Event[]>;
  getEventsByStatus(status: string): Promise<Event[]>;
  getEventsByPatientId(patientId: number): Promise<Event[]>;
  getEventsByRoomId(roomId: number): Promise<Event[]>;
  getRecentEvents(limit: number): Promise<Event[]>;
}

/**
 * 데이터베이스 저장소 구현
 * MariaDB를 사용하여 데이터를 저장합니다.
 */
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    // 메모리 세션 스토어 초기화
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24시간마다 만료된 세션 정리
    });
  }
  
  // 데이터베이스에서 JSON 필드 변환 헬퍼 함수
  private parseJsonField<T>(obj: any, field: string): T | undefined {
    if (!obj || obj[field] === undefined || obj[field] === null) {
      return undefined;
    }
    
    try {
      if (typeof obj[field] === 'string') {
        return JSON.parse(obj[field]);
      }
      return obj[field];
    } catch (error) {
      log(`JSON 필드 파싱 오류 (${field}): ${error}`, 'storage');
      return undefined;
    }
  }
  
  /**
   * 사용자 관리 메서드 구현
   */
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM ${TABLE_PREFIX}users WHERE id = ?`,
        [id]
      );
      
      return rows.length > 0 ? rows[0] as User : undefined;
    } catch (error) {
      log(`사용자 조회 오류 (ID: ${id}): ${error}`, 'storage');
      return undefined;
    }
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM ${TABLE_PREFIX}users WHERE username = ?`,
        [username]
      );
      
      return rows.length > 0 ? rows[0] as User : undefined;
    } catch (error) {
      log(`사용자 조회 오류 (사용자명: ${username}): ${error}`, 'storage');
      return undefined;
    }
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM ${TABLE_PREFIX}users WHERE email = ?`,
        [email]
      );
      
      return rows.length > 0 ? rows[0] as User : undefined;
    } catch (error) {
      log(`사용자 조회 오류 (이메일: ${email}): ${error}`, 'storage');
      return undefined;
    }
  }
  
  async createUser(user: InsertUser): Promise<User> {
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO ${TABLE_PREFIX}users 
        (username, password, email, name, role, preferredLanguage) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          user.username,
          user.password,
          user.email,
          user.name,
          user.role,
          user.preferredLanguage || 'ko'
        ]
      );
      
      return {
        ...user,
        id: result.insertId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as User;
    } catch (error) {
      log(`사용자 생성 오류: ${error}`, 'storage');
      throw new Error(`사용자 생성 실패: ${error}`);
    }
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    try {
      // 업데이트할 필드 동적 구성
      const fields: string[] = [];
      const values: any[] = [];
      
      for (const [key, value] of Object.entries(userData)) {
        if (value !== undefined && key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }
      
      if (fields.length === 0) return await this.getUser(id);
      
      values.push(id);
      
      await pool.execute(
        `UPDATE ${TABLE_PREFIX}users SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      
      return await this.getUser(id);
    } catch (error) {
      log(`사용자 수정 오류 (ID: ${id}): ${error}`, 'storage');
      return undefined;
    }
  }
  
  async deleteUser(id: number): Promise<boolean> {
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        `DELETE FROM ${TABLE_PREFIX}users WHERE id = ?`,
        [id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      log(`사용자 삭제 오류 (ID: ${id}): ${error}`, 'storage');
      return false;
    }
  }
  
  async getUsersByRole(role?: UserRole): Promise<User[]> {
    try {
      if (role) {
        const [rows] = await pool.execute<RowDataPacket[]>(
          `SELECT * FROM ${TABLE_PREFIX}users WHERE role = ?`,
          [role]
        );
        
        return rows as User[];
      } else {
        const [rows] = await pool.execute<RowDataPacket[]>(
          `SELECT * FROM ${TABLE_PREFIX}users`
        );
        
        return rows as User[];
      }
    } catch (error) {
      log(`역할별 사용자 조회 오류: ${error}`, 'storage');
      return [];
    }
  }
  
  /**
   * 병실 관리 메서드 구현
   */
  async getRooms(): Promise<Room[]> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM ${TABLE_PREFIX}rooms`
      );
      
      return rows.map(row => ({
        ...row,
        settings: this.parseJsonField(row, 'settings')
      })) as Room[];
    } catch (error) {
      log(`병실 목록 조회 오류: ${error}`, 'storage');
      return [];
    }
  }
  
  async getRoom(id: number): Promise<Room | undefined> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM ${TABLE_PREFIX}rooms WHERE id = ?`,
        [id]
      );
      
      if (rows.length === 0) return undefined;
      
      const room = rows[0];
      return {
        ...room,
        settings: this.parseJsonField(room, 'settings')
      } as Room;
    } catch (error) {
      log(`병실 조회 오류 (ID: ${id}): ${error}`, 'storage');
      return undefined;
    }
  }
  
  async createRoom(room: InsertRoom): Promise<Room> {
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO ${TABLE_PREFIX}rooms 
        (name, floor, capacity, status, description, settings) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          room.name,
          room.floor,
          room.capacity || 1,
          room.status || 'ACTIVE',
          room.description || null,
          room.settings ? JSON.stringify(room.settings) : null
        ]
      );
      
      return {
        ...room,
        id: result.insertId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Room;
    } catch (error) {
      log(`병실 생성 오류: ${error}`, 'storage');
      throw new Error(`병실 생성 실패: ${error}`);
    }
  }
  
  async updateRoom(id: number, roomData: Partial<Room>): Promise<Room | undefined> {
    try {
      // 업데이트할 필드 동적 구성
      const fields: string[] = [];
      const values: any[] = [];
      
      for (const [key, value] of Object.entries(roomData)) {
        if (value !== undefined && key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
          fields.push(`${key} = ?`);
          
          // JSON 필드는 문자열로 저장
          if (key === 'settings' && value !== null) {
            values.push(JSON.stringify(value));
          } else {
            values.push(value);
          }
        }
      }
      
      if (fields.length === 0) return await this.getRoom(id);
      
      values.push(id);
      
      await pool.execute(
        `UPDATE ${TABLE_PREFIX}rooms SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      
      return await this.getRoom(id);
    } catch (error) {
      log(`병실 수정 오류 (ID: ${id}): ${error}`, 'storage');
      return undefined;
    }
  }
  
  async deleteRoom(id: number): Promise<boolean> {
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        `DELETE FROM ${TABLE_PREFIX}rooms WHERE id = ?`,
        [id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      log(`병실 삭제 오류 (ID: ${id}): ${error}`, 'storage');
      return false;
    }
  }
  
  async getRoomWithPatients(id: number): Promise<RoomWithPatients | undefined> {
    try {
      // 병실 정보 조회
      const room = await this.getRoom(id);
      if (!room) return undefined;
      
      // 해당 병실의 환자 목록 조회
      const patients = await this.getPatientsByRoomId(id);
      
      return {
        ...room,
        patients
      };
    } catch (error) {
      log(`환자 정보 포함 병실 조회 오류 (ID: ${id}): ${error}`, 'storage');
      return undefined;
    }
  }
  
  async getAllRoomsWithPatients(): Promise<RoomWithPatients[]> {
    try {
      // 모든 병실 조회
      const rooms = await this.getRooms();
      
      // 각 병실마다 환자 정보 추가
      const roomsWithPatients: RoomWithPatients[] = [];
      
      for (const room of rooms) {
        const patients = await this.getPatientsByRoomId(room.id);
        roomsWithPatients.push({
          ...room,
          patients
        });
      }
      
      return roomsWithPatients;
    } catch (error) {
      log(`환자 정보 포함 모든 병실 조회 오류: ${error}`, 'storage');
      return [];
    }
  }
  
  /**
   * 환자 관리 메서드 구현
   */
  async getPatients(): Promise<Patient[]> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM ${TABLE_PREFIX}patients`
      );
      
      return rows.map(row => ({
        ...row,
        vitalSigns: this.parseJsonField(row, 'vitalSigns'),
        medications: this.parseJsonField(row, 'medications')
      })) as Patient[];
    } catch (error) {
      log(`환자 목록 조회 오류: ${error}`, 'storage');
      return [];
    }
  }
  
  async getPatient(id: number): Promise<Patient | undefined> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM ${TABLE_PREFIX}patients WHERE id = ?`,
        [id]
      );
      
      if (rows.length === 0) return undefined;
      
      const patient = rows[0];
      return {
        ...patient,
        vitalSigns: this.parseJsonField(patient, 'vitalSigns'),
        medications: this.parseJsonField(patient, 'medications')
      } as Patient;
    } catch (error) {
      log(`환자 조회 오류 (ID: ${id}): ${error}`, 'storage');
      return undefined;
    }
  }
  
  async createPatient(patient: InsertPatient): Promise<Patient> {
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO ${TABLE_PREFIX}patients 
        (userId, roomId, assignedNurseId, admissionDate, dischargeDate, status, 
         medicalNotes, fallRiskLevel, vitalSigns, medications) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          patient.userId || null,
          patient.roomId || null,
          patient.assignedNurseId || null,
          patient.admissionDate || new Date().toISOString(),
          patient.dischargeDate || null,
          patient.status || 'ADMITTED',
          patient.medicalNotes || null,
          patient.fallRiskLevel || 1,
          patient.vitalSigns ? JSON.stringify(patient.vitalSigns) : null,
          patient.medications ? JSON.stringify(patient.medications) : null
        ]
      );
      
      return {
        ...patient,
        id: result.insertId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Patient;
    } catch (error) {
      log(`환자 생성 오류: ${error}`, 'storage');
      throw new Error(`환자 생성 실패: ${error}`);
    }
  }
  
  async updatePatient(id: number, patientData: Partial<Patient>): Promise<Patient | undefined> {
    try {
      // 업데이트할 필드 동적 구성
      const fields: string[] = [];
      const values: any[] = [];
      
      for (const [key, value] of Object.entries(patientData)) {
        if (value !== undefined && key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
          fields.push(`${key} = ?`);
          
          // JSON 필드는 문자열로 저장
          if ((key === 'vitalSigns' || key === 'medications') && value !== null) {
            values.push(JSON.stringify(value));
          } else {
            values.push(value);
          }
        }
      }
      
      if (fields.length === 0) return await this.getPatient(id);
      
      values.push(id);
      
      await pool.execute(
        `UPDATE ${TABLE_PREFIX}patients SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      
      return await this.getPatient(id);
    } catch (error) {
      log(`환자 수정 오류 (ID: ${id}): ${error}`, 'storage');
      return undefined;
    }
  }
  
  async deletePatient(id: number): Promise<boolean> {
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        `DELETE FROM ${TABLE_PREFIX}patients WHERE id = ?`,
        [id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      log(`환자 삭제 오류 (ID: ${id}): ${error}`, 'storage');
      return false;
    }
  }
  
  async getPatientsByRoomId(roomId: number): Promise<Patient[]> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM ${TABLE_PREFIX}patients WHERE roomId = ?`,
        [roomId]
      );
      
      return rows.map(row => ({
        ...row,
        vitalSigns: this.parseJsonField(row, 'vitalSigns'),
        medications: this.parseJsonField(row, 'medications')
      })) as Patient[];
    } catch (error) {
      log(`병실별 환자 목록 조회 오류 (병실 ID: ${roomId}): ${error}`, 'storage');
      return [];
    }
  }
  
  async getPatientsByAssignedNurse(nurseId: number): Promise<Patient[]> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM ${TABLE_PREFIX}patients WHERE assignedNurseId = ?`,
        [nurseId]
      );
      
      return rows.map(row => ({
        ...row,
        vitalSigns: this.parseJsonField(row, 'vitalSigns'),
        medications: this.parseJsonField(row, 'medications')
      })) as Patient[];
    } catch (error) {
      log(`간호사별 환자 목록 조회 오류 (간호사 ID: ${nurseId}): ${error}`, 'storage');
      return [];
    }
  }
  
  async getPatientWithDetails(id: number): Promise<PatientWithDetails | undefined> {
    try {
      const patient = await this.getPatient(id);
      if (!patient) return undefined;
      
      // 환자 계정 정보
      const user = patient.userId ? await this.getUser(patient.userId) : undefined;
      
      // 입원 중인 병실 정보
      const room = patient.roomId ? await this.getRoom(patient.roomId) : undefined;
      
      // 보호자 정보
      const guardian = await this.getGuardianByPatientId(id);
      
      // 담당 간호사 정보
      const assignedNurse = patient.assignedNurseId ? await this.getUser(patient.assignedNurseId) : undefined;
      
      if (!user || !room) {
        log(`환자 상세 정보 누락 (환자 ID: ${id})`, 'storage');
        return undefined;
      }
      
      return {
        ...patient,
        user,
        room,
        guardian,
        assignedNurse
      };
    } catch (error) {
      log(`환자 상세 정보 조회 오류 (ID: ${id}): ${error}`, 'storage');
      return undefined;
    }
  }
  
  async getPatientsWithDetails(): Promise<PatientWithDetails[]> {
    try {
      const patients = await this.getPatients();
      const patientsWithDetails: PatientWithDetails[] = [];
      
      for (const patient of patients) {
        const details = await this.getPatientWithDetails(patient.id);
        if (details) {
          patientsWithDetails.push(details);
        }
      }
      
      return patientsWithDetails;
    } catch (error) {
      log(`모든 환자 상세 정보 조회 오류: ${error}`, 'storage');
      return [];
    }
  }
  
  /**
   * 보호자 관리 메서드 구현
   */
  async getGuardians(): Promise<Guardian[]> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM ${TABLE_PREFIX}guardians`
      );
      
      return rows as Guardian[];
    } catch (error) {
      log(`보호자 목록 조회 오류: ${error}`, 'storage');
      return [];
    }
  }
  
  async getGuardian(id: number): Promise<Guardian | undefined> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM ${TABLE_PREFIX}guardians WHERE id = ?`,
        [id]
      );
      
      return rows.length > 0 ? rows[0] as Guardian : undefined;
    } catch (error) {
      log(`보호자 조회 오류 (ID: ${id}): ${error}`, 'storage');
      return undefined;
    }
  }
  
  async createGuardian(guardian: InsertGuardian): Promise<Guardian> {
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO ${TABLE_PREFIX}guardians 
        (userId, patientId, relationship, contactPhone, notificationEnabled) 
        VALUES (?, ?, ?, ?, ?)`,
        [
          guardian.userId || null,
          guardian.patientId,
          guardian.relationship || null,
          guardian.contactPhone || null,
          guardian.notificationEnabled !== undefined ? guardian.notificationEnabled : true
        ]
      );
      
      return {
        ...guardian,
        id: result.insertId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Guardian;
    } catch (error) {
      log(`보호자 생성 오류: ${error}`, 'storage');
      throw new Error(`보호자 생성 실패: ${error}`);
    }
  }
  
  async updateGuardian(id: number, guardianData: Partial<Guardian>): Promise<Guardian | undefined> {
    try {
      // 업데이트할 필드 동적 구성
      const fields: string[] = [];
      const values: any[] = [];
      
      for (const [key, value] of Object.entries(guardianData)) {
        if (value !== undefined && key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }
      
      if (fields.length === 0) return await this.getGuardian(id);
      
      values.push(id);
      
      await pool.execute(
        `UPDATE ${TABLE_PREFIX}guardians SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      
      return await this.getGuardian(id);
    } catch (error) {
      log(`보호자 수정 오류 (ID: ${id}): ${error}`, 'storage');
      return undefined;
    }
  }
  
  async deleteGuardian(id: number): Promise<boolean> {
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        `DELETE FROM ${TABLE_PREFIX}guardians WHERE id = ?`,
        [id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      log(`보호자 삭제 오류 (ID: ${id}): ${error}`, 'storage');
      return false;
    }
  }
  
  async getGuardianByPatientId(patientId: number): Promise<Guardian | undefined> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM ${TABLE_PREFIX}guardians WHERE patientId = ?`,
        [patientId]
      );
      
      return rows.length > 0 ? rows[0] as Guardian : undefined;
    } catch (error) {
      log(`환자별 보호자 조회 오류 (환자 ID: ${patientId}): ${error}`, 'storage');
      return undefined;
    }
  }
  
  /**
   * 낙상 사고 관리 메서드 구현
   */
  async getAccidents(): Promise<Accident[]> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM ${TABLE_PREFIX}accidents`
      );
      
      return rows.map(row => ({
        ...row,
        notifiedStaff: this.parseJsonField(row, 'notifiedStaff')
      })) as Accident[];
    } catch (error) {
      log(`낙상 사고 목록 조회 오류: ${error}`, 'storage');
      return [];
    }
  }
  
  async getAccident(id: number): Promise<Accident | undefined> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM ${TABLE_PREFIX}accidents WHERE id = ?`,
        [id]
      );
      
      if (rows.length === 0) return undefined;
      
      const accident = rows[0];
      return {
        ...accident,
        notifiedStaff: this.parseJsonField(accident, 'notifiedStaff')
      } as Accident;
    } catch (error) {
      log(`낙상 사고 조회 오류 (ID: ${id}): ${error}`, 'storage');
      return undefined;
    }
  }
  
  async createAccident(accident: InsertAccident): Promise<Accident> {
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO ${TABLE_PREFIX}accidents 
        (patientId, roomId, timestamp, severity, description, status, videoClipUrl, notifiedStaff) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          accident.patientId,
          accident.roomId,
          accident.timestamp || new Date().toISOString(),
          accident.severity || 1,
          accident.description || null,
          accident.status || 'UNRESOLVED',
          accident.videoClipUrl || null,
          accident.notifiedStaff ? JSON.stringify(accident.notifiedStaff) : null
        ]
      );
      
      return {
        ...accident,
        id: result.insertId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Accident;
    } catch (error) {
      log(`낙상 사고 생성 오류: ${error}`, 'storage');
      throw new Error(`낙상 사고 생성 실패: ${error}`);
    }
  }
  
  async updateAccident(id: number, accidentData: Partial<Accident>): Promise<Accident | undefined> {
    try {
      // 업데이트할 필드 동적 구성
      const fields: string[] = [];
      const values: any[] = [];
      
      for (const [key, value] of Object.entries(accidentData)) {
        if (value !== undefined && key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
          fields.push(`${key} = ?`);
          
          // JSON 필드는 문자열로 저장
          if (key === 'notifiedStaff' && value !== null) {
            values.push(JSON.stringify(value));
          } else {
            values.push(value);
          }
        }
      }
      
      if (fields.length === 0) return await this.getAccident(id);
      
      values.push(id);
      
      await pool.execute(
        `UPDATE ${TABLE_PREFIX}accidents SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      
      return await this.getAccident(id);
    } catch (error) {
      log(`낙상 사고 수정 오류 (ID: ${id}): ${error}`, 'storage');
      return undefined;
    }
  }
  
  async getAccidentsByPatientId(patientId: number): Promise<Accident[]> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM ${TABLE_PREFIX}accidents WHERE patientId = ? ORDER BY timestamp DESC`,
        [patientId]
      );
      
      return rows.map(row => ({
        ...row,
        notifiedStaff: this.parseJsonField(row, 'notifiedStaff')
      })) as Accident[];
    } catch (error) {
      log(`환자별 낙상 사고 목록 조회 오류 (환자 ID: ${patientId}): ${error}`, 'storage');
      return [];
    }
  }
  
  async getAccidentsByRoomId(roomId: number): Promise<Accident[]> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM ${TABLE_PREFIX}accidents WHERE roomId = ? ORDER BY timestamp DESC`,
        [roomId]
      );
      
      return rows.map(row => ({
        ...row,
        notifiedStaff: this.parseJsonField(row, 'notifiedStaff')
      })) as Accident[];
    } catch (error) {
      log(`병실별 낙상 사고 목록 조회 오류 (병실 ID: ${roomId}): ${error}`, 'storage');
      return [];
    }
  }
  
  async getRecentAccidents(limit: number): Promise<Accident[]> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM ${TABLE_PREFIX}accidents ORDER BY timestamp DESC LIMIT ?`,
        [limit]
      );
      
      return rows.map(row => ({
        ...row,
        notifiedStaff: this.parseJsonField(row, 'notifiedStaff')
      })) as Accident[];
    } catch (error) {
      log(`최근 낙상 사고 목록 조회 오류: ${error}`, 'storage');
      return [];
    }
  }
  
  /**
   * 환경 로그 관리 메서드 구현
   */
  async getEnvLogs(): Promise<EnvLog[]> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM ${TABLE_PREFIX}env_logs ORDER BY timestamp DESC`
      );
      
      return rows as EnvLog[];
    } catch (error) {
      log(`환경 로그 목록 조회 오류: ${error}`, 'storage');
      return [];
    }
  }
  
  async createEnvLog(envLog: InsertEnvLog): Promise<EnvLog> {
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO ${TABLE_PREFIX}env_logs 
        (roomId, temperature, humidity, light, noise, motion, timestamp) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          envLog.roomId,
          envLog.temperature || null,
          envLog.humidity || null,
          envLog.light || null,
          envLog.noise || null,
          envLog.motion !== undefined ? envLog.motion : false,
          envLog.timestamp || new Date().toISOString()
        ]
      );
      
      return {
        ...envLog,
        id: result.insertId,
        createdAt: new Date().toISOString()
      } as EnvLog;
    } catch (error) {
      log(`환경 로그 생성 오류: ${error}`, 'storage');
      throw new Error(`환경 로그 생성 실패: ${error}`);
    }
  }
  
  async getEnvLogsByRoomId(roomId: number, limit?: number): Promise<EnvLog[]> {
    try {
      if (limit) {
        const [rows] = await pool.execute<RowDataPacket[]>(
          `SELECT * FROM ${TABLE_PREFIX}env_logs WHERE roomId = ? ORDER BY timestamp DESC LIMIT ?`,
          [roomId, limit]
        );
        
        return rows as EnvLog[];
      } else {
        const [rows] = await pool.execute<RowDataPacket[]>(
          `SELECT * FROM ${TABLE_PREFIX}env_logs WHERE roomId = ? ORDER BY timestamp DESC`,
          [roomId]
        );
        
        return rows as EnvLog[];
      }
    } catch (error) {
      log(`병실별 환경 로그 목록 조회 오류 (병실 ID: ${roomId}): ${error}`, 'storage');
      return [];
    }
  }
  
  async getLatestEnvLogByRoomId(roomId: number): Promise<EnvLog | undefined> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM ${TABLE_PREFIX}env_logs WHERE roomId = ? ORDER BY timestamp DESC LIMIT 1`,
        [roomId]
      );
      
      return rows.length > 0 ? rows[0] as EnvLog : undefined;
    } catch (error) {
      log(`병실별 최신 환경 로그 조회 오류 (병실 ID: ${roomId}): ${error}`, 'storage');
      return undefined;
    }
  }
  
  /**
   * 카메라 관리 메서드 구현
   */
  async getCameras(): Promise<Camera[]> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM ${TABLE_PREFIX}cameras`
      );
      
      return rows.map(row => ({
        ...row,
        config: this.parseJsonField(row, 'config')
      })) as Camera[];
    } catch (error) {
      log(`카메라 목록 조회 오류: ${error}`, 'storage');
      return [];
    }
  }
  
  async getCamera(id: number): Promise<Camera | undefined> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM ${TABLE_PREFIX}cameras WHERE id = ?`,
        [id]
      );
      
      if (rows.length === 0) return undefined;
      
      const camera = rows[0];
      return {
        ...camera,
        config: this.parseJsonField(camera, 'config')
      } as Camera;
    } catch (error) {
      log(`카메라 조회 오류 (ID: ${id}): ${error}`, 'storage');
      return undefined;
    }
  }
  
  async createCamera(camera: InsertCamera): Promise<Camera> {
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO ${TABLE_PREFIX}cameras 
        (roomId, name, streamUrl, status, config) 
        VALUES (?, ?, ?, ?, ?)`,
        [
          camera.roomId,
          camera.name || null,
          camera.streamUrl || null,
          camera.status || 'ACTIVE',
          camera.config ? JSON.stringify(camera.config) : null
        ]
      );
      
      return {
        ...camera,
        id: result.insertId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Camera;
    } catch (error) {
      log(`카메라 생성 오류: ${error}`, 'storage');
      throw new Error(`카메라 생성 실패: ${error}`);
    }
  }
  
  async updateCamera(id: number, cameraData: Partial<Camera>): Promise<Camera | undefined> {
    try {
      // 업데이트할 필드 동적 구성
      const fields: string[] = [];
      const values: any[] = [];
      
      for (const [key, value] of Object.entries(cameraData)) {
        if (value !== undefined && key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
          fields.push(`${key} = ?`);
          
          // JSON 필드는 문자열로 저장
          if (key === 'config' && value !== null) {
            values.push(JSON.stringify(value));
          } else {
            values.push(value);
          }
        }
      }
      
      if (fields.length === 0) return await this.getCamera(id);
      
      values.push(id);
      
      await pool.execute(
        `UPDATE ${TABLE_PREFIX}cameras SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      
      return await this.getCamera(id);
    } catch (error) {
      log(`카메라 수정 오류 (ID: ${id}): ${error}`, 'storage');
      return undefined;
    }
  }
  
  async deleteCamera(id: number): Promise<boolean> {
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        `DELETE FROM ${TABLE_PREFIX}cameras WHERE id = ?`,
        [id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      log(`카메라 삭제 오류 (ID: ${id}): ${error}`, 'storage');
      return false;
    }
  }
  
  async getCamerasByRoomId(roomId: number): Promise<Camera[]> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM ${TABLE_PREFIX}cameras WHERE roomId = ?`,
        [roomId]
      );
      
      return rows.map(row => ({
        ...row,
        config: this.parseJsonField(row, 'config')
      })) as Camera[];
    } catch (error) {
      log(`병실별 카메라 목록 조회 오류 (병실 ID: ${roomId}): ${error}`, 'storage');
      return [];
    }
  }
  
  /**
   * 메시지 관리 메서드 구현
   */
  async getMessages(): Promise<Message[]> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM ${TABLE_PREFIX}messages ORDER BY createdAt DESC`
      );
      
      return rows as Message[];
    } catch (error) {
      log(`메시지 목록 조회 오류: ${error}`, 'storage');
      return [];
    }
  }
  
  async getMessage(id: number): Promise<Message | undefined> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM ${TABLE_PREFIX}messages WHERE id = ?`,
        [id]
      );
      
      return rows.length > 0 ? rows[0] as Message : undefined;
    } catch (error) {
      log(`메시지 조회 오류 (ID: ${id}): ${error}`, 'storage');
      return undefined;
    }
  }
  
  async createMessage(message: InsertMessage): Promise<Message> {
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO ${TABLE_PREFIX}messages 
        (senderId, receiverId, content, readAt) 
        VALUES (?, ?, ?, ?)`,
        [
          message.senderId,
          message.receiverId,
          message.content,
          message.readAt || null
        ]
      );
      
      return {
        ...message,
        id: result.insertId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Message;
    } catch (error) {
      log(`메시지 생성 오류: ${error}`, 'storage');
      throw new Error(`메시지 생성 실패: ${error}`);
    }
  }
  
  async updateMessage(id: number, messageData: Partial<Message>): Promise<Message | undefined> {
    try {
      // 업데이트할 필드 동적 구성
      const fields: string[] = [];
      const values: any[] = [];
      
      for (const [key, value] of Object.entries(messageData)) {
        if (value !== undefined && key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }
      
      if (fields.length === 0) return await this.getMessage(id);
      
      values.push(id);
      
      await pool.execute(
        `UPDATE ${TABLE_PREFIX}messages SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      
      return await this.getMessage(id);
    } catch (error) {
      log(`메시지 수정 오류 (ID: ${id}): ${error}`, 'storage');
      return undefined;
    }
  }
  
  async getMessagesBetweenUsers(user1Id: number, user2Id: number, limit?: number): Promise<Message[]> {
    try {
      let query = `
        SELECT * FROM ${TABLE_PREFIX}messages 
        WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?) 
        ORDER BY createdAt DESC
      `;
      
      const params = [user1Id, user2Id, user2Id, user1Id];
      
      if (limit) {
        query += ' LIMIT ?';
        params.push(limit);
      }
      
      const [rows] = await pool.execute<RowDataPacket[]>(query, params);
      
      return rows as Message[];
    } catch (error) {
      log(`두 사용자 간 메시지 목록 조회 오류 (사용자 ID: ${user1Id}, ${user2Id}): ${error}`, 'storage');
      return [];
    }
  }
  
  async getUnreadMessageCountForUser(userId: number): Promise<number> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT COUNT(*) as count FROM ${TABLE_PREFIX}messages 
         WHERE receiverId = ? AND readAt IS NULL`,
        [userId]
      );
      
      return rows[0].count as number;
    } catch (error) {
      log(`안 읽은 메시지 수 조회 오류 (사용자 ID: ${userId}): ${error}`, 'storage');
      return 0;
    }
  }
}

// 저장소 인스턴스 생성
export const storage = new DatabaseStorage();