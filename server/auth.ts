import { Express, Request, Response, NextFunction } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { User } from "@shared/schema";

// 사용자 정의 인터페이스 대신 타입 추가 노트
// Express.User 타입을 직접 확장할 수 없으므로 passport에 의존

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// JWT 토큰 관련 설정
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '7d'; // 토큰 유효 기간

// JWT 토큰을 생성하는 함수
function generateToken(user: User) {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    role: user.role
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// JWT 인증 미들웨어
export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  // 쿠키에서 토큰 추출
  const token = req.cookies?.token;
  
  if (!token) {
    return res.status(401).json({ message: '인증이 필요합니다' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: '유효하지 않은 토큰입니다' });
  }
};

export function setupAuth(app: Express) {
  // 회원가입 API
  app.post("/api/register", async (req, res, next) => {
    try {
      // 사용자 이름 중복 확인
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "이미 사용 중인 아이디입니다." });
      }
      
      // 이메일 중복 확인
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ message: "이미 사용 중인 이메일입니다." });
      }

      // 사용자 생성
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      // JWT 토큰 생성
      const token = generateToken(user);
      
      // 쿠키에 토큰 저장
      res.cookie('token', token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      });
      
      // 비밀번호 제외하고 사용자 정보 반환
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  // 로그인 API
  app.post("/api/login", async (req, res, next) => {
    try {
      const { username, password } = req.body;
      
      // 사용자 찾기
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return res.status(401).json({ message: "아이디 또는 비밀번호가 올바르지 않습니다." });
      }
      
      // JWT 토큰 생성
      const token = generateToken(user);
      
      // 쿠키에 토큰 저장
      res.cookie('token', token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      });
      
      // 비밀번호 제외하고 사용자 정보 반환
      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  // 로그아웃 API
  app.post("/api/logout", (req, res) => {
    // 쿠키 삭제
    res.clearCookie('token');
    res.status(200).json({ message: "로그아웃 되었습니다." });
  });

  // 현재 사용자 정보 API
  app.get("/api/user", authenticateJWT, (req, res) => {
    const user = (req as any).user;
    res.status(200).json(user);
  });
}