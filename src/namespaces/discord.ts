import type { Server } from 'socket.io'
import { authenticateSocket } from '../middleware/auth'
import { DiscordHandler } from '../handlers/discord-handler'

export const setupDiscordNamespace = (io: Server) => {
  const discordNamespace = io.of('/discord')

  // Authentication middleware
  discordNamespace.use(authenticateSocket)

  // Connection handler
  discordNamespace.on('connection', (socket) => {
    console.log(`🔗 User ${socket.data.user.username} connected to Discord namespace`)

    // Initialize Discord handler
    const handler = new DiscordHandler(socket, discordNamespace)
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