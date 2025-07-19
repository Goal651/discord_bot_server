import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import type { Socket } from 'socket.io';
import { AuthPayload } from '../types';

//Authenticating web socket connections
export const authenticateSocket = async (socket: Socket, next: (err?: Error) => void) => {
  try {

    const token = socket.handshake.auth['token'];

    if (!token) return next(new Error('Authentication token required'));

    // Verify JWT token
    const decoded = jwt.verify(token, process.env['JWT_SECRET'] as string) as AuthPayload;
    console.log(decoded)
    // Validate required fields
    if (!decoded.username || !decoded.discord_id) return next(new Error('Invalid token payload'));


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



// Helper function to generate JWT token (for testing)
export const generateToken = (payload: AuthPayload): string => {
  const secret = process.env['JWT_SECRET'];
  if (!secret) throw new Error('JWT_SECRET is not set');
  const options: SignOptions = { expiresIn: '7d' };
  return jwt.sign(
    payload as unknown as Record<string, unknown>,
    secret as Secret,
    options
  );
};
