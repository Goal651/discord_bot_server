declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

// Core message types
export interface DiscordMessage {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    displayName?: string;
    avatar?: string;
    bot: boolean;
  };
  timestamp: string; // ISO8601
  channelId: string;
  serverId: string;
  attachments: DiscordAttachment[];
  embeds: DiscordEmbed[];
  reactions: DiscordReaction[];
  edited: boolean;
  editedTimestamp?: string;
}

export interface DiscordAttachment {
  id: string;
  filename: string;
  url: string;
  proxyUrl: string;
  size: number;
  contentType?: string;
  width?: number;
  height?: number;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  thumbnail?: { url: string };
  image?: { url: string };
  author?: {
    name: string;
    iconUrl?: string;
  };
  fields: Array<{
    name: string;
    value: string;
    inline: boolean;
  }>;
}

export interface DiscordReaction {
  emoji: string;
  count: number;
  users: string[];
}

// Channel types
export interface DiscordChannel {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'category';
  serverId: string;
  serverName: string;
  position: number;
  unreadCount: number;
  isActive: boolean;
  permissions: {
    canRead: boolean;
    canWrite: boolean;
    canManage: boolean;
  };
}

// User types
export interface AuthPayload {
  discord_id: string;
  username: string;
  email: string;
  is_bot: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserInfo {
  userId: string;
  username: string;
  permissions: string[];
}

// Socket.IO event types
export interface SocketEvents {
  // Client to Server
  'get_channels': (callback?: (response: any) => void) => void;
  'join_channel': (data: { channelId: string }, callback?: (response: any) => void) => void;
  'leave_channel': (data: { channelId: string }, callback?: (response: any) => void) => void;
  'request_history': (data: { channelId: string; before?: string; limit?: number }, callback?: (response: any) => void) => void;
  'send_message': (data: { channelId: string; content: string }, callback?: (response: any) => void) => void;
  'typing': (data: { channelId: string }) => void;
  
  // Server to Client
  'channels_list': (channels: DiscordChannel[]) => void;
  'user_info': (userInfo: UserInfo) => void;
  'message': (message: DiscordMessage) => void;
  'message_update': (message: DiscordMessage) => void;
  'message_delete': (data: { messageId: string; channelId: string }) => void;
  'messages_bulk': (data: { channelId: string; messages: DiscordMessage[]; hasMore?: boolean; nextCursor?: string }) => void;
  'channel_update': (channel: DiscordChannel) => void;
  'user_joined': (data: { channelId: string; user: { id: string; username: string } }) => void;
  'user_left': (data: { channelId: string; user: { id: string; username: string } }) => void;
  'typing_start': (data: { channelId: string; userId: string; username: string }) => void;
  'typing_stop': (data: { channelId: string; userId: string }) => void;
  'error': (error: { code: string; message: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' }) => void;
  'rate_limited': (data: { message: string; retryAfter: number }) => void;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type ApiResult<T = any> = {
  status: 'succeed' | 'failed';
  data?: T;
  message?: string;
};

// Rate limiting types
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

// Database types
export interface DatabaseMessage {
  id: string;
  discord_id: string;
  content: string;
  author_discord_id: string;
  channel_id: string;
  server_id: string;
  attachments: string; // JSON string
  embeds: string; // JSON string
  reactions: string; // JSON string
  created_at: Date;
  edited_at?: Date;
  edited: boolean;
}

export interface DatabaseUser {
  discord_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  is_bot: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface DatabaseChannel {
  id: string;
  discord_id: string;
  name: string;
  type: string;
  server_id: string;
  position: number;
  created_at: Date;
  updated_at: Date;
}

// Error types
export interface AppError extends Error {
  code: string;
  statusCode: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  isOperational: boolean;
}

// Health check types
export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  connections: {
    total: number;
    discord: number;
  };
  memory: {
    used: string;
    total: string;
  };
  environment: string;
}

export interface Metrics {
  connections: {
    total: number;
    discord: number;
  };
  rooms: {
    total: number;
    channels: number;
    activeChannels: Array<{
      channelId: string;
      userCount: number;
    }>;
  };
  performance: {
    eventLoopDelay: bigint;
    cpuUsage: NodeJS.CpuUsage;
  };
} 