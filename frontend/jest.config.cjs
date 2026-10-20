/** Unit tests cover pure logic (calculations, schemas, storage, uploads). */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }] },
};
