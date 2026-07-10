/**
 * A cookie-preserving HTTP client wrapping the built-in fetch.
 * Emulates an agent (like supertest.agent) for session and authentication testing.
 */
export class TestClient {
  private cookies: Map<string, string> = new Map();
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get all stored cookies as a Map.
   */
  getCookies(): Map<string, string> {
    return this.cookies;
  }

  /**
   * Get a specific cookie value.
   */
  getCookie(name: string): string | undefined {
    return this.cookies.get(name);
  }

  /**
   * Manually set a cookie value.
   */
  setCookie(name: string, value: string): void {
    this.cookies.set(name, value);
  }

  /**
   * Clear all cookies.
   */
  clearCookies(): void {
    this.cookies.clear();
  }

  /**
   * Make a generic HTTP request, automatically managing cookies.
   */
  async request(path: string, options: RequestInit = {}): Promise<Response> {
    const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`;
    const headers = new Headers(options.headers || {});

    // Attach stored cookies to the Cookie header
    if (this.cookies.size > 0) {
      const cookieHeaderValue = Array.from(this.cookies.entries())
        .map(([name, value]) => `${name}=${value}`)
        .join('; ');
      headers.set('Cookie', cookieHeaderValue);
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    // Extract Set-Cookie headers from the response
    const setCookieHeaders: string[] = [];
    if (typeof response.headers.getSetCookie === 'function') {
      setCookieHeaders.push(...response.headers.getSetCookie());
    } else {
      const rawCookie = response.headers.get('set-cookie');
      if (rawCookie) {
        setCookieHeaders.push(...this.splitCookiesString(rawCookie));
      }
    }

    // Parse and store cookies
    for (const cookieStr of setCookieHeaders) {
      const firstPart = cookieStr.split(';')[0].trim();
      const eqIdx = firstPart.indexOf('=');
      if (eqIdx !== -1) {
        const name = firstPart.substring(0, eqIdx).trim();
        const value = firstPart.substring(eqIdx + 1).trim();
        if (name) {
          this.cookies.set(name, value);
        }
      }
    }

    return response;
  }

  /**
   * Perform a GET request.
   */
  async get(path: string, options?: Omit<RequestInit, 'method'>): Promise<Response> {
    return this.request(path, { ...options, method: 'GET' });
  }

  /**
   * Perform a POST request.
   */
  async post(path: string, body?: any, options?: Omit<RequestInit, 'method' | 'body'>): Promise<Response> {
    const headers = new Headers(options?.headers || {});
    let requestBody: any = body;
    if (body && typeof body === 'object') {
      if (!headers.has('content-type')) {
        headers.set('content-type', 'application/json');
      }
      requestBody = JSON.stringify(body);
    }
    return this.request(path, {
      ...options,
      method: 'POST',
      body: requestBody,
      headers
    });
  }

  /**
   * Perform a PUT request.
   */
  async put(path: string, body?: any, options?: Omit<RequestInit, 'method' | 'body'>): Promise<Response> {
    const headers = new Headers(options?.headers || {});
    let requestBody: any = body;
    if (body && typeof body === 'object') {
      if (!headers.has('content-type')) {
        headers.set('content-type', 'application/json');
      }
      requestBody = JSON.stringify(body);
    }
    return this.request(path, {
      ...options,
      method: 'PUT',
      body: requestBody,
      headers
    });
  }

  /**
   * Perform a DELETE request.
   */
  async delete(path: string, options?: Omit<RequestInit, 'method'>): Promise<Response> {
    return this.request(path, { ...options, method: 'DELETE' });
  }

  /**
   * Helper to split a joined Set-Cookie string.
   */
  private splitCookiesString(cookiesString: string): string[] {
    if (typeof cookiesString !== 'string') {
      return [];
    }

    const cookiesStrings: string[] = [];
    let pos = 0;
    let start = 0;

    while (pos < cookiesString.length) {
      const ch = cookiesString.charAt(pos);
      if (ch === ',') {
        const nextEquals = cookiesString.indexOf('=', pos);
        const nextSemi = cookiesString.indexOf(';', pos);

        let isCookieStart = false;
        if (nextEquals !== -1) {
          if (nextSemi === -1 || nextEquals < nextSemi) {
            isCookieStart = true;
          }
        }

        if (isCookieStart) {
          cookiesStrings.push(cookiesString.substring(start, pos).trim());
          start = pos + 1;
        }
      }
      pos++;
    }

    if (start < cookiesString.length) {
      cookiesStrings.push(cookiesString.substring(start).trim());
    }

    return cookiesStrings;
  }
}
