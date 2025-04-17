import { pgTable, text, serial, integer, boolean, doublePrecision, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * 사용자 역할(권한) 상수 정의
 * 시스템에서 사용하는 4가지 역할을 정의함
 */
export const UserRole = {
  DIRECTOR: "director",   // 병원장/총관리자: 모든 환자 및 사용자 관리 권한
  NURSE: "nurse",         // 간호사/관리자: 담당 환자 관리 권한
  PATIENT: "patient",     // 환자: 자신의 정보만 볼 수 있는 권한
  GUARDIAN: "guardian",   // 보호자: 특정 환자의 정보만 볼 수 있는 권한
} as const;

// UserRole 타입 정의 (TypeScript의 타입 안전성을 위함)
export type UserRole = typeof UserRole[keyof typeof UserRole];

/**
 * 사용자 테이블 정의
 * 모든 시스템 사용자(병원장, 간호사, 환자, 보호자)의 정보를 저장
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),                        // 고유 식별자 (자동 증가)
  username: text("username").notNull().unique(),        // 로그인 아이디 (중복 불가)
  email: text("email").notNull().unique(),              // 이메일 (중복 불가)
  password: text("password").notNull(),                 // 비밀번호 (해시된 값 저장)
  name: text("name").notNull(),                         // 실명
  phoneNumber: text("phone_number"),                    // 전화번호 (선택적)
  role: text("role").$type<UserRole>().notNull(),       // 사용자 역할
  fcmToken: text("fcm_token"),                          // FCM 푸시 알림 토큰 (선택적)
  preferredLanguage: text("preferred_language").default("ko"), // 선호 언어 (기본값: 한국어)
  createdAt: timestamp("created_at").defaultNow(),      // 계정 생성 시간 (자동 생성)
});

/**
 * 병실 테이블 정의
 * 병원 내 모든 병실의 정보와 환경 설정을 저장
 */
export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),                                // 고유 식별자
  name: text("name").notNull(),                                 // 병실 이름 (예: "301호")
  tempThreshold: doublePrecision("temp_threshold").default(26.0), // 온도 임계값 (기본: 26도)
  humidityThreshold: doublePrecision("humidity_threshold").default(60.0), // 습도 임계값 (기본: 60%)
  layout: text("layout"),                                       // 병실 레이아웃 정보 (JSON 형태로 저장)
  currentTemp: doublePrecision("current_temp"),                 // 현재 온도
  currentHumidity: doublePrecision("current_humidity"),         // 현재 습도
  status: text("status").default("normal"),                     // 병실 상태 (normal, warning, danger)
});

/**
 * 환자 테이블 정의
 * 병원에 입원한 모든 환자의 정보를 저장
 */
export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),                          // 고유 식별자
  userId: integer("user_id").references(() => users.id),  // 환자의 사용자 계정 ID (없을 수도 있음)
  name: text("name").notNull(),                           // 환자 이름
  age: integer("age").notNull(),                          // 환자 나이
  height: doublePrecision("height"),                      // 키 (cm)
  weight: doublePrecision("weight"),                      // 몸무게 (kg)
  blood: text("blood"),                                   // 혈액형 (예: "A+")
  roomId: integer("room_id").references(() => rooms.id),  // 입원 중인 병실 ID
  bedNumber: integer("bed_number"),                       // 병실 내 침대 번호
  fallRisk: text("fall_risk").default("low"),             // 낙상 위험도 (low, medium, high)
  assignedNurseId: integer("assigned_nurse_id").references(() => users.id), // 담당 간호사 ID
});

/**
 * 보호자 테이블 정의
 * 환자의 보호자 정보를 저장
 */
export const guardians = pgTable("guardians", {
  id: serial("id").primaryKey(),                           // 고유 식별자
  userId: integer("user_id").references(() => users.id),   // 보호자의 사용자 계정 ID (없을 수도 있음)
  patientId: integer("patient_id").references(() => patients.id), // 담당하는 환자 ID
  name: text("name").notNull(),                            // 보호자 이름
  tel: text("tel").notNull(),                              // 보호자 연락처
});

/**
 * 낙상 사고 테이블 정의
 * 모든 낙상 사고 기록을 저장
 */
export const accidents = pgTable("accidents", {
  id: serial("id").primaryKey(),                           // 고유 식별자
  patientId: integer("patient_id").references(() => patients.id), // 사고 발생 환자 ID
  roomId: integer("room_id").references(() => rooms.id),   // 사고 발생 병실 ID
  date: timestamp("date").defaultNow(),                    // 사고 발생 시간
  notified: boolean("notified").default(false),            // 보호자 통보 여부
  resolved: boolean("resolved").default(false),            // 사고 처리 완료 여부
  resolvedBy: integer("resolved_by").references(() => users.id), // 사고 처리한 담당자 ID
});

/**
 * 환경 로그 테이블 정의
 * 병실 환경(온도, 습도 등) 측정 데이터를 저장
 */
export const envLogs = pgTable("env_logs", {
  id: serial("id").primaryKey(),                           // 고유 식별자
  roomId: integer("room_id").references(() => rooms.id),   // 측정된 병실 ID
  temperature: doublePrecision("temperature"),             // 측정된 온도
  humidity: doublePrecision("humidity"),                   // 측정된 습도
  timestamp: timestamp("timestamp").defaultNow(),          // 측정 시간
  alert: boolean("alert").default(false),                  // 환경 이상 경고 여부
});

