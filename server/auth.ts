import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, UserRole } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

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

export function setupAuth(app: Express) {
  if (!process.env.SESSION_SECRET) {
    const secureSecret = randomBytes(32).toString('hex');
    console.log(`Session secret not found, using random secret: ${secureSecret}`);
    process.env.SESSION_SECRET = secureSecret;
  }

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        } else {
          return done(null, user);
        }
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // 회원가입 라우트
  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, password, name, role } = req.body;
      
      // 환자/보호자만 회원가입 가능
      if (role !== UserRole.PATIENT && role !== UserRole.GUARDIAN) {
        return res.status(403).json({ 
          error: "일반 회원가입으로는 환자와 보호자 계정만 생성할 수 있습니다." 
        });
      }
      
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "이미 존재하는 아이디입니다" });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (err) {
      next(err);
    }
  });

  // 로그인 라우트
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: Express.User | false, info: { message: string } | undefined) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ error: info?.message || "로그인 실패" });
      
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(200).json(user);
      });
    })(req, res, next);
  });

  // 로그아웃 라우트
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // 현재 로그인한 사용자 정보 가져오기
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // 관리자 전용 - 새 계정 생성
  app.post("/api/admin/users", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "로그인이 필요합니다" });
      
      const currentUser = req.user as SelectUser;
      
      // 병원장은 모든 계정 생성 가능, 간호사는 환자와 보호자만 생성 가능
      if (currentUser.role !== UserRole.DIRECTOR && 
         (currentUser.role !== UserRole.NURSE || 
          (req.body.role !== UserRole.PATIENT && req.body.role !== UserRole.GUARDIAN))) {
        return res.status(403).json({ error: "권한이 없습니다" });
      }
      
      const { username, password, name, role } = req.body;
      
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "이미 존재하는 아이디입니다" });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(password),
      });

      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  });
  
  // 사용자 목록 가져오기 (관리자 전용)
  app.get("/api/admin/users", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "로그인이 필요합니다" });
      
      const currentUser = req.user as SelectUser;
      if (currentUser.role !== UserRole.DIRECTOR && currentUser.role !== UserRole.NURSE) {
        return res.status(403).json({ error: "권한이 없습니다" });
      }
      
      const role = req.query.role as UserRole | undefined;
      const users = await storage.getUsersByRole(role);
      
      // 민감한 정보 제거
      const safeUsers = users.map(({ password, ...rest }) => rest);
      
      res.json(safeUsers);
    } catch (err) {
      res.status(500).json({ error: "서버 오류가 발생했습니다" });
    }
  });

  // 초기 병원장 계정 생성 (첫 시작 시에만 실행)
  app.post("/api/setup/initial-director", async (req, res, next) => {
    try {
      // 병원장 계정이 이미 존재하는지 확인
      const existingDirectors = await storage.getUsersByRole(UserRole.DIRECTOR);
      if (existingDirectors.length > 0) {
        return res.status(400).json({ error: "병원장 계정이 이미 존재합니다" });
      }
      
      const { username, password, name } = req.body;
      
      const user = await storage.createUser({
        username,
        password: await hashPassword(password),
        name,
        role: UserRole.DIRECTOR,
      });

      res.status(201).json({ ...user, password: undefined });
    } catch (err) {
      next(err);
    }
  });
}