import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// 인증 토큰 관련 상수
const TOKEN_KEY = 'auth_token';

// 로컬 스토리지에서 토큰 가져오기
function getAuthToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  console.log("API 호출 시 토큰 상태:", token ? "토큰 있음" : "토큰 없음");
  
  // 토큰이 있을 경우 유효성 검사
  if (token) {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        const expiry = payload.exp * 1000; // 초를 밀리초로 변환
        const now = Date.now();
        const remainingDays = Math.round((expiry - now) / (1000 * 60 * 60 * 24));
        
        console.log("토큰 정보:", {
          userId: payload.id,
          role: payload.role,
          만료까지: remainingDays + "일",
          유효여부: now < expiry ? "유효함" : "만료됨"
        });
        
        // 토큰이 만료된 경우
        if (now >= expiry) {
          console.error("만료된 토큰 발견. 토큰을 삭제하고 재로그인 필요");
          localStorage.removeItem(TOKEN_KEY);
          return null;
        }
      }
    } catch (e) {
      console.error("토큰 디코딩 오류:", e);
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
  }
  
  return token;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: RequestInit
): Promise<Response> {
  // 기본 헤더 설정
  const headers: HeadersInit = {
    ...(data ? { "Content-Type": "application/json" } : {}),
    ...(options?.headers || {})
  };
  
  // 인증 토큰이 있으면 헤더에 추가 (options.headers 에 없는 경우에만)
  // @ts-ignore: 헤더 타입 무시
  if (!headers.Authorization) {
    const token = getAuthToken();
    if (token) {
      // @ts-ignore: 헤더 타입 무시
      headers.Authorization = `Bearer ${token}`;
      console.log("요청에 인증 헤더 추가됨:", url);
    } else {
      console.log("요청에 인증 헤더 없음:", url);
      
      // 디버깅: 토큰 직접 가져오기 시도
      const directToken = localStorage.getItem(TOKEN_KEY);
      if (directToken) {
        console.log("localStorage에서 직접 토큰 가져옴");
        // @ts-ignore: 헤더 타입 무시
        headers.Authorization = `Bearer ${directToken}`;
      }
    }
  }

  console.log(`API 요청 (${method} ${url})`, { 헤더포함여부: Object.keys(headers).length > 0 });
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include", // 쿠키도 함께 사용
    ...options
  });

  if (!res.ok) {
    console.error(`API 오류 (${method} ${url}):`, res.status, res.statusText);
    
    // 401 오류 처리 (권한 없음)
    if (res.status === 401) {
      console.error("API 요청 401 오류 - 인증 실패. 토큰 삭제 및 로그인 페이지로 이동");
      localStorage.removeItem(TOKEN_KEY);
      
      // 로그인 페이지가 아닌 경우에만 리디렉션
      if (window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }
    }
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // 헤더 설정
    const headers: HeadersInit = {};
    const url = queryKey[0] as string;
    
    // 인증 토큰이 있으면 헤더에 추가
    const token = getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      console.log("쿼리 요청에 인증 헤더 추가됨:", url);
    } else {
      console.log("쿼리 요청에 인증 헤더 없음:", url);
      
      // 디버깅: 토큰 직접 가져오기 시도
      const directToken = localStorage.getItem(TOKEN_KEY);
      if (directToken) {
        console.log("localStorage에서 직접 토큰 가져옴");
        headers["Authorization"] = `Bearer ${directToken}`;
      }
    }
    
    console.log(`쿼리 요청 시작: ${url}`, { 헤더포함여부: Object.keys(headers).length > 0 });
    
    const res = await fetch(url, {
      headers,
      credentials: "include", // 쿠키도 함께 사용
    });
    
    console.log(`쿼리 응답 (${url}):`, res.status);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      console.log("401 응답 처리: null 반환");
      return null;
    }

    try {
      await throwIfResNotOk(res);
      const data = await res.json();
      return data;
    } catch (error) {
      console.error(`쿼리 오류 (${url}):`, error);
      
      // 401 오류 처리
      if (res.status === 401 && window.location.pathname !== '/auth') {
        localStorage.removeItem('token');
        console.error("인증 오류로 인한 리디렉션");
        window.location.href = '/auth';
      }
      
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }), // 401 오류는 null 반환으로 처리하여 앱이 충돌하지 않게 함
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
