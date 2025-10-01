import jwt from 'jsonwebtoken';

export interface SessionCookie {
  providerName: string;
  name: string;
  uuid: string;
  refreshToken: string;
  expiresAt: number;
  issuedAt: number;
}

class TokenUtility {
  private jwtSecret: string;

  constructor() {
    this.jwtSecret = '';
  }

  initialize(jwtSecret: string) {
    this.jwtSecret = jwtSecret;
  }

  private signJWTToken(session: Record<string, unknown>): string {
    return jwt.sign(session, this.jwtSecret);
  }

  private verifyJwtToken(token: string): null | Record<string, unknown> {
    try {
      const payload = jwt.verify(token, this.jwtSecret);
      if (!payload) return null;
      if (typeof payload === 'object' && payload !== null) {
        return payload as Record<string, unknown>;
      }
      return null;
    } catch (error) {
      console.error('JWT verification error');
      return null;
    }
  }

  private decodeJWTToken(idToken: string) {
    return jwt.decode(idToken) as Record<string, unknown> | null;
  }

  verifySessionToken(token: string | undefined): null | SessionCookie {
    if (!token) return null;

    const sessionCookie = this.verifyJwtToken(token) as SessionCookie | null;

    if (
      !sessionCookie ||
      !sessionCookie.providerName ||
      !sessionCookie.name ||
      !sessionCookie.uuid ||
      !sessionCookie.refreshToken
    ) {
      console.error('Invalid or missing session cookie', sessionCookie);
      return null;
    }

    // Check if the session has expired
    if (sessionCookie.expiresAt && sessionCookie.expiresAt < Date.now()) {
      console.error('Session cookie has expired', sessionCookie);
      return null;
    }

    return sessionCookie;
  }

  generateSessionToken(session: SessionCookie): string {
    return this.signJWTToken(session as unknown as Record<string, unknown>);
  }

  decodeIdToken(idToken: string): null | Record<string, unknown> {
    return this.decodeJWTToken(idToken);
  }
}

export default new TokenUtility();