/**
 * CCTV 카메라 테이블 정의
 * 병실 내 설치된 CCTV 카메라 정보 저장
 */
export const cameras = pgTable("cameras", {
  id: serial("id").primaryKey(),                          // 고유 식별자
  roomId: integer("room_id").references(() => rooms.id),  // 설치된 병실 ID
  name: text("name").notNull(),                           // 카메라 이름
  streamUrl: text("stream_url"),                          // 스트리밍 URL
  active: boolean("active").default(true),                // 카메라 활성화 상태
});

/**
 * 메시지 테이블 정의
 * 사용자 간 주고받은 메시지를 저장 (주로 간호사와 보호자 간 소통)
 */
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),                              // 고유 식별자
  senderId: integer("sender_id").references(() => users.id),  // 발신자 ID
  receiverId: integer("receiver_id").references(() => users.id), // 수신자 ID
  message: text("message").notNull(),                         // 메시지 내용
  timestamp: timestamp("timestamp").defaultNow(),             // 전송 시간
  read: boolean("read").default(false),                       // 읽음 여부
});

/**
 * Zod 스키마 정의 (데이터 유효성 검증용)
 * 각 테이블에 대한 입력 스키마를 정의하여 API 요청 데이터 검증에 사용
 */

// 사용자 생성 시 사용할 스키마 (자동 생성 필드 제외)
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true,           // 자동 생성되는 ID 필드 제외
  fcmToken: true,     // FCM 토큰은 별도 등록 과정에서 설정
  createdAt: true     // 생성 시간은 자동 설정
});

// 병실 생성 시 사용할 스키마
export const insertRoomSchema = createInsertSchema(rooms).omit({ 
  id: true,            // 자동 생성되는 ID 필드 제외
  currentTemp: true,   // 현재 온도는 센서에서 자동 업데이트
  currentHumidity: true, // 현재 습도는 센서에서 자동 업데이트
  status: true         // 상태는 시스템에서 자동 관리
});

// 환자 생성 시 사용할 스키마
export const insertPatientSchema = createInsertSchema(patients).omit({ 
  id: true // 자동 생성되는 ID 필드 제외
});

// 보호자 생성 시 사용할 스키마
export const insertGuardianSchema = createInsertSchema(guardians).omit({ 
  id: true // 자동 생성되는 ID 필드 제외
});

// 낙상 사고 기록 생성 시 사용할 스키마
export const insertAccidentSchema = createInsertSchema(accidents).omit({ 
  id: true,        // 자동 생성되는 ID 필드 제외
  date: true,      // 일시는 기본값 사용
  notified: true,  // 통보 여부는 시스템에서 관리
  resolved: true,  // 처리 여부는 시스템에서 관리
  resolvedBy: true // 처리자는 나중에 설정
});

// 환경 로그 생성 시 사용할 스키마
export const insertEnvLogSchema = createInsertSchema(envLogs).omit({ 
  id: true,        // 자동 생성되는 ID 필드 제외
  timestamp: true, // 측정 시간은 기본값 사용
  alert: true      // 경고 여부는 시스템에서 자동 계산
});

// 카메라 생성 시 사용할 스키마
export const insertCameraSchema = createInsertSchema(cameras).omit({ 
  id: true,     // 자동 생성되는 ID 필드 제외
  active: true  // 활성화 상태는 기본값 사용
});

// 메시지 생성 시 사용할 스키마
export const insertMessageSchema = createInsertSchema(messages).omit({ 
  id: true,        // 자동 생성되는 ID 필드 제외
  timestamp: true, // 전송 시간은 기본값 사용
  read: true       // 읽음 여부는 기본값(읽지 않음) 사용
});

/**
 * 타입 정의 (TypeScript 타입 안전성)
 * DB 테이블과 일치하는 타입 정의를 통해 코드의 안전성 보장
 */

// 데이터 생성(INSERT) 시 사용할 타입 정의
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type InsertGuardian = z.infer<typeof insertGuardianSchema>;
export type InsertAccident = z.infer<typeof insertAccidentSchema>;
export type InsertEnvLog = z.infer<typeof insertEnvLogSchema>;
export type InsertCamera = z.infer<typeof insertCameraSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// 데이터 조회(SELECT) 시 사용할 타입 정의
export type User = typeof users.$inferSelect;
export type Room = typeof rooms.$inferSelect;
export type Patient = typeof patients.$inferSelect;
export type Guardian = typeof guardians.$inferSelect;
export type Accident = typeof accidents.$inferSelect;
export type EnvLog = typeof envLogs.$inferSelect;
export type Camera = typeof cameras.$inferSelect;
export type Message = typeof messages.$inferSelect;

/**
 * 확장된 타입 정의 (관계 처리)
 * 연관 테이블의 데이터를 포함한 확장 타입으로, 프론트엔드에 필요한 정보를 표현
 */

// 병실 + 환자 목록 합친 타입 (병실 정보와 그 안의 환자들 함께 조회 시 사용)
export type RoomWithPatients = Room & {
  patients: Patient[];  // 해당 병실에 있는 환자 목록
};

// 환자 + 상세 정보 합친 타입 (환자 상세 정보 조회 시 사용)
export type PatientWithDetails = Patient & {
  user: User;            // 환자 계정 정보
  room: Room;            // 입원 중인 병실 정보
  guardian?: Guardian;   // 보호자 정보 (없을 수도 있음)
  assignedNurse?: User;  // 담당 간호사 정보 (없을 수도 있음)
};
