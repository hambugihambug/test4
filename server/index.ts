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
import { storage } from "./storage";
import { setupAuth } from "./auth";

/**
 * Express 앱 인스턴스 생성
 * 모든 HTTP 요청 처리를 위한 기본 객체
 */
const app = express();

/**
 * 기본 미들웨어 설정
 */
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
  // 인증 설정
  setupAuth(app);
  
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
    host: "0.0.0.0", // 모든 네트워크 인터페이스에서 접근 가능
    reusePort: true, // 포트 재사용 허용
  }, () => {
    log(`${port}번 포트에서 서버 실행 중`);
  });
})();
