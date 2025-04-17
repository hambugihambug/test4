/**
 * 데이터베이스 연결 모듈
 * 
 * MariaDB 연결을 설정하고 관리합니다.
 * 임시 테이블 스키마를 포함하여 다른 테이블을 건드리지 않도록 설계되었습니다.
 */

import mysql from 'mysql2/promise';
import { log } from './vite';

// 임시 테이블 프리픽스 (다른 테이블과 충돌 방지)
export const TABLE_PREFIX = 'temp_202506_cu_';

// 데이터베이스 연결 설정
const DB_CONFIG = {
  host: '203.231.146.220',
  port: 3306,
  user: '202506_cu',
  password: '202506_cu',
  database: '202506_cu',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// 데이터베이스 연결 풀 생성
export const pool = mysql.createPool(DB_CONFIG);

/**
 * 데이터베이스 연결 테스트 함수
 * 연결이 성공적으로 설정되었는지 확인합니다.
 */
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    log('데이터베이스 연결 성공', 'db');
    connection.release();
    return true;
  } catch (error) {
    log(`데이터베이스 연결 실패: ${error}`, 'db');
    return false;
  }
}

/**
 * 임시 테이블 존재 여부 확인 함수
 * @param tableName 테이블 이름 (프리픽스 제외)
 * @returns 테이블 존재 여부
 */
export async function tableExists(tableName: string): Promise<boolean> {
  const fullTableName = `${TABLE_PREFIX}${tableName}`;
  try {
    // 보다 안전한 방식으로 테이블 존재 여부 확인
    const [rows] = await pool.execute(
      `SELECT COUNT(*) as count 
       FROM information_schema.tables 
       WHERE table_schema = ? AND table_name = ?`,
      [DB_CONFIG.database, fullTableName]
    );
    
    const result = rows as Array<{ count: number }>;
    return result[0].count > 0;
  } catch (error) {
    log(`테이블 존재 여부 확인 실패: ${error}`, 'db');
    return false;
  }
}

/**
 * 안전한 테이블 생성 확인 함수
 * 기존 DB를 보호하기 위해 해당 접두사의 테이블만 확인/수정합니다.
 */
