/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  transform: { '^.+\\.tsx?$': 'ts-jest' },
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
}

module.exports = config
