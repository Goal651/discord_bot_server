import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import type { Socket } from 'socket.io';
import { AuthPayload } from '../types';
import type { Request, Response, NextFunction } from 'express';
declare module 'socket.io' {
  interface SocketData {
    user?: AuthPayload;
    userId?: string;
    discordId?: string;
    permissions?: string[];
    [key: string]: unknown;
  }
}

export const authenticateSocket = async (socket: Socket, next: (err?: Error) => void) => {
  try {

    const token = socket.handshake.auth['token'];
    console.log()
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env['JWT_SECRET'] as string) as AuthPayload;
    console.log(decoded)
    // Validate required fields
    if (!decoded.username || !decoded.discord_id) {
      return next(new Error('Invalid token payload'));
    }

    // Attach user info to socket
    socket.data.user = decoded;
    socket.data.discordId = decoded.discord_id;
    // No userId or permissions in new AuthPayload
    console.log(`🔐 User ${decoded.username} (${decoded.discord_id}) authenticated`);
    next();

  } catch (error: unknown) {
    console.error('Authentication error:', error);

    if (error instanceof jwt.JsonWebTokenError) {
      return next(new Error('Invalid authentication token'));
    }

    if (error instanceof jwt.TokenExpiredError) {
      return next(new Error('Authentication token expired'));
    }

    return next(new Error('Authentication failed'));
  }
};

export const requirePermission = (permission: string) => {
  return (socket: Socket, next: (err?: Error) => void) => {
    try {
      const permissions = socket.data.permissions || [];

      if (!permissions.includes(permission) && !permissions.includes('admin')) {
        console.log(`🚫 Permission denied for user ${socket.data.userId}: ${permission} required`);
        return next(new Error(`Permission denied: ${permission} required`));
      }

      next();
    } catch (error: unknown) {
      console.error('Permission check error:', error);
      return next(new Error('Permission check failed'));
    }
  };
};

// Helper function to generate JWT token (for testing)
export const generateToken = (payload: AuthPayload): string => {
  const secret = process.env['JWT_SECRET'];
  console.log(secret)
  if (!secret) throw new Error('JWT_SECRET is not set');
  const options: SignOptions = {
    expiresIn: '7d'
  };
  return jwt.sign(
    payload as unknown as Record<string, unknown>,
    secret as Secret,
    options
  );
};

// Helper function to verify token (for HTTP endpoints)
export const verifyToken = (token: string): AuthPayload => {
  const secret = process.env['JWT_SECRET'];
  if (!secret) throw new Error('JWT_SECRET is not set');
  return jwt.verify(token, secret as jwt.Secret) as AuthPayload;
};

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ status: 'failed', message: 'No token provided', data: [] });
      return
    }
    const token = authHeader.split(' ')[1];
    const user = verifyToken(token!); // uses your existing helper
    req.user = user;
    next();
  } catch  {
    res.status(401).json({ status: 'failed', message: 'Invalid or expired token', data: [] });
    return
  }
}; 