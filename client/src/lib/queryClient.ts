import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// 로컬 스토리지에서 토큰 가져오기
function getAuthToken(): string | null {
  const token = localStorage.getItem('token');
  console.log("API 호출 시 토큰 상태:", token ? "토큰 있음" : "토큰 없음");
  return token;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // 기본 헤더 설정
  const headers: HeadersInit = {
    ...(data ? { "Content-Type": "application/json" } : {}),
  };
  
  // 인증 토큰이 있으면 헤더에 추가
  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    console.log("요청에 인증 헤더 추가됨:", url);
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include", // 쿠키도 함께 사용
  });

  if (!res.ok) {
    console.error(`API 오류 (${method} ${url}):`, res.status, res.statusText);
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
    }
    
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
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
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
