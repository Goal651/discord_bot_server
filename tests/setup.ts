// Jest setup file
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env' });

// Set test environment
process.env['NODE_ENV'] = 'test';


jest.setTimeout(10000); 