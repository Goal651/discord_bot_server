import type { Socket } from 'socket.io'

export const errorHandler = (socket: Socket) => {
  // Handle socket errors
  socket.on('error', (error) => {
    console.error(`Socket error for user ${socket.data.userId || 'unknown'}:`, error)
    
    socket.emit('error', {
      code: 'SOCKET_ERROR',
      message: 'An unexpected error occurred',
      severity: 'MEDIUM'
    })
  })

  // Handle uncaught exceptions in socket handlers
  const originalEmit = socket.emit
  socket.emit = function(event: string, ...args: unknown[]) {
    try {
      return originalEmit.call(this, event, ...args)
    } catch (error) {
      console.error(`Error emitting ${event}:`, error)
      socket.emit('error', {
        code: 'EMIT_ERROR',
        message: 'Failed to send data',
        severity: 'HIGH'
      })
      return false
    }
  }

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`User ${socket.data.userId || 'unknown'} disconnected: ${reason}`)
    
    // Clean up any resources
    if (socket.data.joinedChannels) {
      socket.data.joinedChannels.clear()
    }
  })

  // Handle reconnection attempts
  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log(`User ${socket.data.userId || 'unknown'} attempting to reconnect (attempt ${attemptNumber})`)
  })

  // Handle successful reconnection
  socket.on('reconnect', (attemptNumber) => {
    console.log(`User ${socket.data.userId || 'unknown'} reconnected after ${attemptNumber} attempts`)
  })

  // Handle reconnection failure
  socket.on('reconnect_failed', () => {
    console.log(`User ${socket.data.userId || 'unknown'} failed to reconnect`)
  })
}

// Global error handler for uncaught exceptions
export const setupGlobalErrorHandlers = () => {
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error)
    process.exit(1)
  })

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason)
    process.exit(1)
  })

  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully')
    process.exit(0)
  })

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully')
    process.exit(0)
  })
}

// Error logging utility
export const logError = (error: Error, context: string, userId?: string) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    context,
    userId,
    timestamp: new Date().toISOString(),
    processId: process.pid
  }

  console.error('Application Error:', errorInfo)
}

// Error response formatter
export const formatErrorResponse = (error: Error, code: string = 'UNKNOWN_ERROR'): {
  code: string
  message: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
} => {
  return {
    code,
    message: error.message || 'An unexpected error occurred',
    severity: 'MEDIUM'
  }
} 