export async function checkTemporaryTablesOnly(): Promise<boolean> {
  try {
    // information_schema에서 해당 접두사로 시작하는 테이블만 가져옴
    const [rows] = await pool.execute(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = ? AND table_name LIKE ?`,
      [DB_CONFIG.database, `${TABLE_PREFIX}%`]
    );
    
    log(`임시 테이블 확인: ${JSON.stringify(rows)}`, 'db');
    return true;
  } catch (error) {
    log(`임시 테이블 확인 실패: ${error}`, 'db');
    return false;
  }
}

/**
 * 임시 테이블 초기화 함수
 * 모든 임시 테이블을 생성합니다.
 */
export async function initializeTables() {
  try {
    // 사용자 테이블 생성
    if (!(await tableExists('users'))) {
      await pool.execute(`
        CREATE TABLE ${TABLE_PREFIX}users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(50) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          email VARCHAR(100) NOT NULL UNIQUE,
          name VARCHAR(100) NOT NULL,
          role ENUM('DIRECTOR', 'NURSE', 'PATIENT', 'GUARDIAN') NOT NULL,
          preferredLanguage VARCHAR(10) DEFAULT 'ko',
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      log(`${TABLE_PREFIX}users 테이블 생성 완료`, 'db');
    }

    // 병실 테이블 생성
    if (!(await tableExists('rooms'))) {
      await pool.execute(`
        CREATE TABLE ${TABLE_PREFIX}rooms (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(50) NOT NULL,
          floor INT NOT NULL,
          capacity INT NOT NULL DEFAULT 1,
          status VARCHAR(50) DEFAULT 'ACTIVE',
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          description TEXT,
          settings JSON
        )
      `);
      log(`${TABLE_PREFIX}rooms 테이블 생성 완료`, 'db');
    }

    // 환자 테이블 생성
    if (!(await tableExists('patients'))) {
      await pool.execute(`
        CREATE TABLE ${TABLE_PREFIX}patients (
          id INT AUTO_INCREMENT PRIMARY KEY,
          userId INT,
          roomId INT,
          assignedNurseId INT,
          admissionDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          dischargeDate TIMESTAMP NULL DEFAULT NULL,
          status VARCHAR(50) DEFAULT 'ADMITTED',
          medicalNotes TEXT,
          fallRiskLevel INT DEFAULT 1,
          vitalSigns JSON,
          medications JSON,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (userId) REFERENCES ${TABLE_PREFIX}users(id) ON DELETE SET NULL,
          FOREIGN KEY (roomId) REFERENCES ${TABLE_PREFIX}rooms(id) ON DELETE SET NULL,
          FOREIGN KEY (assignedNurseId) REFERENCES ${TABLE_PREFIX}users(id) ON DELETE SET NULL
        )
      `);
      log(`${TABLE_PREFIX}patients 테이블 생성 완료`, 'db');
    }

    // 보호자 테이블 생성
    if (!(await tableExists('guardians'))) {
      await pool.execute(`
        CREATE TABLE ${TABLE_PREFIX}guardians (
          id INT AUTO_INCREMENT PRIMARY KEY,
          userId INT,
          patientId INT,
          relationship VARCHAR(50),
          contactPhone VARCHAR(20),
          notificationEnabled BOOLEAN DEFAULT TRUE,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (userId) REFERENCES ${TABLE_PREFIX}users(id) ON DELETE SET NULL,
          FOREIGN KEY (patientId) REFERENCES ${TABLE_PREFIX}patients(id) ON DELETE SET NULL
        )
      `);
      log(`${TABLE_PREFIX}guardians 테이블 생성 완료`, 'db');
    }

    // 낙상 사고 테이블 생성
    if (!(await tableExists('accidents'))) {
      await pool.execute(`
        CREATE TABLE ${TABLE_PREFIX}accidents (
          id INT AUTO_INCREMENT PRIMARY KEY,
          patientId INT,
          roomId INT,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          severity INT DEFAULT 1,
          description TEXT,
          status VARCHAR(50) DEFAULT 'UNRESOLVED',
          videoClipUrl VARCHAR(255),
          notifiedStaff JSON,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (patientId) REFERENCES ${TABLE_PREFIX}patients(id) ON DELETE SET NULL,
          FOREIGN KEY (roomId) REFERENCES ${TABLE_PREFIX}rooms(id) ON DELETE SET NULL
        )
      `);
      log(`${TABLE_PREFIX}accidents 테이블 생성 완료`, 'db');
    }

    // 환경 로그 테이블 생성
    if (!(await tableExists('env_logs'))) {
      await pool.execute(`
        CREATE TABLE ${TABLE_PREFIX}env_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          roomId INT,
          temperature FLOAT,
          humidity FLOAT,
          light FLOAT,
          noise FLOAT,
          motion BOOLEAN,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (roomId) REFERENCES ${TABLE_PREFIX}rooms(id) ON DELETE SET NULL
        )
      `);
      log(`${TABLE_PREFIX}env_logs 테이블 생성 완료`, 'db');
    }

    // CCTV 카메라 테이블 생성
    if (!(await tableExists('cameras'))) {
      await pool.execute(`
        CREATE TABLE ${TABLE_PREFIX}cameras (
          id INT AUTO_INCREMENT PRIMARY KEY,
          roomId INT,
          name VARCHAR(100),
          streamUrl VARCHAR(255),
          status VARCHAR(50) DEFAULT 'ACTIVE',
          config JSON,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (roomId) REFERENCES ${TABLE_PREFIX}rooms(id) ON DELETE SET NULL
        )
      `);
      log(`${TABLE_PREFIX}cameras 테이블 생성 완료`, 'db');
    }

    // 메시지 테이블 생성
    if (!(await tableExists('messages'))) {
      await pool.execute(`
        CREATE TABLE ${TABLE_PREFIX}messages (
          id INT AUTO_INCREMENT PRIMARY KEY,
          senderId INT,
          receiverId INT,
          content TEXT,
          readAt TIMESTAMP NULL DEFAULT NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (senderId) REFERENCES ${TABLE_PREFIX}users(id) ON DELETE SET NULL,
          FOREIGN KEY (receiverId) REFERENCES ${TABLE_PREFIX}users(id) ON DELETE SET NULL
        )
      `);
      log(`${TABLE_PREFIX}messages 테이블 생성 완료`, 'db');
    }
    
    // 이벤트 테이블 생성
    if (!(await tableExists('events'))) {
      await pool.execute(`
        CREATE TABLE ${TABLE_PREFIX}events (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL,
          datetime TIMESTAMP NOT NULL,
          status VARCHAR(50) NOT NULL,
          roomNumber VARCHAR(50) NOT NULL,
          patientName VARCHAR(100),
          patientId INT,
          roomId INT,
          description TEXT,
          createdBy VARCHAR(100),
          createdById INT,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (patientId) REFERENCES ${TABLE_PREFIX}patients(id) ON DELETE SET NULL,
          FOREIGN KEY (roomId) REFERENCES ${TABLE_PREFIX}rooms(id) ON DELETE SET NULL,
          FOREIGN KEY (createdById) REFERENCES ${TABLE_PREFIX}users(id) ON DELETE SET NULL
        )
      `);
      log(`${TABLE_PREFIX}events 테이블 생성 완료`, 'db');
    }

    log('모든 임시 테이블 초기화 완료', 'db');
    return true;
  } catch (error) {
    log(`테이블 초기화 실패: ${error}`, 'db');
    return false;
  }
}

