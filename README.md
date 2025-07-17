# Discord Stream Backend

A robust Socket.IO backend for real-time Discord message streaming with authentication, rate limiting, and comprehensive error handling.

## Features

- 🔐 **JWT Authentication** - Secure user authentication with token-based sessions
- 📡 **Socket.IO Integration** - Real-time bidirectional communication
- 🤖 **Discord Bot Integration** - Seamless Discord API integration
- 🗄️ **Database Persistence** - MySQL database for message storage
- ⚡ **Rate Limiting** - Redis-based rate limiting with configurable limits
- 🏥 **Health Monitoring** - Comprehensive health checks and metrics
- 🔒 **Security** - Helmet.js security headers and CORS protection
- 📊 **Metrics** - Real-time connection and performance metrics
- 🛡️ **Error Handling** - Comprehensive error handling and logging

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Web Framework**: Express.js
- **Real-time**: Socket.IO
- **Database**: MySQL with connection pooling
- **Cache**: Redis for rate limiting
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
   cd backend
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Set up database:**
   ```sql
   CREATE DATABASE discord_stream;
   ```

4. **Start the server:**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm run build
   npm start
   ```

## Environment Variables

```env
# Server Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=discord_stream

# Redis
REDIS_URL=redis://localhost:6379

# Discord Bot
DISCORD_BOT_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Socket.IO Configuration
SOCKET_PING_TIMEOUT=60000
SOCKET_PING_INTERVAL=25000
SOCKET_MAX_HTTP_BUFFER_SIZE=1000000
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
- `request_history` - Get message history
- `send_message` - Send a message to Discord
- `typing` - Send typing indicator

#### Server to Client

- `channels_list` - Available channels
- `user_info` - User information
- `message` - New message received
- `message_update` - Message edited
- `message_delete` - Message deleted
- `messages_bulk` - Message history
- `channel_update` - Channel information
- `user_joined` - User joined channel
- `user_left` - User left channel
- `typing_start` - User started typing
- `typing_stop` - User stopped typing
- `error` - Error notification
- `rate_limited` - Rate limit exceeded

## Socket.IO Connection

### Frontend Connection Example

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001/discord', {
  auth: {
    token: 'your_jwt_token_here'
  }
});

// Listen for messages
socket.on('message', (message) => {
  console.log('New message:', message);
});

// Join a channel
socket.emit('join_channel', { channelId: '123456789' }, (response) => {
  if (response.success) {
    console.log('Joined channel successfully');
  }
});

// Send a message
socket.emit('send_message', {
  channelId: '123456789',
  content: 'Hello, Discord!'
}, (response) => {
  if (response.success) {
    console.log('Message sent:', response.messageId);
  }
});
```

## Database Schema

### Messages Table
```sql
CREATE TABLE messages (
  id VARCHAR(255) PRIMARY KEY,
  discord_id VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author_discord_id VARCHAR(255) NOT NULL,
  channel_id VARCHAR(255) NOT NULL,
  server_id VARCHAR(255) NOT NULL,
  attachments JSON,
  embeds JSON,
  reactions JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  edited_at TIMESTAMP NULL,
  edited BOOLEAN DEFAULT FALSE,
  INDEX idx_channel_created (channel_id, created_at),
  INDEX idx_author (author_discord_id)
);
```

### Users Table
```sql
CREATE TABLE users (
  discord_id VARCHAR(255) PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  avatar_url TEXT,
  is_bot BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Channels Table
```sql
CREATE TABLE channels (
  id VARCHAR(255) PRIMARY KEY,
  discord_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  server_id VARCHAR(255) NOT NULL,
  position INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_server (server_id)
);
```

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

```
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
- **Rate Limiting** - Redis-based rate limiting per user
- **CORS Protection** - Configurable CORS policies
- **Helmet.js** - Security headers and CSP
- **Input Validation** - Message content validation
- **Error Handling** - Comprehensive error logging

## Performance

- **Connection Pooling** - MySQL connection pooling
- **Redis Caching** - Rate limiting and session storage
- **Socket.IO Optimization** - Configurable ping/pong intervals
- **Memory Management** - Proper cleanup on disconnect
- **Graceful Shutdown** - Clean resource cleanup

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check MySQL service is running
   - Verify database credentials in `.env`
   - Ensure database exists

2. **Discord Bot Not Connecting**
   - Verify bot token is correct
   - Check bot has required permissions
   - Ensure bot is added to servers

3. **Redis Connection Failed**
   - Check Redis service is running
   - Verify Redis URL in `.env`
   - Check Redis authentication

4. **Socket.IO Connection Issues**
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

MIT License - see LICENSE file for details. # discord_bot_server
# discord_bot_server
# discord_bot_server
# discord_bot_server
# discord_bot_server
