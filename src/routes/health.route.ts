import express from 'express';
import type { Server } from 'socket.io';
import { HealthStatus, Metrics } from '../types';
import { DiscordBot } from '../services/discordBot.service';

export const createHealthRouter = (io: Server) => {
    const router = express.Router();
    const discordNamespace = io.of('/discord');
    // Health check endpoint
    router.get('/health', async (req, res) => {
        try {


            const healthStatus: HealthStatus = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                connections: {
                    total: io.engine.clientsCount,
                    discord: discordNamespace.sockets.size
                },
                memory: {
                    used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
                    total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
                },
                environment: process.env['NODE_ENV'] || 'development'
            };

            const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
            res.status(statusCode).json(healthStatus);

        } catch (error) {
            console.error('Health check error:', error);
            res.status(503).json({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: 'Health check failed',
                uptime: process.uptime()
            });
        }
    });

    // Metrics endpoint
    router.get('/metrics', async (req, res) => {
        try {
            const discordNamespace = io.of('/discord');
            const rooms = Array.from(discordNamespace.adapter.rooms.keys());
            const channelRooms = rooms.filter(room => room.startsWith('channel:'));

            const metrics: Metrics = {
                connections: {
                    total: io.engine.clientsCount,
                    discord: discordNamespace.sockets.size
                },
                rooms: {
                    total: rooms.length,
                    channels: channelRooms.length,
                    activeChannels: channelRooms.map(room => ({
                        channelId: room.replace('channel:', ''),
                        userCount: discordNamespace.adapter.rooms.get(room)?.size || 0
                    }))
                },
                performance: {
                    eventLoopDelay: process.hrtime.bigint(),
                    cpuUsage: process.cpuUsage()
                }
            };

            res.json(metrics);

        } catch (error) {
            console.error('Metrics error:', error);
            res.status(500).json({
                error: 'Failed to get metrics',
                timestamp: new Date().toISOString()
            });
        }
    });

    // Detailed status endpoint
    router.get('/status', async (req, res) => {
        try {
            const discordBot = new DiscordBot(discordNamespace);

            const status = {
                server: {
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    cpu: process.cpuUsage(),
                    pid: process.pid,
                    version: process.version,
                    platform: process.platform
                },
                connections: {
                    total: io.engine.clientsCount,
                    discord: discordNamespace.sockets.size,
                    rooms: discordNamespace.adapter.rooms.size
                },
                discord: {
                    botConnected: discordBot ? true : false,
                    subscriptionStats: discordBot ? discordBot.getSubscriptionStats() : null
                },
                database: {
                    connected: true // Assuming database is always connected for now
                },
                environment: {
                    nodeEnv: process.env['NODE_ENV'] || 'development',
                    port: process.env['PORT'] || 3001,
                    frontendUrl: process.env['FRONTEND_URL'] || 'http://localhost:3000'
                }
            };

            res.json(status);

        } catch (error) {
            console.error('Status error:', error);
            res.status(500).json({
                error: 'Failed to get status',
                timestamp: new Date().toISOString()
            });
        }
    });

    // Ready endpoint for load balancers
    router.get('/ready', (req, res) => {
        res.status(200).json({
            status: 'ready',
            timestamp: new Date().toISOString()
        });
    });

    // Live endpoint for liveness probes
    router.get('/live', (req, res) => {
        res.status(200).json({
            status: 'alive',
            timestamp: new Date().toISOString()
        });
    });

    return router;
}; 