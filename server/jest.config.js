module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./__tests__/setup.js'],
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/__tests__/**/*.test.js'],
  testTimeout: 10000,
  verbose: true,
  collectCoverageFrom: [
    'routes/**/*.js',
    'models/**/*.js',
    '!**/node_modules/**',
    '!**/__tests__/**'
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  }
};
