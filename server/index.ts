/**
 * 서버 메인 엔트리 포인트
 * 
 * Express.js 서버 설정 및 실행을 담당하는 파일입니다.
 * 애플리케이션의 기본 미들웨어 설정, 라우트 등록, 인증 설정 등이 포함됩니다.
 */

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cookieParser from "cookie-parser";
import cors from 'cors';

/**
 * Express 앱 인스턴스 생성
 * 모든 HTTP 요청 처리를 위한 기본 객체
 */
const app = express();

/**
 * 기본 미들웨어 설정
 */
// CORS 설정 - 개발 환경을 위한 특수 설정
const corsOptions = {
  origin: process.env.NODE_ENV === 'development' ? true : '*', // 개발 환경에서는 모든 출처 허용
  credentials: true, // 인증 정보 전달 허용
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400 // CORS 프리플라이트 요청 결과 캐싱 (24시간)
};

app.use(cors(corsOptions));

// CORS 프리플라이트 요청 처리를 위한 OPTIONS 핸들러 추가
app.options('*', cors(corsOptions));

// 디버깅 및 모니터링을 위한 요청 로깅 미들웨어
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - 클라이언트 IP: ${req.ip}`);
  
  // 헤더 로깅 (디버깅용)
  if (process.env.NODE_ENV === 'development') {
    console.log('요청 헤더:', JSON.stringify(req.headers, null, 2));
  }
  
  // 헤더 일관성을 위한 추가 설정 - 필요하지 않을 수 있으나 일부 클라이언트 호환성을 위해 유지
  res.header('Access-Control-Allow-Origin', process.env.NODE_ENV === 'development' ? '*' : req.headers.origin);
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // OPTIONS 요청은 바로 응답
  if (req.method === 'OPTIONS') {
    return res.status(204).end(); // 204 No Content
  }
  
  next();
});

// JSON과 URL 인코딩을 가장 먼저 처리
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 쿠키와 세션 처리를 JSON 처리 후에 설정
app.use(cookieParser(process.env.SESSION_SECRET || "dev-session-secret"));

// 프록시 설정 - Replit 환경에서 필요함
app.set("trust proxy", 1);

/**
 * API 요청 로깅 미들웨어
 * 
 * 모든 API 요청의 처리 시간과 응답을 기록합니다.
 * 개발 및 디버깅에 유용한 정보를 제공합니다.
 */
app.use((req, res, next) => {
  // 요청 시작 시간 기록
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // 원본 json 메서드를 가로채서 응답 데이터 캡처
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  // 응답이 완료되면 로그 출력
  res.on("finish", () => {
    const duration = Date.now() - start;
    // API 요청에 대해서만 로깅
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      // 로그 길이 제한 (너무 길면 잘라냄)
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

/**
 * 서버 실행 즉시 실행 함수
 * 서버 구성 및 실행을 담당합니다.
 */
(async () => {
  // API 라우트 등록
  const server = await registerRoutes(app);

  /**
   * 오류 처리 미들웨어
   * 앱 전체에서 발생하는 오류를 처리합니다.
   */
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  /**
   * Vite 개발 서버 설정
   * 개발 모드에서만 활성화됩니다.
   * 모든 다른 라우트 설정 후에 실행해야 catch-all 라우트가 다른 라우트를 방해하지 않습니다.
   */
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  /**
   * 서버 시작
   * Replit 환경에서는 항상 5000번 포트를 사용해야 합니다.
   * API와 클라이언트 모두 이 포트를 통해 제공됩니다.
   */
  const port = 5000;
  server.listen({
    port,
    host: process.platform === 'win32' ? '127.0.0.1' : 'localhost',
  }, () => {
    log(`${port}번 포트에서 서버 실행 중`);
  });
})();