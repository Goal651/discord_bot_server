import { Client, GatewayIntentBits, type Message, type TextChannel } from 'discord.js';
import type { Server } from 'socket.io';
import { DiscordMessage } from '../types';

export class DiscordBot {
  private static instance: DiscordBot;
  private client: Client;
  private io: Server | null = null;
  private channelSubscriptions: Map<string, Set<string>> = new Map(); // channelId -> userIds

  private constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
      ]
    });

    this.setupEventHandlers();
  }

  static getInstance(): DiscordBot {
    if (!DiscordBot.instance) {
      DiscordBot.instance = new DiscordBot();
    }
    return DiscordBot.instance;
  }

  async initialize(token: string, io: Server) {
    this.io = io;

    try {
      await this.client.login(token);
      console.log('✅ Discord bot connected');
    } catch (error) {
      console.error('❌ Failed to connect Discord bot:', error);
      throw error;
    }
  }

  private setupEventHandlers() {
    this.client.on('ready', () => {
      console.log(`🤖 Discord bot logged in as ${this.client.user?.tag}`);
      console.log(`📊 Connected to ${this.client.guilds.cache.size} guilds`);
    });

    this.client.on('messageCreate', (message: Message) => {
      this.handleNewMessage(message);
    });

    

    this.client.on('messageUpdate', (oldMessage, newMessage) => {
      if (newMessage.partial) return;
      this.handleMessageUpdate(newMessage as Message);
    });

    this.client.on('messageDelete', (message) => {
      this.handleMessageDelete(message);
    });

    this.client.on('error', (error) => {
      console.error('Discord client error:', error);
    });

    this.client.on('disconnect', () => {
      console.log('🔌 Discord bot disconnected');
    });

    this.client.on('reconnecting', () => {
      console.log('🔄 Discord bot reconnecting...');
    });
  }

  private async handleNewMessage(message: Message) {
    if (message.author.bot) return;

    const channelId = message.channel.id;
    const subscribers = this.channelSubscriptions.get(channelId);

    if (!subscribers || subscribers.size === 0) return;

    try {
      const formattedMessage = await this.formatMessage(message);
      console.log('📨 Formatted message to emit:', formattedMessage);
      this.io?.of('/discord').to(`channel:${channelId}`).emit('message', formattedMessage);
      console.log(`📨 Message from ${message.author.username} in #${(message.channel as TextChannel).name}`);
    } catch (error) {
      console.error('Error handling new message:', error);
    }
  }

  private async handleMessageUpdate(message: Message) {
    if (message.author.bot) return;

    try {
      const formattedMessage = await this.formatMessage(message);
      formattedMessage.edited = true;
      formattedMessage.editedTimestamp = message.editedAt?.toISOString() || '';

      // Broadcast update
      this.io?.of('/discord').to(`channel:${message.channel.id}`).emit('message_update', formattedMessage);

    } catch (error) {
      console.error('Error handling message update:', error);
    }
  }

  private async handleMessageDelete(message: any) {
    try {

      // Broadcast deletion
      this.io?.of('/discord').to(`channel:${message.channel.id}`).emit('message_delete', {
        messageId: message.id,
        channelId: message.channel.id
      });

    } catch (error) {
      console.error('Error handling message delete:', error);
    }
  }

  private async formatMessage(message: Message): Promise<DiscordMessage> {
    return {
      id: message.id,
      content: message.content,
      author: {
        id: message.author.id,
        username: message.author.username,
        displayName: message.author.displayName || message.author.username,
        avatar: message.author.displayAvatarURL(),
        bot: message.author.bot
      },
      timestamp: message.createdAt.toISOString(),
      channelId: message.channel.id,
      serverId: message.guild?.id || '',
      attachments: message.attachments.map(att => ({
        id: att.id,
        filename: att.name || 'unknown',
        url: att.url,
        proxyUrl: att.proxyURL,
        size: att.size,
        contentType: att.contentType || '',
        width: att.width || 0,
        height: att.height || 0
      })),
      embeds: message.embeds.map(embed => ({
        title: embed.title || '',
        description: embed.description || '',
        url: embed.url || '',
        color: embed.color ?? 0,
        thumbnail: embed.thumbnail ? { url: embed.thumbnail.url } : { url: '' },
        image: embed.image ? { url: embed.image.url } : { url: '' },
        author: embed.author
          ? {
              name: embed.author.name,
              ...(embed.author.iconURL ? { iconUrl: embed.author.iconURL } : {})
            }
          : { name: '' },
        fields: embed.fields?.map(field => ({
          name: field.name,
          value: field.value,
          inline: typeof field.inline === 'boolean' ? field.inline : false
        })) || []
      })),
      reactions: message.reactions.cache.map(reaction => ({
        emoji: reaction.emoji.name || reaction.emoji.toString(),
        count: reaction.count,
        users: [] // Could fetch users if needed
      })),
      edited: false,
      editedTimestamp: ''
    };
  }


  async subscribeToChannel(channelId: string, userId: string) {
    if (!this.channelSubscriptions.has(channelId)) {
      this.channelSubscriptions.set(channelId, new Set());
    }

    this.channelSubscriptions.get(channelId)!.add(userId);
    console.log(`👥 User ${userId} subscribed to channel ${channelId}`);
  }

  async unsubscribeFromChannel(channelId: string, userId: string) {
    const subscribers = this.channelSubscriptions.get(channelId);
    if (subscribers) {
      subscribers.delete(userId);

      // Clean up empty subscriptions
      if (subscribers.size === 0) {
        this.channelSubscriptions.delete(channelId);
      }

      console.log(`👋 User ${userId} unsubscribed from channel ${channelId}`);
    }
  }

  async sendMessage(channelId: string, content: string, userId: string) {
    try {
      const channel = await this.client.channels.fetch(channelId);

      if (!channel || !channel.isTextBased?.() || !('send' in channel)) {
        throw new Error('Channel not found or not text-based');
      }

      const message = await (channel as TextChannel).send(content);

      return {
        id: message.id,
        content: message.content,
        timestamp: message.createdAt.toISOString()
      };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async getChannelInfo(channelId: string) {
    try {
      const channel = await this.client.channels.fetch(channelId);

      if (!channel || !channel.isTextBased?.()) {
        throw new Error('Channel not found or not text-based');
      }

      return {
        id: channel.id,
        name: 'name' in channel ? channel.name : '',
        type: channel.type,
        serverId: 'guild' in channel && channel.guild ? channel.guild.id : '',
        serverName: 'guild' in channel && channel.guild ? channel.guild.name : ''
      };
    } catch (error) {
      console.error('Error getting channel info:', error);
      throw error;
    }
  }

  async getUserChannels(userId: string) {
    try {
      const channels: any[] = [];

      for (const guild of this.client.guilds.cache.values()) {
        const member = await guild.members.fetch(userId).catch(() => null);

        if (member) {
          const textChannels = guild.channels.cache.filter(channel =>
            channel.isTextBased?.() && channel.type === 0 && channel.permissionsFor(member).has('ViewChannel')
          );

          for (const channel of textChannels.values()) {
            channels.push({
              id: channel.id,
              name: 'name' in channel ? channel.name : '',
              type: 'text',
              serverId: guild.id,
              serverName: guild.name,
              position: 'position' in channel && typeof channel.position === 'number' ? channel.position : 0,
              unreadCount: 0,
              isActive: false,
              permissions: {
                canRead: channel.permissionsFor(member).has('ViewChannel'),
                canWrite: channel.permissionsFor(member).has('SendMessages'),
                canManage: channel.permissionsFor(member).has('ManageChannels')
              }
            });
          }
        }
      }

      return channels;
    } catch (error) {
      console.error('Error getting user channels:', error);
      return [];
    }
  }

  getSubscriptionStats() {
    const stats = {
      totalChannels: this.channelSubscriptions.size,
      totalSubscribers: 0,
      channelDetails: [] as Array<{ channelId: string; subscriberCount: number }>
    };

    for (const [channelId, subscribers] of this.channelSubscriptions.entries()) {
      stats.totalSubscribers += subscribers.size;
      stats.channelDetails.push({
        channelId,
        subscriberCount: subscribers.size
      });
    }

    return stats;
  }
} 