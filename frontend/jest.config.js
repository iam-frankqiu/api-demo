module.exports = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1',
    },
    transform: {
      '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', {
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          ['@babel/preset-react', { runtime: 'automatic' }]
        ]
      }]
    },
    moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],
    testMatch: [
      '<rootDir>/src/**/__tests__/**/*.(js|jsx|ts|tsx)',
      '<rootDir>/src/**/*.(test|spec).(js|jsx|ts|tsx)'
    ],
    transformIgnorePatterns: [
      'node_modules/(?!(react-window|react-virtualized|@babel/runtime)/)'
    ]
  };