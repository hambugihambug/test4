import type { Express, Request, Response, NextFunction } from "express";
import { authenticateJWT } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import { UserRole, User, insertUserSchema } from "@shared/schema";

// 역할 확인 미들웨어
const hasRole = (roles: UserRole[]) => (req: Request, res: Response, next: NextFunction) => {
  // user 객체는 authenticateJWT에서 req에 추가됨
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({ message: "인증이 필요합니다" });
  }
  
  if (roles.includes(user.role as UserRole)) {
    return next();
  }
  
  res.status(403).json({ message: "권한이 없습니다" });
};

// 사용자 관리 API 라우트 등록
export function registerUserRoutes(app: Express) {
  // 특정 사용자 조회 API
  app.get('/api/users/:id', authenticateJWT, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const requestUser = (req as any).user;
      
      // 자신의 정보는 항상 조회 가능
      if (requestUser.id !== userId) {
        // 병원장이나 간호사만 다른 사용자 정보 조회 가능
        if (requestUser.role !== UserRole.DIRECTOR && requestUser.role !== UserRole.NURSE) {
          return res.status(403).json({ message: "권한이 없습니다" });
        }
        
        // 간호사는 환자와 보호자만 조회 가능
        if (requestUser.role === UserRole.NURSE) {
          const user = await storage.getUser(userId);
          if (!user || (user.role !== UserRole.PATIENT && user.role !== UserRole.GUARDIAN)) {
            return res.status(403).json({ message: "권한이 없습니다" });
          }
        }
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다" });
      }
      
      // 비밀번호 제외하고 반환
      const { password, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error('사용자 조회 오류:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다' });
    }
  });
  
  // 사용자 생성 API (병원장 전용)
  app.post('/api/users', authenticateJWT, hasRole([UserRole.DIRECTOR]), async (req, res) => {
    try {
      // 사용자 이름 중복 확인
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "이미 사용 중인 아이디입니다" });
      }
      
      // 이메일 중복 확인
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ message: "이미 사용 중인 이메일입니다" });
      }
      
      // 데이터 유효성 검사
      const validatedData = insertUserSchema.parse(req.body);
      
      // 비밀번호 해싱은 storage에서 처리
      const user = await storage.createUser(validatedData);
      
      // 비밀번호 제외하고 반환
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "유효하지 않은 데이터입니다", errors: error.errors });
      }
      console.error('사용자 생성 오류:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다' });
    }
  });
  
  // 사용자 정보 업데이트 API
  app.put('/api/users/:id', authenticateJWT, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const requestUser = (req as any).user;
      
      // 자신의 정보만 수정 가능 (병원장은 예외)
      if (requestUser.id !== userId && requestUser.role !== UserRole.DIRECTOR) {
        // 간호사는 환자와 보호자 정보만 수정 가능
        if (requestUser.role === UserRole.NURSE) {
          const user = await storage.getUser(userId);
          if (!user || (user.role !== UserRole.PATIENT && user.role !== UserRole.GUARDIAN)) {
            return res.status(403).json({ message: "권한이 없습니다" });
          }
        } else {
          return res.status(403).json({ message: "권한이 없습니다" });
        }
      }
      
      // 기존 사용자 확인
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다" });
      }
      
      // 역할 변경은 병원장만 가능
      if (req.body.role && req.body.role !== user.role && requestUser.role !== UserRole.DIRECTOR) {
        return res.status(403).json({ message: "역할 변경 권한이 없습니다" });
      }
      
      // 비밀번호 변경 확인 (비밀번호 필드가 전송된 경우)
      let updatedUserData = { ...req.body };
      
      // 정보 업데이트
      const updatedUser = await storage.updateUser(userId, updatedUserData);
      if (!updatedUser) {
        return res.status(404).json({ message: "사용자 업데이트에 실패했습니다" });
      }
      
      // 비밀번호 제외하고 반환
      const { password, ...userWithoutPassword } = updatedUser;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error('사용자 업데이트 오류:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다' });
    }
  });
  
  // 사용자 삭제 API (병원장만 가능)
  app.delete('/api/users/:id', authenticateJWT, hasRole([UserRole.DIRECTOR]), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const requestUser = (req as any).user;
      
      // 자기 자신은 삭제할 수 없음
      if (requestUser.id === userId) {
        return res.status(400).json({ message: "자기 자신은 삭제할 수 없습니다" });
      }
      
      // 사용자 존재 확인
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다" });
      }
      
      // 사용자 삭제
      const success = await storage.deleteUser(userId);
      if (!success) {
        return res.status(500).json({ message: "사용자 삭제에 실패했습니다" });
      }
      
      res.status(200).json({ success: true, message: "사용자가 삭제되었습니다" });
    } catch (error) {
      console.error('사용자 삭제 오류:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다' });
    }
  });
  
  // 비밀번호 변경 API
  app.post('/api/users/:id/change-password', authenticateJWT, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const requestUser = (req as any).user;
      const { currentPassword, newPassword } = req.body;
      
      // 자신의 비밀번호만 변경 가능 (병원장은 예외)
      if (requestUser.id !== userId && requestUser.role !== UserRole.DIRECTOR) {
        return res.status(403).json({ message: "권한이 없습니다" });
      }
      
      // 사용자 존재 확인
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다" });
      }
      
      // 병원장이 아닌 경우 현재 비밀번호 확인
      if (requestUser.id === userId && !await storage.verifyPassword(userId, currentPassword)) {
        return res.status(400).json({ message: "현재 비밀번호가 일치하지 않습니다" });
      }
      
      // 비밀번호 변경
      const updatedUser = await storage.updateUserPassword(userId, newPassword);
      if (!updatedUser) {
        return res.status(500).json({ message: "비밀번호 변경에 실패했습니다" });
      }
      
      res.status(200).json({ success: true, message: "비밀번호가 변경되었습니다" });
    } catch (error) {
      console.error('비밀번호 변경 오류:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다' });
    }
  });
}