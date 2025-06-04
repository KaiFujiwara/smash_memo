# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 application using App Router for a Super Smash Bros. character matchup memo application. The project uses AWS Amplify for backend services (authentication, GraphQL API, DynamoDB), with TypeScript, Tailwind CSS, and Shadcn/ui for the frontend.

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

## Architecture Overview

### **Directory Structure & Patterns**
```
app/
├── (protected)/          # Authenticated routes with shared layout
│   ├── dashboard/        # Main dashboard
│   ├── memo-settings/    # Memo item configuration
│   └── layout.tsx        # Authentication enforcement
├── (public)/             # Public routes (login, legal pages)
└── layout.tsx            # Root layout with providers

components/ui/            # Shadcn/ui base components
hooks/                    # Global custom hooks
services/                 # External API abstraction layer
providers/                # React Context providers
contexts/                 # React Context definitions
types/                    # TypeScript type definitions
lib/                      # Utility functions
__tests__/                # Test files mirroring source structure
```

### **Authentication Flow**
- **Route Protection**: `app/(protected)/layout.tsx` enforces authentication
- **State Management**: `AuthContext` + `AuthProvider` for global auth state
- **Service Layer**: `authService.ts` abstracts AWS Amplify authentication
- **Custom Hook**: `useAuth()` provides clean access to auth state

### **State Management Patterns**
- **Global State**: React Context for authentication
- **Feature State**: Custom hooks for complex component state
- **Hook Composition**: Multiple specialized hooks combined (e.g., memo settings uses `useMemoActions`, `useDragDropActions`, `useSaveActions`)
- **State Updates**: Centralized update functions passed between hooks

### **Component Architecture**
- **UI Components**: Shadcn/ui with Radix primitives and CVA for variants
- **Feature Components**: Organized by page/feature in respective directories
- **Compound Components**: Complex features split into focused sub-components
- **Props Interfaces**: Explicit TypeScript interfaces for all props

### **Data Flow & API**
- **Service Layer**: Pure functions for AWS Amplify operations (`authService.ts`, `memoItemService.ts`)
- **GraphQL**: AWS AppSync with auto-generated types
- **Error Handling**: Consistent error transformation and toast notifications via Sonner
- **Loading States**: Explicit loading states in all async operations

## TypeScript Conventions

### **Type Organization**
```typescript
// All types exported from types/index.ts
export type { User, AuthError } from './auth'
export type { MemoItem, DragDropResult } from './memo'

// Feature-specific types in dedicated files
// types/auth.ts, types/memo.ts, etc.
```

### **Interface Patterns**
```typescript
// Service interfaces for external operations
interface CreateMemoItemParams {
  name: string
  order: number
  visible: boolean
}

// Component props interfaces
interface MemoItemProps {
  item: MemoItem
  onStartEditing: (item: MemoItem) => void
  // ... other props
}

// Hook interfaces for state management
interface MemoSettingsState {
  items: MemoItem[]
  isLoading: boolean
  editingId: string | null
  // ... other state
}
```

## Testing Conventions

### **Test Structure**
Tests follow the source directory structure in `__tests__/`:
```
__tests__/
├── services/             # Service layer tests
├── hooks/                # Custom hook tests
└── app/                  # Component tests (mirroring app structure)
    └── memo-settings/
        ├── hooks/        # Feature-specific hooks
        └── components/   # Feature components
```

### **Testing Patterns**
- **Service Tests**: Mock external dependencies (AWS Amplify), test error handling
- **Hook Tests**: Use `@testing-library/react` `renderHook`, test state changes
- **Component Tests**: Mock child components, test user interactions
- **Error Handling**: Suppress `console.error` in error case tests

### **Mock Conventions**
```typescript
// Service mocking
jest.mock('aws-amplify/auth', () => ({
  getCurrentUser: jest.fn(),
  signOut: jest.fn(),
}))

// Component mocking for complex dependencies
jest.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children }: any) => children,
  Droppable: ({ children }: any) => children(...),
}))
```

## Code Style Guidelines

### **From Cursor Rules (.cursor/rules/)**
- **Component Style**: Named exports preferred, functional components only
- **TypeScript**: Interfaces over types, avoid enums, comprehensive typing
- **Performance**: Minimize 'use client', prefer React Server Components
- **UI/Styling**: Shadcn UI + Radix + Tailwind, mobile-first responsive design
- **File Structure**: Export component, sub-components, helpers, static content, types

### **Naming Conventions**
- **Directories**: Lowercase with dashes (`memo-settings/`)
- **Components**: PascalCase with named exports
- **Hooks**: camelCase starting with `use`
- **Services**: camelCase with descriptive names
- **Types**: PascalCase interfaces/types

### **Comment Standards**
All files include header comments explaining purpose and architecture context. Functions include JSDoc comments with learning context for React/Next.js concepts.

## AWS Amplify Integration

### **Backend Structure**
```
amplify/
├── backend.ts            # Amplify backend definition
├── auth/resource.ts      # Cognito configuration
├── data/resource.ts      # GraphQL schema and DynamoDB
└── scripts/              # Deployment and data initialization scripts
```

### **Environment Setup**
The application connects to AWS Amplify automatically via the configured `amplifyconfiguration.json`. Authentication and data operations use the Amplify JavaScript library v6.

## Common Development Patterns

### **Adding New Features**
1. **Types**: Define interfaces in appropriate `types/` file
2. **Service**: Create service functions for external operations
3. **Hooks**: Create custom hooks for state management
4. **Components**: Build UI components with proper TypeScript interfaces
5. **Tests**: Add comprehensive tests following existing patterns

### **Error Handling**
- Service layer transforms errors to consistent format
- Components display errors via toast notifications
- Loading states prevent user interaction during async operations
- Graceful fallbacks for non-critical failures

### **Performance Considerations**
- Minimize client components ('use client' directive)
- Use React.memo for expensive re-renders
- Implement proper key props for lists
- Lazy load non-critical components with dynamic imports