/**
 * 이벤트 관련 API 라우트
 * 
 * 이벤트 데이터 CRUD 작업을 위한 API 엔드포인트를 정의합니다.
 */

import { Express, Request, Response } from 'express';
import { z } from 'zod';
import { storage } from './storage';
import { insertEventSchema } from '@shared/schema';
import { log } from './vite';

// 이 함수는 routes.ts 파일에서 호출할 예정입니다
export function registerEventRoutes(app: Express) {
  /**
   * 모든 이벤트 조회 API
   * GET /api/events
   */
  app.get('/api/events', async (req: Request, res: Response) => {
    try {
      // 쿼리 파라미터 파싱
      const type = req.query.type as string | undefined;
      const status = req.query.status as string | undefined;
      const patientId = req.query.patientId ? parseInt(req.query.patientId as string) : undefined;
      const roomId = req.query.roomId ? parseInt(req.query.roomId as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      // 쿼리 파라미터에 따라 적절한 메서드 호출
      if (type) {
        const events = await storage.getEventsByType(type);
        return res.status(200).json(events);
      } else if (status) {
        const events = await storage.getEventsByStatus(status);
        return res.status(200).json(events);
      } else if (patientId) {
        const events = await storage.getEventsByPatientId(patientId);
        return res.status(200).json(events);
      } else if (roomId) {
        const events = await storage.getEventsByRoomId(roomId);
        return res.status(200).json(events);
      } else if (limit) {
        const events = await storage.getRecentEvents(limit);
        return res.status(200).json(events);
      } else {
        // 기본: 모든 이벤트 조회
        const events = await storage.getEvents();
        return res.status(200).json(events);
      }
    } catch (error) {
      log(`이벤트 목록 조회 API 오류: ${error}`, 'routes');
      return res.status(500).json({ error: '이벤트 목록을 조회하는 중 오류가 발생했습니다.' });
    }
  });

  /**
   * 단일 이벤트 조회 API
   * GET /api/events/:id
   */
  app.get('/api/events/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: '유효하지 않은 이벤트 ID입니다.' });
      }
      
      const event = await storage.getEvent(id);
      if (!event) {
        return res.status(404).json({ error: '이벤트를 찾을 수 없습니다.' });
      }
      
      return res.status(200).json(event);
    } catch (error) {
      log(`이벤트 조회 API 오류: ${error}`, 'routes');
      return res.status(500).json({ error: '이벤트를 조회하는 중 오류가 발생했습니다.' });
    }
  });

  /**
   * 이벤트 생성 API
   * POST /api/events
   */
  app.post('/api/events', async (req: Request, res: Response) => {
    try {
      // 요청 데이터 검증
      const validatedData = insertEventSchema.parse(req.body);
      
      // 현재 로그인한 사용자 정보가 있으면 createdBy 필드에 추가
      if (req.user) {
        validatedData.createdBy = req.user.name;
        validatedData.createdById = req.user.id;
      }
      
      // 이벤트 생성
      const event = await storage.createEvent(validatedData);
      
      return res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: '유효하지 않은 이벤트 데이터입니다.', details: error.errors });
      }
      
      log(`이벤트 생성 API 오류: ${error}`, 'routes');
      return res.status(500).json({ error: '이벤트를 생성하는 중 오류가 발생했습니다.' });
    }
  });

  /**
   * 이벤트 수정 API
   * PATCH /api/events/:id
   */
  app.patch('/api/events/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: '유효하지 않은 이벤트 ID입니다.' });
      }
      
      // 요청 데이터 검증 (부분 업데이트이므로 partial로 변환)
      const partialEventSchema = insertEventSchema.partial();
      const validatedData = partialEventSchema.parse(req.body);
      
      // 이벤트 조회
      const existingEvent = await storage.getEvent(id);
      if (!existingEvent) {
        return res.status(404).json({ error: '이벤트를 찾을 수 없습니다.' });
      }
      
      // 이벤트 수정
      const updatedEvent = await storage.updateEvent(id, validatedData);
      
      return res.status(200).json(updatedEvent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: '유효하지 않은 이벤트 데이터입니다.', details: error.errors });
      }
      
      log(`이벤트 수정 API 오류: ${error}`, 'routes');
      return res.status(500).json({ error: '이벤트를 수정하는 중 오류가 발생했습니다.' });
    }
  });

  /**
   * 이벤트 삭제 API
   * DELETE /api/events/:id
   */
  app.delete('/api/events/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: '유효하지 않은 이벤트 ID입니다.' });
      }
      
      // 이벤트 조회
      const existingEvent = await storage.getEvent(id);
      if (!existingEvent) {
        return res.status(404).json({ error: '이벤트를 찾을 수 없습니다.' });
      }
      
      // 이벤트 삭제
      const success = await storage.deleteEvent(id);
      if (!success) {
        return res.status(500).json({ error: '이벤트 삭제에 실패했습니다.' });
      }
      
      return res.status(204).send();
    } catch (error) {
      log(`이벤트 삭제 API 오류: ${error}`, 'routes');
      return res.status(500).json({ error: '이벤트를 삭제하는 중 오류가 발생했습니다.' });
    }
  });
}