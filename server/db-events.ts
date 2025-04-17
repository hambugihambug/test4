/**
 * 이벤트 관리 관련 메서드
 * 
 * DatabaseStorage 클래스 내에 추가될 이벤트 관련 메서드
 */

import { pool, TABLE_PREFIX } from './db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { log } from './vite';
import { Event, InsertEvent } from '@shared/schema';

// 이 내용을 storage.ts 파일의 DatabaseStorage 클래스에 추가해야 합니다
/**
 * 모든 이벤트 조회
 */
export async function getEvents(): Promise<Event[]> {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM ${TABLE_PREFIX}events ORDER BY datetime DESC`
    );
    
    return rows as Event[];
  } catch (error) {
    log(`이벤트 목록 조회 오류: ${error}`, 'storage');
    return [];
  }
}

/**
 * 단일 이벤트 조회
 */
export async function getEvent(id: number): Promise<Event | undefined> {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM ${TABLE_PREFIX}events WHERE id = ?`,
      [id]
    );
    
    return rows.length > 0 ? (rows[0] as Event) : undefined;
  } catch (error) {
    log(`이벤트 조회 오류 (ID: ${id}): ${error}`, 'storage');
    return undefined;
  }
}

/**
 * 이벤트 생성
 */
export async function createEvent(event: InsertEvent): Promise<Event> {
  try {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO ${TABLE_PREFIX}events 
      (title, type, datetime, status, roomNumber, patientName, patientId, roomId, description, createdBy, createdById) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        event.title,
        event.type,
        event.datetime || new Date().toISOString(),
        event.status,
        event.roomNumber,
        event.patientName || null,
        event.patientId || null,
        event.roomId || null,
        event.description || null,
        event.createdBy || null,
        event.createdById || null
      ]
    );
    
    return {
      ...event,
      id: result.insertId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Event;
  } catch (error) {
    log(`이벤트 생성 오류: ${error}`, 'storage');
    throw new Error(`이벤트 생성 실패: ${error}`);
  }
}

/**
 * 이벤트 수정
 */
export async function updateEvent(id: number, eventData: Partial<Event>): Promise<Event | undefined> {
  try {
    // 업데이트할 필드 동적 구성
    const fields: string[] = [];
    const values: any[] = [];
    
    for (const [key, value] of Object.entries(eventData)) {
      if (value !== undefined && key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    
    if (fields.length === 0) return await getEvent(id);
    
    values.push(id);
    
    await pool.execute(
      `UPDATE ${TABLE_PREFIX}events SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    return await getEvent(id);
  } catch (error) {
    log(`이벤트 수정 오류 (ID: ${id}): ${error}`, 'storage');
    return undefined;
  }
}

/**
 * 이벤트 삭제
 */
export async function deleteEvent(id: number): Promise<boolean> {
  try {
    const [result] = await pool.execute<ResultSetHeader>(
      `DELETE FROM ${TABLE_PREFIX}events WHERE id = ?`,
      [id]
    );
    
    return result.affectedRows > 0;
  } catch (error) {
    log(`이벤트 삭제 오류 (ID: ${id}): ${error}`, 'storage');
    return false;
  }
}

/**
 * 이벤트 타입별 조회
 */
export async function getEventsByType(type: string): Promise<Event[]> {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM ${TABLE_PREFIX}events WHERE type = ? ORDER BY datetime DESC`,
      [type]
    );
    
    return rows as Event[];
  } catch (error) {
    log(`타입별 이벤트 조회 오류 (타입: ${type}): ${error}`, 'storage');
    return [];
  }
}

/**
 * 이벤트 상태별 조회
 */
export async function getEventsByStatus(status: string): Promise<Event[]> {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM ${TABLE_PREFIX}events WHERE status = ? ORDER BY datetime DESC`,
      [status]
    );
    
    return rows as Event[];
  } catch (error) {
    log(`상태별 이벤트 조회 오류 (상태: ${status}): ${error}`, 'storage');
    return [];
  }
}

/**
 * 환자별 이벤트 조회
 */
export async function getEventsByPatientId(patientId: number): Promise<Event[]> {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM ${TABLE_PREFIX}events WHERE patientId = ? ORDER BY datetime DESC`,
      [patientId]
    );
    
    return rows as Event[];
  } catch (error) {
    log(`환자별 이벤트 조회 오류 (환자 ID: ${patientId}): ${error}`, 'storage');
    return [];
  }
}

/**
 * 병실별 이벤트 조회
 */
export async function getEventsByRoomId(roomId: number): Promise<Event[]> {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM ${TABLE_PREFIX}events WHERE roomId = ? ORDER BY datetime DESC`,
      [roomId]
    );
    
    return rows as Event[];
  } catch (error) {
    log(`병실별 이벤트 조회 오류 (병실 ID: ${roomId}): ${error}`, 'storage');
    return [];
  }
}

/**
 * 최근 이벤트 조회
 */
export async function getRecentEvents(limit: number): Promise<Event[]> {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM ${TABLE_PREFIX}events ORDER BY datetime DESC LIMIT ?`,
      [limit]
    );
    
    return rows as Event[];
  } catch (error) {
    log(`최근 이벤트 조회 오류: ${error}`, 'storage');
    return [];
  }
}