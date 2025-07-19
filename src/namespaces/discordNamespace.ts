import type { Namespace } from 'socket.io'
import { authenticateSocket } from '../middleware/discordAuth'
import { DiscordSocketHandler } from '../handlers/discordSocketHandler'
import { DiscordBot } from '../services/discordBot.service'

export const setupDiscordNamespace = (discordNamespace:Namespace,discordBot:DiscordBot) => {

  // Authentication middleware
  discordNamespace.use(authenticateSocket)

  // Connection handler
  discordNamespace.on('connection', (socket) => {

    console.log(`🔗 User ${socket.data.user.username} connected to Discord namespace`)

    // Initialize Discord handler
    const handler = new DiscordSocketHandler(socket, discordBot)
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