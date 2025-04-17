/**
 * 데이터베이스 연결 설정 파일
 * PostgreSQL 데이터베이스와의 연결을 관리하며 Drizzle ORM을 초기화합니다.
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema"; // 데이터베이스 스키마 정의 가져오기

// Neon PostgreSQL 설정 (서버리스 환경에서 웹소켓 연결 사용)
neonConfig.webSocketConstructor = ws;

// 환경 변수 검증 - DATABASE_URL이 없으면 실행 중단
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL 환경 변수가 설정되지 않았습니다. 데이터베이스를 생성하셨나요?",
  );
}

/**
 * 데이터베이스 연결 풀 생성
 * 여러 연결 요청을 효율적으로 관리하기 위해 연결 풀 사용
 */
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * Drizzle ORM 인스턴스 생성
 * - client: PostgreSQL 연결 풀
 * - schema: 테이블 및 관계 정의 (shared/schema.ts에서 가져옴)
 */
export const db = drizzle({ client: pool, schema });