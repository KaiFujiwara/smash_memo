# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference

For detailed project information, refer to the documentation in the `.claude/` directory:

- **[プロジェクト概要](.claude/project-overview.md)**: 技術スタック、機能、プロジェクト構造の哲学
- **[アーキテクチャ・設計](.claude/architecture-design.md)**: 詳細なシステムアーキテクチャ、パターン、設計決定
- **[アプリケーション仕様](.claude/application-specifications.md)**: ユーザー要件、技術仕様、データモデル
- **[開発方針・原則](.claude/development-principles.md)**: t-wadaが推奨する開発アプローチと品質原則

## Development Commands

### Essential Commands
```bash
# Development
npm run dev                 # Start development server
npm run build              # Production build
npm run start              # Start production server

# Testing
npm test                   # Run all tests
npm test -- __tests__/path/to/specific/     # Run specific test directory
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage report

# Linting & Quality
npm run lint               # Run ESLint

# Amplify/Backend
npm run init-data          # Deploy initial data to backend
```

### Single Test Execution
```bash
# Run specific test file
npm test -- __tests__/services/authService.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should handle authentication"

# Run tests for specific component/hook
npm test -- __tests__/app/memo-settings/
```

## Project Summary

Next.js 15 application using App Router for a Super Smash Bros. character matchup memo application. Built with AWS Amplify for backend services, TypeScript, Tailwind CSS, and Shadcn/ui.

## Documentation Updates

If you need to update project documentation based on user requirements or changes, modify the appropriate files in the `.claude/` directory:

- Update `.claude/project-overview.md` for changes to technology stack, features, or project philosophy
- Update `.claude/architecture-design.md` for changes to system architecture, patterns, or design decisions  
- Update `.claude/application-specifications.md` for changes to user requirements, technical specs, or data models
- Update `.claude/development-principles.md` for changes to development approaches, testing strategies, or quality principles

This main CLAUDE.md file should remain focused on development commands and quick reference information.