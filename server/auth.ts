/**
 * 인증 및 권한 관리 모듈
 * 
 * JWT 기반 인증, 비밀번호 암호화 및 검증, 사용자 권한 확인 기능을 제공합니다.
 * 사용자 인증과 관련된 모든 처리를 담당합니다.
 */

import { Express, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { User, UserRole } from "@shared/schema";
import { storage } from "./storage";
import { log } from "./vite";

// JWT 설정
const JWT_SECRET = process.env.JWT_SECRET || "hospital-care-system-jwt-secret-key-2025-06";
const JWT_EXPIRES_IN = "7d"; // 토큰 만료 기간: 7일

/**
 * 비밀번호 해싱 함수
 * bcrypt를 사용하여 비밀번호를 안전하게 해싱합니다.
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * 비밀번호 검증 함수
 * 입력된 비밀번호와 저장된 해시를 비교합니다.
 */
export async function comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * JWT 토큰 생성 함수
 * 사용자 정보에서 필요한 데이터만 추출하여 JWT 토큰을 생성합니다.
 */
export function generateToken(user: User): string {
  const payload = { 
    id: user.id, 
    role: user.role,
    name: user.name,
    username: user.username
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * JWT 인증 미들웨어
 * 클라이언트 요청에서 JWT 토큰을 확인하고, 유효한 경우 req.user에 사용자 정보를 추가합니다.
 */
export const authenticateJWT = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 요청 헤더에서 인증 토큰 추출
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      log(`JWT 인증 실패: 인증 헤더 없음 (${req.path})`, 'auth');
      return res.status(401).json({ message: '인증이 필요합니다' });
    }
    
    // Bearer 토큰 형식 확인 및 토큰 추출
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      log(`JWT 인증 실패: 잘못된 토큰 형식 (${req.path})`, 'auth');
      return res.status(401).json({ message: '잘못된 인증 형식입니다' });
    }
    
    const token = parts[1];
    
    // 토큰 검증
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    
    // 디코딩된 페이로드에서 사용자 ID 추출
    const userId = decoded.id;
    if (!userId) {
      log(`JWT 인증 실패: 토큰에 사용자 ID 없음 (${req.path})`, 'auth');
      return res.status(401).json({ message: '유효하지 않은 토큰입니다' });
    }
    
    // 사용자 정보 조회
    const user = await storage.getUser(userId);
    if (!user) {
      log(`JWT 인증 실패: DB에서 사용자를 찾을 수 없음 - ID: ${userId} (${req.path})`, 'auth');
      return res.status(401).json({ message: '사용자를 찾을 수 없습니다' });
    }
    
    // 사용자 정보를 요청 객체에 추가
    req.user = user;
    log(`JWT 인증 성공: 사용자 ${user.username} (${req.path})`, 'auth');
    next();
    
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      log(`JWT 인증 실패: 토큰 만료됨 (${req.path})`, 'auth');
      return res.status(401).json({ message: '토큰이 만료되었습니다' });
    } else if (error instanceof jwt.JsonWebTokenError) {
      log(`JWT 인증 실패: 유효하지 않은 토큰 (${req.path})`, 'auth');
      return res.status(401).json({ message: '유효하지 않은 토큰입니다' });
    } else {
      log(`JWT 인증 실패: 내부 오류 - ${error} (${req.path})`, 'auth');
      return res.status(500).json({ message: '인증 처리 중 오류가 발생했습니다' });
    }
  }
};

/**
 * 인증 라우트 설정 함수
 * Express 앱에 로그인, 회원가입, 로그아웃 등의 인증 관련 라우트를 추가합니다.
 */
export function setupAuth(app: Express) {
  /**
   * 회원가입 API
   * POST /api/register
   * 새 사용자를 생성하고 JWT 토큰을 반환합니다.
   */
  app.post("/api/register", async (req, res) => {
    try {
      const { username, password, email, name, role } = req.body;
      
      // 필수 필드 검증
      if (!username || !password || !email || !name || !role) {
        return res.status(400).json({ message: "모든 필수 필드를 입력해주세요" });
      }
      
      // 유효한 역할인지 확인
      if (!Object.values(UserRole).includes(role)) {
        return res.status(400).json({ message: "유효하지 않은 사용자 역할입니다" });
      }
      
      // 기존 사용자 확인
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "이미 존재하는 사용자명입니다" });
      }
      
      // 비밀번호 해싱
      const hashedPassword = await hashPassword(password);
      
      // 사용자 생성
      const newUser = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        name,
        role
      });
      
      // 토큰 생성
      const token = generateToken(newUser);
      
      // 응답에 토큰 및 사용자 정보 포함
      res.status(201).json({
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        token
      });
    } catch (error) {
      log(`회원가입 실패: ${error}`, 'auth');
      res.status(500).json({ message: "회원가입 처리 중 오류가 발생했습니다" });
    }
  });

  /**
   * 로그인 API
   * POST /api/login
   * 사용자 인증 후 JWT 토큰을 반환합니다.
   */
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // 필수 필드 검증
      if (!username || !password) {
        return res.status(400).json({ message: "사용자명과 비밀번호를 모두 입력해주세요" });
      }
      
      // 사용자 조회
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "사용자명 또는 비밀번호가 올바르지 않습니다" });
      }
      
      // 비밀번호 검증
      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "사용자명 또는 비밀번호가 올바르지 않습니다" });
      }
      
      // 토큰 생성
      const token = generateToken(user);
      
      log(`로그인 성공: ${username}`, 'auth');
      
      // 응답에 토큰 및 사용자 정보 포함
      res.status(200).json({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        token
      });
    } catch (error) {
      log(`로그인 실패: ${error}`, 'auth');
      res.status(500).json({ message: "로그인 처리 중 오류가 발생했습니다" });
    }
  });

  /**
   * 로그아웃 API
   * POST /api/logout
   * 클라이언트 측에서 토큰을 삭제해야 합니다.
   * 서버 측에서는 특별한 처리가 필요하지 않습니다. (JWT는 stateless)
   */
  app.post("/api/logout", (req, res) => {
    res.status(200).json({ message: "로그아웃 되었습니다" });
  });

  /**
   * 현재 사용자 정보 API
   * GET /api/user
   * 인증된 사용자의 정보를 반환합니다.
   */
  app.get("/api/user", authenticateJWT, (req, res) => {
    // authenticateJWT 미들웨어를 통과했으므로 req.user가 설정되어 있음
    const user = req.user!;
    
    // 민감한 정보 제외하고 반환
    res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role
    });
  });
}