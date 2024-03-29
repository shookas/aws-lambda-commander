/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    "@commander/(.*)": "<rootDir>/lib/$1"
  },
  collectCoverage: true,
  collectCoverageFrom: ['./lib/**/*.(js|ts)', '!./lib/types/**/*.ts'],
};