/**
 * 기본 관리자 사용자 생성 함수
 * 시스템 초기 사용을 위한 관리자 계정을 생성합니다.
 */
export async function createDefaultAdminUser() {
  try {
    // 이미 관리자가 있는지 확인
    const [existingDirectors] = await pool.execute(
      `SELECT * FROM ${TABLE_PREFIX}users WHERE role = 'DIRECTOR' LIMIT 1`
    );

    if (Array.isArray(existingDirectors) && existingDirectors.length > 0) {
      log('기본 관리자가 이미 존재합니다', 'db');
      return;
    }

    // 기본 비밀번호: password123 (실제 환경에서는 더 강력한 비밀번호 사용 권장)
    const defaultPassword = 'password123'; // 실제 구현에서는 해싱 적용 필요

    // 병원장 계정 생성
    await pool.execute(
      `INSERT INTO ${TABLE_PREFIX}users 
        (username, password, email, name, role, preferredLanguage) 
       VALUES 
        (?, ?, ?, ?, ?, ?)`,
      ['director2', defaultPassword, 'director@hospital.com', '김원장', 'DIRECTOR', 'ko']
    );
    
    log('기본 관리자 계정 생성 완료', 'db');
  } catch (error) {
    log(`기본 관리자 생성 실패: ${error}`, 'db');
  }
}

// 모듈 초기화 함수
export async function initializeDatabase() {
  try {
    // DB 연결 테스트
    const isConnected = await testConnection();
    if (!isConnected) {
      log('데이터베이스 연결 실패, 초기화를 중단합니다', 'db');
      return false;
    }
    
    // 안전성 검사: 임시 테이블 접두사 확인
    if (TABLE_PREFIX.length < 10) {
      log('안전하지 않은 테이블 접두사: 최소 10자 이상이어야 합니다', 'db');
      return false;
    }
    
    // 임시 테이블만 확인하도록 추가 검사
    await checkTemporaryTablesOnly();
    
    // 테이블 초기화 전 사용자 확인
    log(`다음 접두사로 테이블 생성: ${TABLE_PREFIX}`, 'db');
    log('이 접두사를 가진 테이블만 생성/수정됩니다', 'db');
    
    // 테이블 초기화
    const tablesInitialized = await initializeTables();
    if (!tablesInitialized) {
      log('테이블 초기화 실패, 초기화를 중단합니다', 'db');
      return false;
    }

    // 기본 관리자 생성
    await createDefaultAdminUser();

    log('데이터베이스 초기화 완료', 'db');
    return true;
  } catch (error) {
    log(`데이터베이스 초기화 실패: ${error}`, 'db');
    return false;
  }
}