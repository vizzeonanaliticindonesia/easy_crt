import { getToken as getStorageToken } from './storage';
// const BASE_URL = 'http://teacher_relief.test:80/api';
// const BASE_URL = 'http://teacher_relief.test/api'; //cek ipconfig untuk dapatkan IP komputer
const BASE_URL = 'https://teacher-relief.vizzeon.com/api'; //cek ipconfig untuk dapatkan IP komputer

let authToken: string | null = null;

/**
 * SET TOKEN (login)
 */
export function setAuthToken(token: string | null) {
  authToken = token;
}

/**
 * BUILD URL
 */
function buildUrl(path: string) {
  return `${BASE_URL}${path}`;
}

/**
 * CORE REQUEST
 */
async function request<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  // console.log('PATH MASUK:', path);
  // throw new Error('TRACE ' + path);
  try {
    const token = authToken;
console.log('AUTH TOKEN:', authToken);
console.log('STORAGE TOKEN:', await getStorageToken());

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let body = options.body;

    /**
     * HANDLE BODY JSON
     */
    if (body && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';

      if (typeof body !== 'string') {
        body = JSON.stringify(body);
      }
    }

    const res = await fetch(buildUrl(path), {
      ...options,
      headers,
      body,
    });

    /**
     * SAFE PARSE RESPONSE
     */
    let data: any = null;

    const contentType = res.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    /**
     * HANDLE ERROR HTTP
     */
    if (!res.ok) {
      throw {
        status: res.status,
        message: data?.message || 'Request failed',
        data,
      };
    }

    return data;
  } catch (error: any) {
    /**
     * HANDLE NETWORK ERROR (RN sering kena ini)
     */
    if (error.message === 'Network request failed') {
      throw {
        status: 0,
        message: 'Tidak bisa terhubung ke server',
      };
    }

    throw error;
  }
}

/**
 * =========================
 * METHODS
 * =========================
 */

export const api = {
  get: <T = any>(path: string, params?: Record<string, any>) => {
    const query = params
      ? '?' + new URLSearchParams(params as any).toString()
      : '';

    return request<T>(`${path}${query}`, {
      method: 'GET',
    });
  },

  post: <T = any>(path: string, body?: any) => {
    return request<T>(path, {
      method: 'POST',
      body,
    });
  },

  put: <T = any>(path: string, body?: any) => {
    return request<T>(path, {
      method: 'PUT',
      body,
    });
  },

  patch: <T = any>(path: string, body?: any) => {
    return request<T>(path, {
      method: 'PATCH',
      body,
    });
  },

  del: <T = any>(path: string) => {
    return request<T>(path, {
      method: 'DELETE',
    });
  },
};

export default api;

function getToken(): any {
  throw new Error("Function not implemented.");
}
