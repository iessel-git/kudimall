/**
 * Jest Setup File
 * Runs before all tests to configure test environment
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only-minimum-32-characters-required';
process.env.DB_USER = 'test_user';
process.env.DB_HOST = 'localhost';
process.env.DB_NAME = 'test_db';
process.env.DB_PASSWORD = 'test_password';
process.env.DB_PORT = '5432';

// Mock console methods to reduce test noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error for debugging failing tests
  error: console.error,
};
