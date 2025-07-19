jest.setTimeout(30000); // 30 seconds
import { createServer, Server as HttpServer } from "http";
import Client, { Socket as ClientSocket } from "socket.io-client";
import { Server } from "socket.io";
import { setupDiscordNamespace } from "../src/namespaces/discordNamespace";
import { generateToken } from "../src/middleware/discordAuth";
import { DiscordBot } from "../src/services/discordBot.service";
import { DiscordChannel, GetChannelsResponse, LeaveChannelResponse } from "../src/types";

const TEST_USER = {
  discord_id: process.env['DISCORD_CLIENT_ID'] || '',
  username: 'wilsongoal_35900',
  email: 'bugiriwilson651@gmail.com',
  is_bot: false,
  created_at: '',
  updated_at: ''
};
const GENERAL_CHANNEL_ID = process.env['DISCORD_GENERAL_CHANNEL']

describe('Discord Socket.IO Server ', () => {
  let io: Server;
  let clientSocket: ClientSocket;
  let httpServer: HttpServer;
  let port: number;

  beforeAll(async () => {
    try {

      httpServer = createServer();
      io = new Server(httpServer);
      const discordNamespace = io.of('/discord')
      // Initialize Discord bot with the real io instance
      const discordBot = new DiscordBot(discordNamespace)
      const botToken = process.env['DISCORD_BOT_TOKEN'];
      if (!botToken) {
        console.warn('⚠️  No Discord bot token provided. Bot functionality will be disabled.');
      } else {
        await discordBot.initialize(botToken);
        console.log('✅ Discord bot initialized');
      }
      setupDiscordNamespace(discordNamespace, discordBot);
      const token = generateToken(TEST_USER);
      await new Promise<void>(resolve => {
        httpServer.listen(() => {
          const address = httpServer.address();
          if (address && typeof address === 'object') {
            port = address.port;
          }
          clientSocket = Client(`http://localhost:${port}/discord`, {
            auth: { token }
          });
          clientSocket.on('connect', resolve);
        });
      });
    } catch (err) {
      console.error('beforeAll error', err)
    }
  });

  afterAll(() => {
    io.close();
    clientSocket.disconnect();
    httpServer.close();
  });

  test('should get channels and include general', (done) => {
    clientSocket.emit('get_channels', (response: GetChannelsResponse) => {
      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      // Check that general is in the list
      const found = response.channels.some((ch: DiscordChannel) => ch.id === GENERAL_CHANNEL_ID);
      expect(found).toBe(true);
      done();
    });
  });

  test('should join general channel', (done) => {
    clientSocket.emit('join_channel', { channelId: GENERAL_CHANNEL_ID }, (response: LeaveChannelResponse) => {
      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.channelId).toBe(GENERAL_CHANNEL_ID);
      done();
    });
  });

  test('should leave general channel', (done) => {
    clientSocket.emit('leave_channel', { channelId: GENERAL_CHANNEL_ID }, (response: LeaveChannelResponse) => {
      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.channelId).toBe(GENERAL_CHANNEL_ID);
      done()
    })
  })
});