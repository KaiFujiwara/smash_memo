/**
 * Jest設定ファイル
 * 
 * Next.jsプロジェクトでJestを使用するための設定を定義します。
 * TypeScript、React、Next.jsの機能をテスト環境で使用できるようにします。
 */

const nextJest = require('next/jest')

/** @type {import('jest').Config} */
const createJestConfig = nextJest({
  // Next.jsアプリケーションのディレクトリを指定
  dir: './',
})

// Jest用のカスタム設定
const config = {
  // テスト環境をjsdomに設定（ブラウザ環境をシミュレート）
  testEnvironment: 'jsdom',
  
  // セットアップファイルの指定
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // テストファイルのパターン
  testMatch: [
    '**/__tests__/**/*.(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)'
  ],
  
  // モジュールパスのマッピング（Next.jsの@/ aliasに対応）
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  
  // 無視するディレクトリ
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
  ],
  
  // 無視するファイル
  modulePathIgnorePatterns: [
    '<rootDir>/.next/',
  ],
}

module.exports = createJestConfig(config) 