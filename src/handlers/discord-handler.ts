import type { Socket, Namespace } from 'socket.io';
import { DiscordBot } from '../services/discord-bot';
import { logError} from '../middleware/error-handler';
import { GetChannelsResponse } from '../types';

interface JoinChannelResponse {
  success: boolean;
  channelId?: string;
  alreadyJoined?: boolean;
  error?: string;
}

interface LeaveChannelResponse {
  success: boolean;
  channelId?: string;
  error?: string;
}

export class DiscordHandler {
  private socket: Socket;
  private namespace: Namespace;
  private discordBot: DiscordBot;
  private joinedChannels: Set<string> = new Set();

  constructor(socket: Socket, namespace: Namespace) {
    this.socket = socket;
    this.namespace = namespace;
    this.discordBot = DiscordBot.getInstance();
  }

  setupEventHandlers() {
    // Connection events
    this.socket.on('disconnect', this.handleDisconnect.bind(this));

    // Channel management
    this.socket.on('get_channels', this.handleGetChannels.bind(this));
    this.socket.on('join_channel', this.handleJoinChannel.bind(this));
    this.socket.on('leave_channel', this.handleLeaveChannel.bind(this));

    // Message events

    // Error handling
    this.socket.on('error', this.handleError.bind(this));

    // Send initial data
    this.sendInitialData();
  }

  private async sendInitialData() {
    try {
      // Send available channels
      const channels = await this.discordBot.getUserChannels(this.socket.data.discordId);
      this.socket.emit('channels', channels);

      // Send user info
      this.socket.emit('user_info', {
        userId: this.socket.data.userId,
        username: this.socket.data.user.username,
        permissions: this.socket.data.permissions
      });

      console.log(`📋 Sent initial data to user ${this.socket.data.user.username}`);

    } catch (error) {
      logError(error as Error, 'sendInitialData', this.socket.data.userId);
      this.socket.emit('error', {
        code: 'INITIALIZATION_FAILED',
        message: 'Failed to load initial data',
        severity: 'HIGH'
      });
    }
  }

  private async handleGetChannels(callback?: (response: GetChannelsResponse) => void) {
    try {
      const channels = await this.discordBot.getUserChannels(this.socket.data.discordId);

      this.socket.emit('channels_list', channels);
      callback?.({ success: true, channels });

      console.log(`📋 Fetched ${channels.length} channels for user ${this.socket.data.user.username}`);

    } catch (error) {
      logError(error as Error, 'handleGetChannels', this.socket.data.userId);

      const errorResponse = {
        success: false,
        error: 'Failed to fetch channels',
        channels:[]
      };

      callback?.(errorResponse);
      this.socket.emit('error', {
        code: 'CHANNELS_FETCH_FAILED',
        message: 'Unable to fetch channels',
        severity: 'MEDIUM'
      });
    }
  }

  private async handleJoinChannel(
    data: { channelId: string },
    callback?: (response: JoinChannelResponse) => void
  ) {
    try {
      const { channelId } = data;
      if (this.joinedChannels.has(channelId)) {
        callback?.({ success: true, channelId, alreadyJoined: true });
        return;
      }

      const channelInfo = await this.discordBot.getChannelInfo(channelId);

      await this.socket.join(`channel:${channelId}`);
      this.joinedChannels.add(channelId);

      await this.discordBot.subscribeToChannel(channelId, this.socket.data.discordId);
      this.socket.emit('channels', {
        id: channelId,
        name: channelInfo.name,
        type: 'text',
        serverId: channelInfo.serverId,
        serverName: channelInfo.serverName,
        position: 0,
        unreadCount: 0,
        isActive: true,
        permissions: {
          canRead: true,
          canWrite: true,
          canManage: false
        }
      });

      callback?.({ success: true, channelId });
      console.log(`👥 User ${this.socket.data.user.username} joined channel ${channelId}`);
    } catch (error) {
      logError(error as Error, 'handleJoinChannel', this.socket.data.userId);
      console.error('Error joining channel:', error);
      callback?.({
        success: false,
        error: 'Failed to join channel'
      });
    }
  }

  private async handleLeaveChannel(
    data: { channelId: string },
    callback?: (response: LeaveChannelResponse) => void
  ) {
    try {
      const { channelId } = data;

      await this.socket.leave(`channel:${channelId}`);

      this.joinedChannels.delete(channelId);

      await this.discordBot.unsubscribeFromChannel(channelId, this.socket.data.discordId);

      callback?.({ success: true, channelId });
      console.log(`👋 User ${this.socket.data.user.username} left channel ${channelId}`);
    } catch (error) {
      logError(error as Error, 'handleLeaveChannel', this.socket.data.userId);
      console.error('Error leaving channel:', error);
      callback?.({
        success: false,
        error: 'Failed to leave channel'
      });
    }
  }

  private handleError(error: unknown) {
    logError(error as Error, 'socketError', this.socket.data.userId);
    console.error('Socket error:', error);

    this.socket.emit('error', {
      code: 'CLIENT_ERROR',
      message: 'An error occurred',
      severity: 'MEDIUM'
    });
  }

  private async handleDisconnect(reason: string) {
    console.log(`🔌 User ${this.socket.data.user.username} disconnected: ${reason}`);

    // Clean up subscriptions
    for (const channelId of this.joinedChannels) {
      await this.discordBot.unsubscribeFromChannel(channelId, this.socket.data.discordId);

      // Notify other users
      this.socket.to(`channel:${channelId}`).emit('user_left', {
        channelId,
        user: {
          id: this.socket.data.userId,
          username: this.socket.data.user.username
        }
      });
    }

    this.joinedChannels.clear();
  }

} 