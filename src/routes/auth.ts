import { Router } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import type { AuthPayload} from '../types';
import crypto from 'crypto';

const router = Router();

const CLIENT_ID = process.env['DISCORD_CLIENT_ID']!;
const CLIENT_SECRET = process.env['DISCORD_CLIENT_SECRET']!;
const REDIRECT_URI = process.env['DISCORD_REDIRECT_URI']!; 
const FRONTEND_URL = process.env['FRONTEND_URL'] || 'http://localhost:3000';


//Handling user login
router.get('/discord/login', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  res.cookie('discord_oauth_state', state, { httpOnly: true, secure: false, sameSite: 'lax' });
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'identify email',
    state,
    prompt: 'consent'
  });
  res.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
});

//Handling received data from discord
router.get('/discord/callback', async (req, res) => {
  const code = req.query['code'] as string;
  const state = req.query['state'] as string;
  const storedState = req.cookies['discord_oauth_state'];
  res.clearCookie('discord_oauth_state');
  if (!code || !state || !storedState || state !== storedState) {
    return res.redirect(`${FRONTEND_URL}/login?error=invalid_state`);
  }
  try {
    // Exchange code for access token
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      scope: 'identify email'
    });
    const tokenRes = await axios.post('https://discord.com/api/oauth2/token', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    const accessToken = tokenRes.data.access_token;
    // Fetch user info
    const userRes = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const discordUser = userRes.data;
    // Create JWT
    const now = new Date();
    const payload: AuthPayload = {
      discord_id: discordUser.id,
      username: discordUser.username,
      email: discordUser.email,
      is_bot: discordUser.bot || false,
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };
    const token = jwt.sign(payload, process.env['JWT_SECRET']!, { expiresIn: '7d' });
    // Redirect to frontend with token (or set cookie, etc.)
    res.redirect(`${FRONTEND_URL}/?token=${token}`);
  } catch (error) {
    console.error('Discord OAuth2 error:', error);
    res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
  }
});

export default router; 