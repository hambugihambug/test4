/**
 * 데이터 저장소 모듈
 * 
 * 데이터베이스 접근 계층을 추상화하여 애플리케이션 비즈니스 로직과 데이터 저장소를 분리합니다.
 * 이 파일은 데이터 접근을 위한 인터페이스만 정의하며, 실제 구현은 사용자가 직접 수행합니다.
 */

import { 
  User, Room, Patient, Guardian, Accident, EnvLog, Camera, Message,
  InsertUser, InsertRoom, InsertPatient, InsertGuardian, InsertAccident, InsertEnvLog, InsertCamera, InsertMessage,
  UserRole, RoomWithPatients, PatientWithDetails
} from "@shared/schema";

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
  getUsersByRole(role?: UserRole): Promise<User[]>;                        // 역할별 사용자 목록 조회
  
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

// 메모리 스토어 기본 객체
class EmptyStorage implements IStorage {
  sessionStore = null;
  
  getUser = async () => undefined;
  getUserByUsername = async () => undefined;
  getUserByEmail = async () => undefined;
  createUser = async () => { throw new Error("구현이 필요한 메서드입니다."); };
  updateUser = async () => undefined;
  deleteUser = async () => false;
  getUsersByRole = async () => [];
  
  getRooms = async () => [];
  getRoom = async () => undefined;
  createRoom = async () => { throw new Error("구현이 필요한 메서드입니다."); };
  updateRoom = async () => undefined;
  deleteRoom = async () => false;
  getRoomWithPatients = async () => undefined;
  getAllRoomsWithPatients = async () => [];
  
  getPatients = async () => [];
  getPatient = async () => undefined;
  createPatient = async () => { throw new Error("구현이 필요한 메서드입니다."); };
  updatePatient = async () => undefined;
  deletePatient = async () => false;
  getPatientsByRoomId = async () => [];
  getPatientsByAssignedNurse = async () => [];
  getPatientWithDetails = async () => undefined;
  getPatientsWithDetails = async () => [];
  
  getGuardians = async () => [];
  getGuardian = async () => undefined;
  createGuardian = async () => { throw new Error("구현이 필요한 메서드입니다."); };
  updateGuardian = async () => undefined;
  deleteGuardian = async () => false;
  getGuardianByPatientId = async () => undefined;
  
  getAccidents = async () => [];
  getAccident = async () => undefined;
  createAccident = async () => { throw new Error("구현이 필요한 메서드입니다."); };
  updateAccident = async () => undefined;
  getAccidentsByPatientId = async () => [];
  getAccidentsByRoomId = async () => [];
  getRecentAccidents = async () => [];
  
  getEnvLogs = async () => [];
  createEnvLog = async () => { throw new Error("구현이 필요한 메서드입니다."); };
  getEnvLogsByRoomId = async () => [];
  getLatestEnvLogByRoomId = async () => undefined;
  
  getCameras = async () => [];
  getCamera = async () => undefined;
  createCamera = async () => { throw new Error("구현이 필요한 메서드입니다."); };
  updateCamera = async () => undefined;
  deleteCamera = async () => false;
  getCamerasByRoomId = async () => [];
  
  getMessages = async () => [];
  getMessage = async () => undefined;
  createMessage = async () => { throw new Error("구현이 필요한 메서드입니다."); };
  updateMessage = async () => undefined;
  getMessagesBetweenUsers = async () => [];
  getUnreadMessageCountForUser = async () => 0;
}

// 빈 저장소 객체 생성
export const storage = new EmptyStorage();