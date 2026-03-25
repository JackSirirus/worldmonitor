# UI Refactoring Guide

## Overview

This document outlines the plan for refactoring WorldMonitor from class-based components to modern React with Zustand.

## Current State

- **App.ts**: 3507 lines, class-based component
- **Panels**: Class components extending `Panel` base class
- **State**: Scattered across components, no centralized store

## Target State

- **App.ts**: React functional component using layout components
- **Panels**: Functional components with Zustand stores
- **State**: Centralized in Zustand stores

## New Architecture

```
src/
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx      # Main layout wrapper
│   │   ├── PanelContainer.tsx # Panel wrapper
│   │   └── index.ts
│   └── panels/               # New panel components
├── stores/                    # Zustand stores
│   ├── news.ts
│   ├── task.ts
│   ├── report.ts
│   └── ui.ts
└── hooks/
    ├── useWebSocket.ts
    └── useApi.ts
```

## Step-by-Step Plan

### Phase 1: Create Layout Components (Done)
- [x] AppLayout - main layout wrapper
- [x] PanelContainer - panel wrapper with common features
- [x] NewsPanelModern - example using Zustand

### Phase 2: Extract Stores (Done)
- [x] news.ts - news data and filters
- [x] task.ts - task management
- [x] report.ts - report data
- [x] ui.ts - UI state (theme, sidebar, etc.)

### Phase 3: Refactor Panels

#### 3.1 NewsPanel (TODO)
```tsx
// Old
export class NewsPanel extends Panel {
  constructor(id: string, title: string) {
    super({ id, title, showCount: true });
    // 500+ lines of code
  }
}

// New
export function NewsPanel({ category, title }: Props) {
  const { items, fetchNews } = useNewsStore();
  useEffect(() => fetchNews(), [category]);
  // ~50 lines
}
```

#### 3.2 MarketPanel (TODO)
- Extract market data fetching to store
- Convert to functional component

#### 3.3 InsightsPanel (TODO)
- Use report store
- Convert to functional component

### Phase 4: Main App Refactor

#### 4.1 Replace App.ts Structure
```tsx
// Old
export class App extends Document {
  constructor() {
    // 3500+ lines
  }
}

// New
export function App() {
  return (
    <AppLayout
      header={<Header />}
      leftSidebar={<NewsSidebar />}
      mainContent={<Map />}
      rightSidebar={<RightPanel />}
    />
  );
}
```

#### 4.2 Migrate Map
- Keep existing DeckGL map
- Wrap in functional component

#### 4.3 Sidebar Panels
- Convert each news panel to functional component
- Use NewsPanelModern as template

## Migration Checklist

- [ ] Create layout components (Done)
- [ ] Extract news store (Done)
- [ ] Create NewsPanelModern (Done)
- [ ] Refactor NewsPanel
- [ ] Refactor MarketPanel
- [ ] Refactor InsightsPanel
- [ ] Refactor App.ts
- [ ] Remove old Panel base class
- [ ] Test all functionality

## Breaking Changes

1. **Panel base class** - Will be replaced
2. **State management** - From scattered to Zustand
3. **Component lifecycle** - From class to functional

## Compatibility

- Keep old components working during transition
- Use feature flags if needed
- Test incrementally

## Files to Modify

1. `src/App.ts` - Main refactor
2. `src/components/NewsPanel.ts` - Convert to functional
3. `src/components/MarketPanel.ts` - Convert to functional
4. `src/components/InsightsPanel.ts` - Convert to functional
5. `src/components/Panel.ts` - Can be deprecated

## Testing Strategy

1. Test each new component in isolation
2. Verify API integration
3. Check WebSocket updates
4. Test responsive behavior
5. Performance testing (virtual scrolling)

## Performance Considerations

- Use virtual scrolling for long lists
- Memoize expensive computations
- Lazy load non-critical components
- Monitor bundle size
