import type { Namespace } from 'socket.io'
import { authenticateSocket } from '../middleware/auth'
import { DiscordHandler } from '../handlers/discord-handler'
import { DiscordBot } from '../services/discord-bot'

export const setupDiscordNamespace = (discordNamespace:Namespace,discordBot:DiscordBot) => {

  // Authentication middleware
  discordNamespace.use(authenticateSocket)

  // Connection handler
  discordNamespace.on('connection', (socket) => {

    console.log(`🔗 User ${socket.data.user.username} connected to Discord namespace`)

    // Initialize Discord handler
    const handler = new DiscordHandler(socket, discordBot)
    handler.setupEventHandlers()

    // Log connection stats
    const stats = {
      totalConnections: discordNamespace.sockets.size,
      userId: socket.data.user?.discord_id,
      username: socket.data.user?.username
    }

    console.log(`📊 Discord namespace stats:`, stats)
  })

  // Handle namespace errors
  discordNamespace.on('error', (error) => {
    console.error('Discord namespace error:', error)
  })

  return discordNamespace
} 