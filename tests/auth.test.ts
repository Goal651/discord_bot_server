import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import authRouter from '../src/routes/auth';
import nock from 'nock';

const app = express();
app.use(cookieParser());
app.use('/api/auth', authRouter);

describe('Discord OAuth2 Auth Routes', () => {
    test('should handle callback with valid state and code', async () => {
        // Step 1: Get state and cookie from login
        const loginRes = await request(app).get('/api/auth/discord/login');
        const location = loginRes.headers['location'];
        if (!location) throw new Error('No redirect location header');
        const state = new URL(location).searchParams.get('state');
        if (!state) throw new Error('No state in redirect URL');
        const cookies = loginRes.headers['set-cookie'];
        if (!cookies) throw new Error('No set-cookie header');
        const cookieHeader = Array.isArray(cookies) ? cookies.join('; ') : cookies;

        // Step 2: Mock Discord API responses
        nock('https://discord.com')
            .post('/api/oauth2/token')
            .reply(200, { access_token: 'fake_access_token' });

        nock('https://discord.com')
            .get('/api/users/@me')
            .reply(200, {
                id: '123',
                username: 'testuser',
                email: 'test@example.com',
                bot: false
            });

        // Step 3: Call the callback endpoint with the extracted state and cookie
        const callbackRes = await request(app)
            .get('/api/auth/discord/callback')
            .set('Cookie', cookieHeader)
            .query({ code: 'fakecode', state });

        // Step 4: Assert redirect to frontend with token
        expect(callbackRes.status).toBe(302);
        expect(callbackRes.headers['location']).toMatch(/token=/);
    });
});