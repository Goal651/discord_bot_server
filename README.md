# Discord Stream Backend

> **Note:** This project was built as part of the Railway Senior Full-Stack Engineer - Support application. The assignment: "Build a Discord bot that streams messages from a Discord channel into a web front-end, with a backend component."

A robust Socket.IO backend for real-time Discord message streaming with authentication, rate limiting, and comprehensive error handling.

## Features

- 🔐 **JWT Authentication** - Secure user authentication with token-based sessions
- 📡 **Socket.IO Integration** - Real-time bidirectional communication
- 🤖 **Discord Bot Integration** - Seamless Discord API integration
- 🏥 **Health Monitoring** - Comprehensive health checks and metrics
- 🔒 **Security** - Helmet.js security headers and CORS protection
- 📊 **Metrics** - Real-time connection and performance metrics
- 🛡️ **Error Handling** - Comprehensive error handling and logging

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Web Framework**: Express.js
- **Real-time**: Socket.IO
- **Discord**: discord.js library
- **Security**: Helmet.js, CORS, JWT
- **Monitoring**: Custom health checks and metrics

## Quick Start

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- Redis 6.0+
- Discord Bot Token

### Installation

1. **Clone and install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Start the server:**

   ```bash
   # Development
   npm run dev
   
   # Production
   npm run build
   npm start
   ```

## API Endpoints

### Health Checks

- `GET /api/health` - Server health status
- `GET /api/metrics` - Real-time metrics
- `GET /api/status` - Detailed server status
- `GET /api/ready` - Load balancer readiness
- `GET /api/live` - Liveness probe

### Socket.IO Events

#### Client to Server

- `get_channels` - Fetch user's available channels
- `join_channel` - Join a Discord channel
- `leave_channel` - Leave a Discord channel

#### Server to Client

- `channels_list` - Available channels
- `user_info` - User information
- `message` - New message received
- `message_update` - Message edited
- `message_delete` - Message deleted
- `messages_bulk` - Message history
- `channel_update` - Channel information
- `error` - Error notification
- `rate_limited` - Rate limit exceeded

### Example Payloads

#### `message` (Server → Client)

```json
{
  "id": "123456789",
  "content": "Hello, world!",
  "author": {
    "id": "987654321",
    "username": "Alice"
  },
  "timestamp": "2024-01-01T12:00:00.000Z",
  "channelId": "123456789",
  "serverId": "111222333"
}
```

#### `join_channel` (Client → Server)

```json
{
  "channelId": "123456789"
}
```

#### `channels_list` (Server → Client)

```json
[
  {
    "id": "123456789",
    "name": "general",
    "type": "text",
    "serverId": "111222333"
  }
]
```

This repository contains only the backend service. The frontend should connect to the backend via Socket.IO, authenticate with a JWT, and display messages in real time. If you need a reference implementation, see [https://discord-bot.vercel.app](https://discord-bot.vercel.app) (replace with your actual repo if available).

## Development

### Scripts

```bash
# Development
npm run dev          # Start with nodemon
npm run build        # Build TypeScript
npm start           # Start production server
npm test            # Run tests
npm run lint        # Lint code
npm run lint:fix    # Fix linting issues
```

### Project Structure

```cmd
backend/
├── src/
│   ├── handlers/          # Socket.IO event handlers
│   ├── middleware/        # Authentication & error handling
│   ├── namespaces/        # Socket.IO namespace setup
│   ├── routes/           # HTTP API routes
│   ├── services/         # Business logic services
│   ├── utils/            # Database, rate limiting utilities
│   ├── types.ts          # TypeScript type definitions
│   └── server.ts         # Main server file
├── tests/               # Test files
├── package.json
├── tsconfig.json
├── env.example
└── README.md
```

## Monitoring

### Health Check Response

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600,
  "connections": {
    "total": 150,
    "discord": 45
  },
  "memory": {
    "used": "45MB",
    "total": "128MB"
  },
  "environment": "production"
}
```

### Metrics Response

```json
{
  "connections": {
    "total": 150,
    "discord": 45
  },
  "rooms": {
    "total": 25,
    "channels": 15,
    "activeChannels": [
      {
        "channelId": "123456789",
        "userCount": 5
      }
    ]
  },
  "performance": {
    "eventLoopDelay": 123456789n,
    "cpuUsage": {
      "user": 123456,
      "system": 789012
    }
  }
}
```

## Testing

This project includes unit tests for authentication, message handling, and error handling. To run tests:

```bash
npm test
```

## Design Decisions

- **Socket.IO** is used for real-time streaming and channel-based rooms, allowing efficient message delivery to only those users who have joined a channel.
- **JWT** provides secure, stateless authentication for all socket connections.
- **Modular code structure** makes it easy to extend the backend with new features, events, or integrations.
- **Health and metrics endpoints** are included for easy deployment monitoring and observability.

## Deployment

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

CMD ["npm", "start"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  discord-backend:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=mysql://postgres:password@db:5432/discord_stream
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: mysql:8.0
    environment:
      - MYSQL_DATABASE=discord_stream
      - MYSQL_ROOT_PASSWORD=password
    volumes:
      - mysql_data:/var/lib/mysql
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  mysql_data:
  redis_data:
```

## Security

- **JWT Authentication** - Secure token-based authentication
- **CORS Protection** - Configurable CORS policies
- **Helmet.js** - Security headers and CSP
- **Input Validation** - Message content validation
- **Error Handling** - Comprehensive error logging

## Performance

- **Socket.IO Optimization** - Configurable ping/pong intervals
- **Memory Management** - Proper cleanup on disconnect
- **Graceful Shutdown** - Clean resource cleanup

## Troubleshooting

### Common Issues

1. **Discord Bot Not Connecting**
   - Verify bot token is correct
   - Check bot has required permissions
   - Ensure bot is added to servers

2. **Socket.IO Connection Issues**
   - Verify CORS configuration
   - Check authentication token
   - Ensure frontend URL is correct

### Logs

The server provides detailed logging:

- `🔐` - Authentication events
- `🔗` - Connection events
- `📨` - Message events
- `👥` - Channel join/leave events
- `📊` - Statistics and metrics
- `❌` - Error events
- `✅` - Success events

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
