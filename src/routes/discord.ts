import { Router } from 'express';
import { DiscordBot } from '../services/discord-bot';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// GET /api/discord/channels - Get all accessible Discord text channels for the authenticated user
router.get('/channels', authMiddleware, async (req, res) => {
  try {
    const discord_id = (req.user as any)?.discord_id; // from JWT payload
    if (!discord_id) {
      res.status(401).json({
        status: 'failed',
        data: [],
        message: 'Missing discord_id in user payload'
      });
      return
    }
    const channels = await DiscordBot.getInstance().getUserChannels(discord_id);
    res.json({
      status: 'succeed',
      data: channels,
      message: 'Fetched accessible channels'
    });
  } catch (error) {
    res.json({
      status: 'failed',
      data: [],
      message: 'Failed to fetch channels'
    });
  }
});

export default router; 